# Course data and semesters

## Local course model

`Department` has many `Course` rows; course numbers are unique within a department. A course owns stable outline-like metadata and has optional one-to-one `CourseStats` and CourseDiggers mapping/statistics. CourseDiggers data flows through `CourseDiggerMap` (one local course to one external CourseDiggers ID) and then `CourseDiggerStats` (median, fail rate, JSON distribution).

`Bookmark` does not reference a JPA `Course` relation. It stores IDs plus semester code and section, with a database uniqueness constraint over department, user, course, semester, and section. Repositories join it to course/department for the scheduler and admin views.

`Term` is operational state, not an offerings table: rows record a year/term and `isCurrent`/`isEnrolling` flags. The admin update endpoint enforces that the terms differ and enrolling is later than current.

## Semester convention

The canonical encode/progression helper is `SemesterUtil`:

```text
spring = 1, summer = 4, fall = 7
semester code = (full year - 1900) * 10 + term digit
Fall 2025 = 1257
```

It defines canonical lower-case terms and backward progression (spring -> previous fall, fall -> summer, summer -> spring). It drives term updates, browse history, graph history, and bookmark resolution. Do not reproduce this arithmetic in a controller or frontend feature.

## CourseSys integration

`CourseSysClient.fetchCourseSections(dept, courseNumber, semesterCode)` calls `https://coursys.sfu.ca/browse/` with `subject[]`, `number[]`, `semester[]`, and `tabledata=yes`. It expects a JSON object whose `data` is a table-like list: title at index 2, enrollment text at 3, instructor at 4, campus at 5, and an HTML link at 1. It extracts the section and information path from that link.

`CourseSysOffering` deliberately retains raw enrollment/capacity strings for display. Its numeric enrollment and load calculations include a `(+N)` waitlist in enrolled count, so a full-looking result may exceed 100%. Graph aggregation also uses that count; it currently sums all returned sections, with a code comment noting lecture-only filtering is unresolved.

There is no cross-request CourseSys cache. The scheduler deduplicates its offering fetches within a single run only. Avoid introducing loops over semester/course combinations without considering third-party latency and load.

## Historical graph behavior

The enrollment graph starts at the enrolling term if configured, otherwise at the current term, then makes 3, 9, or 15 CourseSys requests for the 1-, 3-, or 5-year ranges. It returns a zero-valued point for an unoffered/empty result and reverses the sequence for chronological display. Grade distribution is different: it comes entirely from locally ingested CourseDiggers JSON.

## Important implementation hazards

- `SemesterUtil.decodeSemesterCode` currently returns `semesterCode / 10` as its `year`, while `buildSemesterCode` and CourseSys parsing use a full year such as 2025. For code `1257`, decode therefore returns `125`, not `2025`. The bookmarked-offering controller uses this decoded year in its response. Treat this as an existing behavior to test carefully when changing bookmark/term display; do not silently assume encode/decode round-trip today.
- `CourseSysClient` documents an empty result on failures, but its `RestTemplate` call and parsing are not wrapped in a catch block. HTTP or malformed-response failures can escape to browse/graph/bookmark callers. The scheduler catches failures per deduplicated offering; normal public endpoints do not add that protection.
