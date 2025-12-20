import requests
import psycopg2
from datetime import datetime
from psycopg2.extras import Json

# ==========================
# CONFIG
# ==========================
COURSEDIGGERS_JSON_BASE = "https://www.coursediggers.com/data"

DB_HOST = "your-db-host.supabase.com"
DB_NAME = "your-db-name"
DB_USER = "your-db-user"
DB_PASS = " your-db-password"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (SFUCoursePlanner)"
}

# ==========================
# HELPERS
# ==========================
def is_meaningful(value):
    return value is not None and str(value).strip() != ""

# ==========================
# DB HELPERS
# ==========================
def get_course_digger_maps(cur):
    """
    Fetch all course_digger_map entries.
    Returns: [(course_digger_map_id, digger_course_id), ...]
    """
    cur.execute("""
        SELECT course_digger_map_id, digger_course_id
        FROM course_digger_map
        ORDER BY digger_course_id
    """)
    return cur.fetchall()

# ==========================
# API FETCH
# ==========================
def fetch_course_digger_json(digger_course_id):
    url = f"{COURSEDIGGERS_JSON_BASE}/{digger_course_id}.json"
    print(f"[HTTP] GET {url}")

    resp = requests.get(url, headers=HEADERS, timeout=20)

    if resp.status_code != 200:
        print(f"[HTTP] ❌ digger_id={digger_course_id} -> {resp.status_code}")
        return None

    return resp.json()

# ==========================
# UPSERT LOGIC
# ==========================
def upsert_course_digger_stats(cur, map_id, payload):
    labels = payload.get("labels")
    data_rows = payload.get("data")

    if not labels or not data_rows:
        print(f"[SKIP] map_id={map_id} (missing labels/data)")
        return

    values = data_rows[0]
    data_map = dict(zip(labels, values))

    median_grade = data_map.get("Median Grade")
    fail_rate = parse_fail_rate(data_map.get("Fail Rate"))

    print(f"[DB] UPSERT digger_stats map_id={map_id}")

    cur.execute("""
        INSERT INTO course_digger_stats (
            course_digger_map_id,
            median_grade,
            fail_rate,
            grade_distribution,
            last_fetched_at
        )
        VALUES (%s, %s, %s, %s, NOW())
        ON CONFLICT (course_digger_map_id)
        DO UPDATE SET
            median_grade = EXCLUDED.median_grade,
            fail_rate = EXCLUDED.fail_rate,
            grade_distribution = EXCLUDED.grade_distribution,
            last_fetched_at = NOW()
    """, (
        map_id,
        median_grade,
        fail_rate,
        Json(data_map)
    ))


# ==========================
# MAIN
# ==========================
def main():
    print("\n===== POPULATE COURSE DIGGER STATS START =====")
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
            mappings = get_course_digger_maps(cur)
            print(f"[DB] Loaded {len(mappings)} course_digger_map entries\n")

            for map_id, digger_course_id in mappings:
                payload = fetch_course_digger_json(digger_course_id)
                if payload:
                    upsert_course_digger_stats(cur, map_id, payload)

    conn.close()

    print("\n===== POPULATE COURSE DIGGER STATS COMPLETE =====")
    print(f"Finished at: {datetime.now()}")

def parse_fail_rate(value):
    """
    Convert fail rate to float if possible, else None.
    """
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


# ==========================
# ENTRY
# ==========================
if __name__ == "__main__":
    main()
