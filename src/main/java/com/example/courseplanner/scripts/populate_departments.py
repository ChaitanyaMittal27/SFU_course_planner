import os
import requests
import psycopg2
from psycopg2.extras import execute_batch

# ==========================
# CONFIG
# ==========================
SFU_API_BASE = "https://www.sfu.ca/bin/wcm/course-outlines"
YEAR = "2025"
TERM = "spring"

# ==========================
# ENV VARS
# ==========================
DB_URL = "postgresql://<your-db-host>:5432/postgres"
DB_USER = "postgres.rxenypwqulctrseftdke"
DB_PASS = "course_planner"

if not all([DB_URL, DB_USER, DB_PASS]):
    raise RuntimeError("Missing DB environment variables")

# ==========================
# FETCH DEPARTMENTS
# ==========================
# url:  /bin/wcm/course-outlines?2015/summer
# returns: [ {text: "ALS",value: "als"}, {text: "ARCH", value: "arch"}, ... ]
def fetch_departments():
    url = f"{SFU_API_BASE}?{YEAR}/{TERM}"
    print(f"[API] Fetching departments from: {url}")

    resp = requests.get(url, timeout=20)
    resp.raise_for_status()

    data = resp.json()
    print(f"[API] Departments fetched: {len(data)}")

    departments = []
    for d in data:
        name = d.get("text") # e.g., "ALS"
        dept_code = d.get("value") # e.g., "als"
        departments.append((dept_code, name)) # e.g., ("als", "ALS")

    return departments

# ==========================
# INSERT INTO DB
# ==========================
def insert_departments(departments):
    sql = """
        INSERT INTO departments (dept_code, name)
        VALUES (%s, %s)
        ON CONFLICT (dept_code) DO NOTHING
    """

    print("\n[DB] Connecting to database...")
    conn = psycopg2.connect(
        DB_URL,
        user=DB_USER,
        password=DB_PASS,
        sslmode="require"
    )

    with conn:
        with conn.cursor() as cur:
            print("[DB] Inserting departments...")
            execute_batch(cur, sql, departments, page_size=50)

    conn.close()
    print("[DB] Insert complete")

# ==========================
# PRETTY PRINT SUMMARY
# ==========================
def print_summary(departments):
    print("\n===== DEPARTMENTS (PREVIEW) =====")
    print("dept_code | name")
    print("------------------")
    for d in departments[:10]:
        print(f"{d[0]:<9} | {d[1]}")
    print(f"... ({len(departments)} total)")
    print("================================")

# ==========================
# MAIN
# ==========================
if __name__ == "__main__":
    print("\n===== POPULATE_DEPARTMENTS START =====")

    departments = fetch_departments()
    print_summary(departments)
    insert_departments(departments)

    print("\n===== POPULATE_DEPARTMENTS COMPLETE =====")
