# SFU Course Planner – Database Population Pipeline

This document explains **how to populate and update the Supabase database**.
The pipeline is intentionally **stepwise, idempotent, and restart-safe**, so partial runs, crashes, or API timeouts do **not corrupt data**.

**NOTE: different ways to fetch different data:**
Course Outlines → "What is this course?"
Coursys → "Is it offered? How full is it?"
CourseDiggers → "How hard is it?"

---

## High-Level Philosophy

We separate data ingestion into **layers**, matching how the SFU API exposes information:

1. **Structural data** (departments, course numbers)
2. **Stable course-level metadata** (title, description, units, prereqs, etc.)
3. **Term-specific data** (handled later: offerings, stats, schedules)

Each script:

- Inserts **only what it is responsible for**
- Never blindly overwrites newer data
- Can be safely re-run

---

## Files & Execution Order

### 1️⃣ Populate Departments

**File:** `populate_departments.py`

**Purpose:**

- Inserts all departments into the `departments` table
- Uses one representative term (e.g., Spring 2025)

**Why first?**

- `courses.dept_id` is a foreign key

**Run:**

```bash
python populate_departments.py
```

---

### 2️⃣ Populate Base Courses (Course Numbers + Titles)

**File:** `populate_courses_base.py`

**Purpose:**

- Populates `courses` table with:

  - `dept_id`
  - `course_number`
  - `title`

- Uses this API endpoint:

  ```
  /bin/wcm/course-outlines?{year}/{term}/{department}
  ```

**Coverage:**

- Iterates **2024 → 2026**
- All terms (spring / summer / fall)

**Notes:**

- Uses `dept_code` from DB to query API
- Case-normalized (`lower()` everywhere)
- Uses INSERT or UPDATE (title only)

**Run:**

```bash
python populate_courses_base.py
```

After this step, every course exists **structurally**, but most fields are still NULL.

---

### 3️⃣ Deep Populate – First Pass (Freshest Data)

**File:** `populate_courses_deep_first.py`

**Purpose:**

- Fills in **stable course metadata** using the most recent term
- Pulls from \*_Spring 2026_ (freshest, most complete outlines)

**Fields populated:**

- `description`
- `units`
- `degree_level`
- `prerequisites`
- `corequisites`
- `designation`

**API used:**

```text
/bin/wcm/course-outlines?{year}/{term}/{dept}/{course}/{section}
```

**Important rules:**

- No overwriting of existing values
- Stops once a valid outline is found
- Logs every update clearly

**Run:**

```bash
python populate_courses_deep_first.py
```

After this step, **most courses are fully populated**.

---

### 4️⃣ Deep Populate – Backfill Pass (Older Terms)

**File:** `populate_courses_deep_backfill.py`

**Purpose:**

- Backfills missing data for courses **not offered ** in 'latest' term.

**Strategy:**

- SQL pre-filter:

  ```sql
  WHERE description IS NULL
  ```

- Tries **Spring, Summer & Fall 2025**
- No overwrites, ever

**Why this works:**

- If Fall data existed → already filled
- If not → older term is authoritative

**Run:**

```bash
python populate_courses_deep_backfill.py
```

After this step, the `courses` table is considered **complete and canonical**.

---

## What We Deliberately Do NOT Store

To keep the database lightweight and query-friendly, we **do not persist**:

- Weekly schedules
- Instructors
- Grades breakdown
- Required readings
- Long HTML-heavy fields

These are **term-specific** and belong in future tables (e.g., `course_offerings`).

---

## Safe Restart & Failure Handling

- All scripts are **idempotent**
- You can:

  - Interrupt mid-run
  - Fix configs
  - Re-run safely

No duplicates, no data loss.

---

## Next Step (Not Covered Here)

➡️ **Populate `terms` table**

This is intentionally separated and will be handled after course stabilization.

---

## Summary (TL;DR)

| Step | Script                              | Purpose                          |
| ---- | ----------------------------------- | -------------------------------- |
| 1    | `populate_departments.py`           | Insert departments               |
| 2    | `populate_courses_base.py`          | Insert course numbers & titles   |
| 3    | `populate_courses_deep_first.py`    | Fill metadata from Fall 2025     |
| 4    | `populate_courses_deep_backfill.py` | Backfill from Spring/Summer 2025 |

Once complete, the **courses table is production-ready**.

---

If anything breaks, **do not patch the DB manually** — rerun the appropriate script.
