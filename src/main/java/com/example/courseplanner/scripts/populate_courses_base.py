import requests
import psycopg2
from datetime import datetime

# ==========================
# CONFIG
# ==========================
SFU_API_BASE = "https://www.sfu.ca/bin/wcm/course-outlines"

YEARS = ["2026"] # change per execution
TERMS = ["spring", "summer", "fall"]

DB_HOST = "your-db-host.supabase.com"
DB_NAME = "your-db-name"
DB_USER = "your-db-user"
DB_PASS = "your-db-password"

# ==========================
# HELPERS
# ==========================
def is_meaningful(value):
    """
    Used to decide whether a value should overwrite an existing DB value.
    """
    return value is not None and str(value).strip() not in ("", "0")

# ==========================
# DB HELPERS
# ==========================
def get_departments(cur):
    """
    Fetch all departments from DB.
    Returns: [(dept_id, dept_code), ...]
    """
    cur.execute("""
        SELECT dept_id, dept_code
        FROM departments
        ORDER BY dept_code
    """)
    return cur.fetchall()

# ==========================
# API FETCH
# ==========================
def fetch_courses(year, term, dept_code):
    """
    Fetch course list for a given year/term/department.
    Endpoint returns: course_number + title only.
    """
    url = f"{SFU_API_BASE}?{year}/{term}/{dept_code.lower()}"
    print(f"[API] Fetching courses | {year} {term} {dept_code}")

    resp = requests.get(url, timeout=20)

    if resp.status_code != 200:
        print(f"[API] ❌ {year} {term} {dept_code} -> {resp.status_code}")
        return []

    data = resp.json()
    print(f"[API] ✅ {len(data)} courses found")
    return data

# ==========================
# UPSERT LOGIC
# ==========================
def upsert_course(cur, dept_id, course_number, title):
    """
    Insert course if not exists.
    Update title ONLY if:
      - new title is meaningful
      - existing title is NULL
    """
    cur.execute("""
        SELECT course_id, title
        FROM courses
        WHERE dept_id = %s AND course_number = %s
    """, (dept_id, course_number))

    row = cur.fetchone()

    # ------------------
    # INSERT
    # ------------------
    if row is None:
        print(f"[DB] INSERT course {course_number} | title='{title}'")
        cur.execute("""
            INSERT INTO courses (dept_id, course_number, title)
            VALUES (%s, %s, %s)
        """, (dept_id, course_number, title))
        return

    # ------------------
    # CONDITIONAL UPDATE
    # ------------------
    course_id, existing_title = row

    if existing_title is None and is_meaningful(title):
        print(f"[DB] UPDATE title for {course_number} -> '{title}'")
        cur.execute("""
            UPDATE courses
            SET title = %s,
                updated_at = NOW()
            WHERE course_id = %s
        """, (title, course_id))
    else:
        print(f"[DB] SKIP {course_number} (title already set)")

# ==========================
# MAIN
# ==========================
def main():
    print("\n===== POPULATE COURSES (BASE) START =====")
    print(f"Started at: {datetime.now()}\n")

    conn = psycopg2.connect(
        host=DB_HOST,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASS,
        sslmode="require"
    )

    with conn:
        with conn.cursor() as cur:
            departments = get_departments(cur)
            print(f"[DB] Loaded {len(departments)} departments\n")

            for year in YEARS:
                for term in TERMS:
                    print(f"\n===== {year.upper()} {term.upper()} =====")

                    for dept_id, dept_code in departments:
                        courses = fetch_courses(year, term, dept_code)

                        for c in courses:
                            course_number = c.get("value")
                            title = c.get("title")

                            if not is_meaningful(course_number):
                                continue

                            upsert_course(
                                cur,
                                dept_id,
                                course_number,
                                title
                            )

    conn.close()
    print("\n===== POPULATE COURSES (BASE) COMPLETE =====")
    print(f"Finished at: {datetime.now()}")

# ==========================
# ENTRY
# ==========================
if __name__ == "__main__":
    main()
