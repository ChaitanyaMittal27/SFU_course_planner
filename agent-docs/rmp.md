# Rate My Professors (RMP) integration

Backend-only so far; the professor stats card and an admin review flow for reports come later.

## How it works

`GET /api/rmp?name=<one CourseSys name>&deptCode=<code>` (public, no login)

1. The name is HTML-decoded and normalized: `"Hall, Margaret"` becomes the key `margaret hall`
   and the display name `Margaret Hall`. Lists (`;`), placeholders (TBA, Staff) and malformed
   names get 400; unknown departments get 404.
2. `rmp_lookup` is checked for (cleaned name, department):
   - **Match stored** → ratings are fetched **live** by RMP ID (one request, ~160 ms). Nothing is cached.
   - **No-match stored, checked under 7 days ago** → `NO_MATCH`, without calling RMP.
   - **Nothing stored, or the no-match is older** → identification (below).
3. **Identification:** every active `rmp_schools` row is searched in parallel, for each name
   variant (full name; without "(alias)"; first given name + surname), taking `search_limit`
   results per school. Results from other schools are ignored. Each candidate scores
   `0.8 × name similarity + 0.2 × department similarity` (normalized Levenshtein; department
   compared with `departments.rmp_name`). The best score wins; **below 0.75 it's a no-match**.
   The outcome is upserted into `rmp_lookup`.
4. **Any RMP failure** (network, HTTP, GraphQL error, malformed response, a single school failing,
   10 s timeout) stores nothing and returns `UNAVAILABLE`. The next request retries.

Every response has `status` (`MATCHED` / `NO_MATCH` / `UNAVAILABLE`), `lookupId`, `searchName` and
`searchUrl` (RMP search for the name at SFU). `teacher` (ratings + `profileUrl`) is present only
when matched. RMP's `-1` would-take-again and 0.0 averages for unrated teachers are returned as null.

`POST /api/rmp/reports {"lookupId": n}` (public) adds a row to `rmp_mismatch_reports` with the
RMP ID being shown at the time. There is no deduplication. Returns 201, or 404 for an unknown lookup.

## Where things live

| Piece | Location |
| --- | --- |
| Schema | `supabase/migrations/20261103120000_add_rmp.sql` |
| Tables | `entity/RmpSchool`, `entity/RmpLookup`, `entity/RmpMismatchReport`; `Department.rmpName` |
| Data access | `repository/RmpSchoolRepository`, `RmpLookupRepository`, `RmpMismatchReportRepository` (Spring Data JPA) |
| Endpoints and lookup flow | `controller/RmpController` |
| Scoring, name handling, thresholds | `service/RmpMatcher` (`NAME_WEIGHT`, `DEPARTMENT_WEIGHT`, `MATCH_THRESHOLD`) |
| RMP GraphQL, including the parallel all-schools search | `service/RateMyProfessorsClient` (strict methods for matching) |
| RMP API shapes (not tables) | `model/rmp/RmpTeacherSearchResult`, `RmpTeacherProfile`, `RmpSchoolSearchResult` |
| Search threads, clock | `config/RmpConfig` (5 threads) |

Two first-time lookups for the same name + department at the same moment: the second insert
hits the unique constraint, and the controller then updates the row the first one created.

## Tuning without code

- **Per-school result count:** `update rmp_schools set search_limit = ... where legacy_id = ...`
- **Turn a school listing on/off:** `rmp_schools.active`. Gibsons (19317) is seeded inactive as a
  probable duplicate.
- **Department labels:** `departments.rmp_name`. New departments get a value from
  `public.rmp_department_name()` via an insert trigger.
- **Fix a wrong match by hand:** point the `rmp_lookup` row at the right professor by setting
  `rmp_teacher_id` / `rmp_legacy_id`. Matched rows are never re-scored, so the fix sticks.
  Setting `no_match = true` (both IDs null) also works, **but is searched again after 7 days** and
  may re-match. A manual-override flag is planned with the admin review flow.

## Known limits

- The same name in the same department is treated as one person. Users have the profile link and
  the report button.
- The same person in two departments has two lookup rows (searched once each).
- RMP's GraphQL API is unofficial; outages degrade to `UNAVAILABLE`.

## Tests

- Unit and MVC tests run with `./gradlew test`: the matcher (including 17 recorded RMP cases in
  `src/test/resources/rmp/`), the strict client and multi-school search, and the full lookup flow
  in `RmpControllerTest`.
