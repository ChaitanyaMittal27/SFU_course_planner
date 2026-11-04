import requests
import psycopg2
from datetime import datetime

# ==========================
# CONFIG
# ==========================
COURSEDIGGERS_API = "https://www.coursediggers.com/pages/search_space"

DB_HOST = "your_database_host_here"
DB_NAME = "your_database_name_here"
DB_USER = "your_database_user_here"
DB_PASS = "your_database_password_here"

HEADERS = {
    "User-Agent": "SFU-Course-Planner/1.0 (academic project)"
}

# ==========================
# HELPERS
# ==========================
def is_meaningful(value):
    return value is not None and str(value).strip() != ""

# ==========================
# DB HELPERS
# ==========================
def get_courses(cur):
    """
    Fetch all courses.
    Returns dict:
      { "CMPT 213": course_id }
    """
    cur.execute("""
        SELECT c.course_id, d.dept_code, c.course_number
        FROM courses c
        JOIN departments d ON c.dept_id = d.dept_id
    """)

    lookup = {}
    for course_id, dept_code, course_number in cur.fetchall():
        key = f"{dept_code.upper()} {course_number.upper()}"
        lookup[key] = course_id

    return lookup

# ==========================
# API FETCH
# ==========================
def fetch_coursediggers_ids():
    """
    Fetch all CourseDiggers course IDs for SFU.
    """
    print("[API] Fetching CourseDiggers ID map (SFU)")

    resp = requests.get(
        COURSEDIGGERS_API,
        params={"school_id": 1},
        headers=HEADERS,
        timeout=30
    )

    if resp.status_code != 200:
        print(f"[API] ❌ Failed ({resp.status_code})")
        return []

    data = resp.json()
    print(f"[API] ✅ Retrieved {len(data)} CourseDiggers entries")

    return data

# ==========================
# UPSERT LOGIC
# ==========================
def upsert_course_digger_map(cur, course_id, digger_course_id):
    cur.execute("""
        INSERT INTO course_digger_map (
            course_id,
            digger_course_id,
            last_verified_at
        )
        VALUES (%s, %s, NOW())
        ON CONFLICT (course_id) DO UPDATE
        SET
            digger_course_id = EXCLUDED.digger_course_id,
            last_verified_at = NOW()
    """, (course_id, digger_course_id))

# ==========================
# MAIN
# ==========================
def main():
    print("\n===== POPULATE COURSE_DIGGER_MAP START =====")
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
            course_lookup = get_courses(cur)
            print(f"[DB] Loaded {len(course_lookup)} courses\n")

            entries = fetch_coursediggers_ids()

            inserted = 0
            skipped = 0

            for entry in entries:
                course_name = entry.get("value")
                digger_course_id = entry.get("data")

                if not is_meaningful(course_name) or not is_meaningful(digger_course_id):
                    continue

                course_name = course_name.upper().strip()

                course_id = course_lookup.get(course_name)
                if not course_id:
                    print(f"[DB] SKIP {course_name} (not in courses table)")
                    skipped += 1
                    continue

                print(f"[DB] UPSERT {course_name} -> digger_id={digger_course_id}")
                upsert_course_digger_map(cur, course_id, digger_course_id)
                inserted += 1

            print(f"\n[DB] Inserted/Updated: {inserted}")
            print(f"[DB] Skipped (missing courses): {skipped}")

    conn.close()

    print("\n===== POPULATE COURSE_DIGGER_MAP COMPLETE =====")
    print(f"Finished at: {datetime.now()}")

# ==========================
# ENTRY
# ==========================
if __name__ == "__main__":
    main()
