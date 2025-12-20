import requests
import psycopg2
import time

# ==========================
# MANUAL CONFIG
# ==========================
SFU_API_BASE = "https://www.sfu.ca/bin/wcm/course-outlines"

YEARS = ["2026"]      # freshest authoritative data
TERMS = ["spring"]      # one term at a time (avoid timeouts)

REQUEST_TIMEOUT = 20
SLEEP_BETWEEN_CALLS = 0.25  # be polite to SFU API

# ==========================
# DB CONFIG
# ==========================
DB_HOST = "your-db-host.supabase.com"
DB_NAME = "your-db-name"
DB_USER = "your-db-user"
DB_PASS = "your-db-password"

# ==========================
# HELPERS
# ==========================
def is_meaningful(value):
    return value is not None and str(value).strip() not in ("", "0")


def safe_int(value):
    try:
        return int(value)
    except Exception:
        return None


# ==========================
# DB QUERIES
# ==========================
def get_courses(cur):
    """
    Returns:
    course_id, dept_code, course_number,
    description, units, degree_level,
    prerequisites, corequisites, designation
    """
    cur.execute("""
        SELECT
            c.course_id,
            d.dept_code,
            c.course_number,
            c.description,
            c.units,
            c.degree_level,
            c.prerequisites,
            c.corequisites,
            c.designation
        FROM courses c
        JOIN departments d ON c.dept_id = d.dept_id
        ORDER BY d.dept_code, c.course_number
    """)
    return cur.fetchall()


def update_course(cur, course_id, updates):
    if not updates:
        return

    sets = []
    values = []

    for col, val in updates.items():
        sets.append(f"{col} = %s")
        values.append(val)

    values.append(course_id)

    sql = f"""
        UPDATE courses
        SET {', '.join(sets)}, updated_at = NOW()
        WHERE course_id = %s
    """

    cur.execute(sql, values)


# ==========================
# API CALLS
# ==========================
def fetch_first_section(year, term, dept_code, course_number):
    """
    Fetch outline index and grab first available section.
    """
    url = f"{SFU_API_BASE}?{year}/{term}/{dept_code}/{course_number}"
    resp = requests.get(url, timeout=REQUEST_TIMEOUT)

    if resp.status_code != 200:
        return None

    sections = resp.json()
    if not sections:
        return None

    return sections[0].get("value")


def fetch_course_detail(year, term, dept_code, course_number, section):
    url = f"{SFU_API_BASE}?{year}/{term}/{dept_code}/{course_number}/{section}"
    return requests.get(url, timeout=REQUEST_TIMEOUT)


# ==========================
# MAIN LOGIC
# ==========================
def main():
    print("\n===== POPULATE COURSES (DEEP FIRST PASS) START =====")

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

            for (
                course_id, dept_code, course_number,
                description, units, degree_level,
                prerequisites, corequisites, designation
            ) in courses:

                print(f"\n[COURSE] {dept_code} {course_number}")

                # Skip if already fully populated
                if all(map(is_meaningful, [
                    description, units, degree_level,
                    prerequisites, corequisites, designation
                ])):
                    print("[SKIP] All deep fields already set")
                    continue

                updated = False

                for year in YEARS:
                    for term in TERMS:
                        print(f"[API] Fetching {year} {term}")

                        try:
                            section = fetch_first_section(
                                year,
                                term,
                                dept_code.lower(),
                                course_number.lower()
                            )

                            if not section:
                                print("[MISS] No sections found")
                                continue

                            resp = fetch_course_detail(
                                year,
                                term,
                                dept_code.lower(),
                                course_number.lower(),
                                section.lower()
                            )

                            if resp.status_code != 200:
                                print("[MISS] Section fetch failed")
                                continue

                            data = resp.json()
                            info = data.get("info", {})

                            # Normalize JSON identifiers
                            json_dept = str(info.get("dept", "")).lower()
                            json_num = str(info.get("number", "")).lower()

                            if json_dept != dept_code.lower() or json_num != course_number.lower():
                                print("[WARN] JSON mismatch, skipping")
                                continue

                            updates = {}

                            if not is_meaningful(description) and is_meaningful(info.get("description")):
                                updates["description"] = info["description"]

                            if not is_meaningful(units):
                                u = safe_int(info.get("units"))
                                if u is not None:
                                    updates["units"] = u

                            if not is_meaningful(degree_level) and is_meaningful(info.get("degreeLevel")):
                                updates["degree_level"] = info["degreeLevel"]

                            if not is_meaningful(prerequisites) and is_meaningful(info.get("prerequisites")):
                                updates["prerequisites"] = info["prerequisites"]

                            if not is_meaningful(corequisites) and is_meaningful(info.get("corequisites")):
                                updates["corequisites"] = info["corequisites"]

                            if not is_meaningful(designation) and is_meaningful(info.get("designation")):
                                updates["designation"] = info["designation"]

                            if updates:
                                print(f"[DB] UPDATE → {list(updates.keys())}")
                                update_course(cur, course_id, updates)
                                updated = True
                            else:
                                print("[DB] Nothing new to update")

                            break  # stop after first successful section

                        except requests.exceptions.RequestException as e:
                            print(f"[WARN] API error: {e}")
                        finally:
                            time.sleep(SLEEP_BETWEEN_CALLS)

                    if updated:
                        break

                if not updated:
                    print("[MISS] No deep data found")

    conn.close()
    print("\n===== POPULATE COURSES (DEEP FIRST PASS) COMPLETE =====")


if __name__ == "__main__":
    main()