- Database tests are opt-in. Set `RMP_TEST_JDBC_URL` (plus `RMP_TEST_DB_USER` /
  `RMP_TEST_DB_PASSWORD`, default `postgres`) to a **local**, migrated database. Hosted databases
  are refused.
  `RmpEndToEndDatabaseTest` then boots the whole app against it (JPA schema validation included)
  with RMP mocked, and deletes its own rows.
- Manual check against a running backend: `python test/rmp/manual.py` (interactive), or
  `--name "Hall, Margaret" --dept als`.

## Local and production flow

### 1. Local schema validation
```
Create/edit migration (supabase/migrations/20261103120000_add_rmp.sql)
        ↓
npx supabase migration up      (or `npx supabase db reset` for a clean rebuild)
        ↓
Inspect: rmp_schools (5 rows, 4 active), rmp_lookup, rmp_mismatch_reports,
         departments.rmp_name filled (74 of 78; 4 intentionally null),
         constraints, the rmp_name insert trigger, RLS on
        ↓
Optional: opt-in database tests (RMP_TEST_JDBC_URL, see Tests)
```
No production schema change happens at this stage.

### 2. No initializer
There is no bulk CourseSys discovery, CSV artifact, or load step. Nothing is pre-populated beyond
the school seed and department labels in the migration. Lookups are created **on demand**, the
first time someone asks about an instructor in a department.

### 3. RMP schools
```
SFU's RMP listings were found and verified during planning
        ↓
Migration seeds them into rmp_schools with search_limit and active
        ↓
Tune in the database: search_limit per school, active on/off
```
CourseSys campus labels are not RMP school IDs, and nothing is derived from them. The Gibsons
listing (19317) is seeded inactive as a probable duplicate. To re-check SFU's listings, use
`RateMyProfessorsClient.searchSchools` (for example via the manual client runner in backend tests).

### 4. Automatic matching (first lookup for a name + department)
```
CourseSys instructor name + course department
        ↓
No rmp_lookup row (or a no-match older than 7 days)
        ↓
Search every active school in parallel, for each name variant
        ↓
Score each candidate: 0.8 × name + 0.2 × department (vs departments.rmp_name)
        ↓
Best score ≥ 0.75 → store the match (both RMP IDs + match_score)
Best score < 0.75 → store no_match
RMP error         → store nothing, return UNAVAILABLE
```
The stored match is treated as correct. There is no admin confirmation step; wrong matches
are caught by user reports (step 6). `match_score` is stored so reviewers can see how close a
match was.

The same name in two departments gives two rows, matched independently. The same name in the
same department is treated as one person.

### 5. Normal runtime flow
```
GET /api/rmp?name=..&deptCode=..
        ↓
Find rmp_lookup (cleaned name, department)
        ↓
Matched      → fetch ratings live from RMP by ID (one request) → MATCHED
No-match <7d → NO_MATCH, no RMP call
Otherwise    → matching (step 4)
```
Ratings are never cached: every view of a matched professor makes one RMP request (~150 ms).
A matched row is never re-scored automatically. The only exception is when RMP no longer has
that profile; it is then identified again.

### 6. Wrong-match reports
```
User clicks "report wrong match" (UI, later)
        ↓
POST /api/rmp/reports {lookupId}
        ↓
rmp_mismatch_reports row: lookup, the RMP ID shown at the time, timestamp
        ↓
Admin reviews reports (admin view, later)
        ↓
Admin corrects the rmp_lookup row (see "Fix a wrong match by hand")
```
Anyone can report, and there is no deduplication. Users also get the RMP profile link and the
search link, so they can check for themselves.

### 7. Production sequence
1. Validate the migration and the endpoints locally (steps 1–5, plus the test suite).
2. Commit the migration and backend code together.
3. Push the migration to hosted Supabase (`npx supabase db push`) **before** deploying. JPA
   `ddl-auto=validate` stops a backend whose RMP tables are missing.
4. Deploy the backend.
5. Smoke-test production: one lookup (`MATCHED` or `NO_MATCH`), then repeat it (faster).
6. Watch the logs for `RMP unavailable` warnings (outages or API changes on RMP's side).
7. Review `rmp_mismatch_reports` periodically until the admin view exists.

No initializer or backfill runs in production, and nothing RMP-related runs at deployment or
startup.
