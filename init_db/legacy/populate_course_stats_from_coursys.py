import requests
import psycopg2
from psycopg2.extras import Json
from datetime import datetime

# ==========================
# CONFIG
# ==========================
COURSESYS_BROWSE = "https://coursys.sfu.ca/browse/"

YEARS = ["2023", "2024", "2025"]
TERMS = ["spring", "summer", "fall"]

DB_HOST = "your-db-host.example.com"
DB_NAME = "postgres"
DB_USER = "your-db-user"
DB_PASS = "your-db-password"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (SFUCoursePlanner)"
}

# ==========================
# HELPERS
# ==========================
def parse_enrollment(text):
    """
    Parse '96/100' -> (96, 100)
    """
    try:
        enrolled, capacity = text.split("/")
        return int(enrolled), int(capacity)
    except Exception:
        return 0, 0

# ==========================
# DB HELPERS
# ==========================
def get_courses(cur):
    """
    Fetch all courses with department codes.
    """
    cur.execute("""
        SELECT c.course_id, d.dept_code, c.course_number
        FROM courses c
        JOIN departments d ON d.dept_id = c.dept_id
        ORDER BY d.dept_code, c.course_number
    """)
    return cur.fetchall()

def course_stats_exists(cur, course_id):
    cur.execute("""
        SELECT 1
        FROM course_stats
        WHERE course_id = %s
    """, (course_id,))
    return cur.fetchone() is not None

# ==========================
# API FETCH
# ==========================
def fetch_coursys_sections(dept, number, semester_code):
    """
    Fetch CourseSys browse results for one course in one term.
    """
    params = {
        "subject[]": dept.upper(),
        "number[]": number,
        "semester[]": semester_code,
        "tabledata": "yes"
    }

    print(f"[HTTP] {dept.upper()} {number} | semester={semester_code}")
    resp = requests.get(COURSESYS_BROWSE, params=params, headers=HEADERS, timeout=20)

    if resp.status_code != 200:
        print(f"[HTTP] ❌ {dept.upper()} {number} ({semester_code})")
        return []

    return resp.json().get("data", [])

# ==========================
# MAIN
# ==========================
def main():
    print("\n===== POPULATE COURSE_STATS FROM COURSESYS START =====")
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
            courses = get_courses(cur)
            print(f"[DB] Loaded {len(courses)} courses\n")

            for course_id, dept, number in courses:
                if course_stats_exists(cur, course_id):
                    print(f"[SKIP] {dept.upper()} {number} (stats exist)")
                    continue

                total_enrollment = 0
                total_capacity = 0
                offered_terms = {}

                for year in YEARS:
                    for term in TERMS:
                        semester_code = f"{year}{term[0]}a" if term == "fall" else f"{year}{term[:2]}"
                        # NOTE: SFU semester codes are inconsistent; we normalize below

                        # safer mapping
                        if term == "spring":
                            semester_code = f"{year}sp"
                        elif term == "summer":
                            semester_code = f"{year}su"
                        else:
                            semester_code = f"{year}fa"

                        rows = fetch_coursys_sections(dept, number, semester_code)

                        if not rows:
                            continue

                        term_enrolled = 0
                        term_capacity = 0

                        for r in rows:
                            enrolled, capacity = parse_enrollment(r[3])
                            term_enrolled += enrolled
                            term_capacity += capacity

                        if term_capacity > 0:
                            offered_terms.setdefault(year, []).append(term)
                            total_enrollment += term_enrolled
                            total_capacity += term_capacity

                load_percent = None
                if total_capacity > 0:
                    load_percent = round((total_enrollment / total_capacity) * 100, 2)

                print(f"[DB] INSERT stats {dept.upper()} {number}")

                cur.execute("""
                    INSERT INTO course_stats (
                        course_id,
                        total_enrollment,
                        total_capacity,
                        load_percent,
                        offered_terms,
                        last_calculated_at
                    )
                    VALUES (%s, %s, %s, %s, %s, NOW())
                """, (
                    course_id,
                    total_enrollment,
                    total_capacity,
                    load_percent,
                    Json(offered_terms)
                ))

    conn.close()

    print("\n===== POPULATE COURSE_STATS FROM COURSESYS COMPLETE =====")
    print(f"Finished at: {datetime.now()}")

# ==========================
# ENTRY
# ==========================
if __name__ == "__main__":
    main()
