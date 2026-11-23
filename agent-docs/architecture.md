# Architecture — overview

Short map of the system. Detail lives in [reference/](reference/); rules in [reference/repo-rules.md](reference/repo-rules.md).

## Stack
- **Frontend:** Next.js 16 (App Router, React, TypeScript, Tailwind, shadcn/ui), deployed on Vercel.
- **API:** Spring Boot 3 / Java 17, deployed on AWS Elastic Beanstalk; called directly from the browser via `NEXT_PUBLIC_API_URL`.
- **Data + auth:** Supabase Postgres (catalog, terms, bookmarks, preferences, RMP identification) and Supabase Auth (identity, admin role).
- **Email:** Resend, behind the `EmailTransport` boundary.
- **DNS/proxy:** Cloudflare in front of the custom domains.
- **External data:** SFU CourseSys (live sections/enrollment, never persisted), CourseDiggers (grades, ingested offline), Rate My Professors (live ratings).

## Folder map
| Path | What |
| --- | --- |
| `frontend/app/` | Routes: browse, compare, graph, dashboard, admin, auth/login, about, privacy, terms |
| `frontend/components/` | UI by responsibility (`layout/`, `course/`, `compare/`, `admin/`, `landing/`, shadcn `ui/`, …) |
| `frontend/lib/` | API client (`api.ts`), types, routes, semester, enrollment status, Supabase clients |
| `frontend/proxy.ts` | Session refresh + route guard for `/dashboard` and `/admin` |
| `backend/src/main/java/com/example/courseplanner/` | `controller`, `service`, `repository`, `entity`, `dto`, `model`, `scheduler`, `config`, `utils` |
| `supabase/` | Migrations, seed data, manual admin SQL snippets |
| `init_db/` | Offline Python population scripts (operational tooling) |
| `test/rmp/` | RMP test files |
| `agent-docs/` | This documentation |

## Key flows
1. **Browse → CourseSys live data.** Browser loads departments/courses from the API (Postgres). Offerings and offering detail are fetched from CourseSys at request time; detail adds stored CourseDiggers grades.
2. **Bookmarks → 00:05 digest email.** Signed-in users bookmark a course/semester/section (Bearer token verified by `JwtService` against Supabase). A scheduler at 00:05 America/Vancouver re-checks bookmarks against CourseSys and sends the digest via Resend.
3. **Admin.** `proxy.ts` gates the UI by `app_metadata.role`; every `/api/admin/**` call is re-checked server-side with `verifyAdmin`. Covers users, support replies, terms, health checks, RMP mismatch review.
4. **RMP lookups.** `GET /api/rmp` identifies a professor once (stored in `rmp_lookup`) and fetches ratings live each time; failures store nothing and return `UNAVAILABLE`.

## Detail
- Flows and data ownership: [reference/architecture-and-flows.md](reference/architecture-and-flows.md)
- API, auth, access control: [reference/frontend-api-and-access.md](reference/frontend-api-and-access.md)
- Courses and semesters: [reference/course-data-and-semesters.md](reference/course-data-and-semesters.md)
- Email, scheduler, DB ops: [reference/operations-and-maintenance.md](reference/operations-and-maintenance.md)
- Hazards: [reference/discrepancies-and-hazards.md](reference/discrepancies-and-hazards.md)
- RMP: [features/rmp.md](features/rmp.md)
