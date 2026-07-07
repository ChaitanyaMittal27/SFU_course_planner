# SFU Course Planner

Course planning and discovery app for Simon Fraser University. Browse departments and courses, inspect live enrollment/section data, view grade distributions and enrollment trends, compare courses/sections side by side, bookmark offerings, and get daily email digests when a bookmarked section's enrollment changes.

- **Live app:** [sfucourseplanner.com](https://sfucourseplanner.com)
- **API:** [api.sfucourseplanner.com](https://api.sfucourseplanner.com)
- **License:** MIT

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Key Features](#key-features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Architecture Notes](#architecture-notes)
- [Database Population Scripts](#database-population-scripts)
- [Deployment](#deployment)

## Overview

SFU doesn't provide a single place to research a course before enrolling — course outlines, live section enrollment, and historical grade data all live on separate SFU systems. This app pulls all three together:

- **Course outlines** (title, description, units, prerequisites, corequisites, designation) — scraped and stored in the app's own database.
- **Live section data** (capacity, enrolled count, instructor, campus) — fetched on demand from SFU's [CourseSys](https://coursys.sfu.ca/browse/) system.
- **Historical grade distributions** — sourced from [CourseDiggers](https://www.coursediggers.com/) and stored in the database.

On top of that, signed-in users can bookmark specific course offerings and opt into a daily email digest that reports enrollment/capacity status for everything they've bookmarked.

## Tech Stack

### Backend
- **Java 17**, **Spring Boot 3.0.0**, Gradle
- **Spring Data JPA** (Hibernate) + **PostgreSQL** hosted on **Supabase**
- `spring.jpa.hibernate.ddl-auto=validate` — schema is managed manually, Hibernate never auto-migrates
- **Resend** (`com.resend:resend-java`) for transactional email (contact form, support replies, notification digests)
- Runs on port `5000`, deployed to **AWS Elastic Beanstalk**

### Frontend
- **Next.js 16.2.9** (App Router), **React 19**, **TypeScript 5**
- **Tailwind CSS v4** with CSS custom properties for theming (light/dark)
- **shadcn/ui** (built on `@base-ui/react`) for UI primitives
- **Supabase Auth** (`@supabase/ssr`) — JWT-based auth with httpOnly cookies, session refresh handled in `proxy.ts` (Next.js middleware)
- **Recharts** for enrollment/grade charts
- **Lucide React** for icons
- **nuqs** for URL query state
- **Vercel Analytics**
- Deployed on **Vercel**

## Key Features

- **Browse** — drill down from department → course → offering, with ~4 years of historical section data pulled live from CourseSys.
- **Course detail** — description, prerequisites/corequisites, units, designation, grade distribution, and a direct link to the official SFU outline.
- **Analytics graphs** — enrollment-over-time and load (enrolled/capacity %) charts (1yr/3yr/5yr ranges), plus grade distribution bar charts.
- **Compare** — side-by-side comparison of courses or specific sections.
- **Bookmarks / Dashboard** — signed-in users can bookmark a specific course offering (section + semester) and see live status on their dashboard.
- **Email notifications** — users can opt in to a daily digest email (sent ~00:05 America/Vancouver) summarizing enrollment/capacity for all bookmarked offerings, via Resend.
- **Auth** — Supabase Auth (email/password + OAuth), JWT verified server-side against Supabase (no local JWT parsing).
- **Admin dashboard** (`/admin`, role-gated via `app_metadata.role === "admin"`):
  - **Health** — live status/latency checks for the API, database, CourseSys, CourseDiggers, and Resend.
  - **Support** — inbox for contact-form submissions (mark read, archive, reply via email).
  - **Terms** — set which term is "current" vs. "enrolling".
  - **Users** — user list/detail with signup provider, notification opt-in, last sign-in, and bookmarks.
  - **Bookmarks analytics** — top bookmarked courses, department rankings, monthly growth.
  - **Test** — manually trigger the daily notification job on demand.
- **Contact form** — public contact form that emails the support inbox and is persisted for the admin support view.

## Project Structure

```
├── build.gradle                        # Spring Boot config (Java 17, Spring Boot 3.0.0)
├── src/main/java/com/example/courseplanner/
│   ├── Application.java                # Spring Boot entry point (@EnableScheduling for notification cron)
│   ├── config/CorsConfig.java          # CORS (localhost + sfucourseplanner.com + vercel.app)
│   ├── controller/
│   │   ├── AboutController.java            # GET /api/about, GET /api/terms/enrolling
│   │   ├── BrowseController.java           # Departments, courses, offerings (public)
│   │   ├── GraphController.java            # Grade distribution, enrollment history (public)
│   │   ├── BookmarkController.java         # CRUD bookmarks (JWT protected)
│   │   ├── UserPreferenceController.java   # Email notification prefs (JWT protected)
│   │   ├── ContactController.java          # POST /api/contact (public)
│   │   ├── AdminController.java            # GET /api/admin (admin status/paths)
│   │   ├── HealthController.java           # Service health checks (admin)
│   │   ├── SupportController.java          # Contact submissions inbox (admin)
│   │   ├── TermsController.java            # Current/enrolling term management (admin)
│   │   ├── UsersController.java            # User list/detail (admin)
│   │   ├── BookmarksAdminController.java   # Bookmark analytics (admin)
│   │   └── TestController.java             # Manually trigger notification job (admin)
│   ├── dto/                            # All prefixed Api*DTO / Admin*DTO — controllers never return entities
│   ├── entity/                         # JPA entities: Department, Course, Term, Bookmark, UserPreference,
│   │                                      ContactSubmission, CourseStats, CourseDiggerMap/Stats
│   ├── repository/                     # Spring Data JPA interfaces
│   ├── service/
│   │   ├── JwtService.java             # JWT verification via Supabase API call + admin role check
│   │   ├── CourseSysClient.java         # Fetches live section data from SFU's CourseSys
│   │   └── EmailService.java           # Sends email via Resend (contact, support replies, digests)
│   ├── scheduler/NotificationScheduler.java  # Daily cron job (00:05 America/Vancouver) — bookmark digest emails
│   ├── model/                          # CourseSysBrowseResult, CourseSysOffering
│   ├── exception/                      # GlobalExceptionHandler, ForbiddenException
│   ├── utils/SemesterUtil.java         # Semester code encode/decode/previous
│   └── scripts/                        # Python one-off DB population scripts (see scripts_README.md)
├── src/main/resources/application.properties
├── course-planner-frontend/
│   ├── app/
│   │   ├── layout.tsx                  # Root layout (AuthProvider, NuqsAdapter, Navigation, Footer, Analytics)
│   │   ├── page.tsx                    # Landing page with splash screen
│   │   ├── globals.css                 # ALL design tokens, theme variables, animations
│   │   ├── fonts.ts                    # Font imports (Inter, Geist) + typography style constants
│   │   ├── browse/                     # Course browsing and detail view
│   │   ├── dashboard/                  # User bookmarks/watchlist (auth required)
│   │   ├── graph/{enrollment,grades,load}/  # Analytics charts
│   │   ├── compare/{courses,sections}/      # Side-by-side comparison
│   │   ├── login/                      # Sign in / sign up
│   │   ├── auth/{callback,reset-password}/  # OAuth callback, password reset
│   │   ├── admin/                      # Admin dashboard (role-gated)
│   │   │   ├── health/, support/, terms/, users/[id]/, bookmarks/, test/, unauthorized/
│   │   └── {about,docs,privacy,termsofservice}/
│   ├── components/
│   │   ├── ui/                         # shadcn components
│   │   ├── admin/                      # AdminSidebar, AdminPageSkeleton
│   │   ├── Navigation.tsx, Footer.tsx
│   │   ├── BookmarkButton.tsx, BookmarksTable.tsx
│   │   ├── OfferingsTable.tsx, GradeHistogram.tsx, LoadBar.tsx, StatusBadge.tsx
│   │   ├── EmailNotificationToggle.tsx
│   │   ├── ErrorMessage.tsx, LoadingSpinner.tsx, LoadingSkeleton.tsx, PageContainer.tsx
│   │   ├── ProfileAvatar.tsx, Splash.tsx
│   │   └── landing/HeroPreview.tsx
│   ├── lib/
│   │   ├── api.ts                      # Centralized API client (fetchAPI + fetchAuthAPI)
│   │   ├── types.ts                    # All TypeScript interfaces
│   │   ├── utils.ts                    # cn() helper (clsx + tailwind-merge)
│   │   └── supabase/{client,server}.ts # Supabase browser + server clients
│   ├── contexts/AuthContext.tsx        # Auth state (user, userId, isLoading, signOut)
│   ├── hooks/{useTheme,useScrollReveal}.ts
│   └── proxy.ts                        # Next.js middleware — route protection, admin gate, token refresh
├── coding_standards.txt                # Frontend coding rules (design tokens, fonts, shadcn, icons)
└── docs/                               # Design/migration notes, sample curl commands
```

## Getting Started

### Prerequisites
- Java 17
- Node.js (compatible with Next.js 16 / React 19)
- A Supabase project (PostgreSQL database + Auth)
- A [Resend](https://resend.com) account/API key (for email features)

### Backend

```bash
# From the repo root
./gradlew bootRun      # Starts on port 5000 (or $SERVER_PORT)
./gradlew bootJar       # Build a runnable JAR (build/libs/application.jar)
```

Configuration is read from environment variables (see below) via `src/main/resources/application.properties`. The database schema is **not** auto-created — `spring.jpa.hibernate.ddl-auto=validate` means the schema must already exist and match the JPA entities.

### Frontend

```bash
cd course-planner-frontend
npm install
npm run dev        # Starts on http://localhost:3000
npm run build       # Production build
npm run start       # Serve production build
npm run lint        # ESLint
```

## Environment Variables

### Backend
Read from the environment by `application.properties`:

| Variable | Purpose |
|---|---|
| `SERVER_PORT` | Server port (default `5000`) |
| `DB_URL_NEW` | Supabase PostgreSQL JDBC URL (session pooler, IPv4) |
| `DB_USER_NEW` | Database username |
| `DB_PASS_NEW` | Database password |
| `SUPABASE_URL_NEW` | Supabase project URL (used for JWT verification calls) |
| `SUPABASE_KEY_NEW` | Supabase anon key |
| `RESEND_API_KEY` | Resend API key, injected directly via `@Value("${RESEND_API_KEY}")` in `EmailService`/`HealthController` |

The Python population scripts under `src/main/java/com/example/courseplanner/scripts/` additionally expect `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`.

### Frontend
Read from `.env.local`:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL (e.g. `http://localhost:5000` in dev) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `NEXT_PUBLIC_SITE_URL` | Site base URL (used for auth redirects) |

> **Note:** never commit real values for these — both `.env` (backend) and `course-planner-frontend/.env.local` are gitignored. Treat the Supabase service role key and Resend API key as secrets; the service role key in particular bypasses row-level security and should never be exposed client-side or committed.

## API Reference

### Public (no auth)
| Method | Path | Description |
|---|---|---|
| GET | `/api/about` | App info |
| GET | `/api/terms/enrolling` | Current enrolling term |
| GET | `/api/departments` | All departments (sorted by code) |
| GET | `/api/departments/{deptId}/courses` | Courses for a department |
| GET | `/api/departments/{deptId}/courses/{courseId}/offerings` | Offerings for the last ~12 semesters (live, from CourseSys) |
| GET | `/api/departments/{deptId}/courses/{courseId}/offerings/{semesterCode}` | Single-semester detail incl. grade stats |
| GET | `/api/graph/grade-distribution?courseId=` | CourseDiggers grade distribution |
| GET | `/api/graph/enrollment-history?deptId=&courseId=&range=` | Enrollment over time (`1yr`/`3yr`/`5yr`) |
| POST | `/api/contact` | Submit the contact form |

### Protected (JWT required — `Authorization: Bearer <token>`)
| Method | Path | Description |
|---|---|---|
| GET | `/api/bookmarks` | Current user's bookmarks |
| GET | `/api/bookmarks/offerings` | Bookmarked offerings with live CourseSys data |
| POST | `/api/bookmarks` | Create a bookmark (409 if duplicate) |
| DELETE | `/api/bookmarks/{id}` | Delete a bookmark (403 if not owner) |
| POST | `/api/preferences` | Initialize notification preferences on signup |
| GET | `/api/preferences/email-notifications` | Get email notification preference (default `false`) |
| PUT | `/api/preferences/email-notifications` | Update email notification preference / preferred email (upsert) |

### Admin (JWT + `app_metadata.role === "admin"`)
| Method | Path | Description |
|---|---|---|
| GET | `/api/admin` | Admin status + available admin paths |
| GET | `/api/admin/health` | Health of API/DB/CourseSys/CourseDiggers/Resend (`?service=` for a single check) |
| GET | `/api/admin/support/submissions` | Contact submissions (`?filter=all\|unresolved\|archived`) |
| PATCH | `/api/admin/support/submissions/{id}/read` | Mark a submission read |
| PATCH | `/api/admin/support/submissions/{id}/archive` | Toggle archive on a submission |
| POST | `/api/admin/support/submissions/{id}/reply` | Reply to a submission (emails the user) |
| GET | `/api/admin/terms` | List all terms |
| PUT | `/api/admin/terms` | Set the current/enrolling term |
| GET | `/api/admin/users` | User list with stats (signup provider, opt-in, activity) |
| GET | `/api/admin/users/{id}` | Single user detail + their bookmarks |
| GET | `/api/admin/bookmarks` | Bookmark analytics (top courses, dept rankings, monthly growth) |
| POST | `/api/admin/test/trigger-notifications` | Manually run the daily notification job |

## Architecture Notes

### JWT Authentication Flow
1. User signs in via Supabase Auth (email/password or OAuth).
2. Supabase stores the JWT in httpOnly cookies; the frontend reads it via `supabase.auth.getSession()`.
3. Frontend sends `Authorization: Bearer <JWT>` on protected calls (`fetchAuthAPI` in `lib/api.ts`).
4. `JwtService` verifies the JWT by calling Supabase's `/auth/v1/user` endpoint — there is **no local JWT parsing/verification**, Supabase is the source of truth.
5. Admin routes additionally require `app_metadata.role === "admin"` on the Supabase user, checked both client-side (`proxy.ts` middleware) and server-side (`JwtService.verifyAdmin`).

### Semester Code System
SFU semester codes encode year + term as a single number: `(year - 1900) * 10 + termDigit`, where spring=1, summer=4, fall=7. Example: Fall 2025 = `125 * 10 + 7 = 1257`. See `SemesterUtil.java` for encode/decode/previous logic.

### Daily Notification Job
`NotificationScheduler` runs on a cron (`0 5 0 * * *`, `America/Vancouver`) each night:
1. Fetches all users opted into email notifications.
2. Batch-loads all their bookmarks and deduplicates by (dept, course, semester) so each unique offering is fetched from CourseSys only once.
3. Builds a per-user HTML digest table and sends it via `EmailService`/Resend.
4. Updates `last_notified_at` for all notified users.

It can also be triggered manually via `POST /api/admin/test/trigger-notifications`.

### Frontend API Client Pattern
All API calls go through `lib/api.ts`:
- `fetchAPI<T>()` for public endpoints.
- `fetchAuthAPI<T>()` for protected endpoints (auto-injects the JWT from the Supabase session).
- A `401` response surfaces as a "Session expired" error; a `204` response returns `undefined` (used for `DELETE`).

### Backend Controller Pattern
- Constructor injection for all dependencies (repositories, services).
- `@RequestHeader("Authorization")` to receive the JWT on protected/admin endpoints.
- Entities are always mapped to DTOs before being returned — controllers never return JPA entities directly.
- Ownership checks before mutations (403 Forbidden if not the resource owner).
- `GlobalExceptionHandler` maps auth-related `IllegalArgumentException`/`RuntimeException` messages to 401, `ForbiddenException` to 403.

### External Data Sources
- **CourseSys** (`CourseSysClient`, `coursys.sfu.ca/browse/`) — live section data (enrollment, capacity, instructor, campus), parsed from HTML table responses. Returns an empty result (not `null`) on failure.
- **CourseDiggers** (`coursediggers.com`) — grade distribution and median grade/fail rate, pre-populated into the database (see below), not fetched live per-request.

## Database Population Scripts

`src/main/java/com/example/courseplanner/scripts/` contains standalone Python scripts used to seed and maintain the `departments`/`courses`/grade-related tables (see `scripts_README.md` for full details). They are stepwise and idempotent — safe to interrupt and re-run:

1. `populate_departments.py` — inserts all departments.
2. `populate_courses_base.py` — inserts course numbers/titles across 2024–2026.
3. `populate_courses_deep_latest_semester.py` — fills stable metadata (description, units, prereqs, etc.) from the freshest term.
4. `populate_courses_deep_backfill.py` — backfills any courses missed by step 3 from older terms.
5. `populate_course_digger_map.py` / `populate_course_digger_stats.py` — link courses to CourseDiggers data and populate grade distribution stats.
6. `populate_course_stats_from_coursys.py` — populates course-level stats from CourseSys.

The `terms` table (current/enrolling term) is managed separately via the admin **Terms** page rather than a script.

## Deployment

### Frontend — Vercel
The frontend is deployed on Vercel (`@vercel/analytics` is wired into `layout.tsx`). CORS on the backend explicitly allows `https://sfu-course-planner.vercel.app` and `https://*.vercel.app` in addition to the production domain, so preview deployments work against the live API. Set the frontend environment variables (above) in the Vercel project settings.

### Backend — AWS Elastic Beanstalk
The backend reads `SERVER_PORT` from the environment (defaulting to `5000`, which is what Elastic Beanstalk expects). Build the deployable artifact with `./gradlew bootJar` (outputs `build/libs/application.jar`) and configure the environment variables listed above in the Elastic Beanstalk environment configuration. `spring.jpa.hibernate.ddl-auto=validate` means database migrations must be applied out-of-band before deploying schema-affecting changes.

### CORS
Allowed origins are hardcoded in `CorsConfig.java`: `localhost:3000`, `localhost:5000`, `sfu-course-planner.vercel.app`, `*.vercel.app`, `api.sfucourseplanner.com`, `sfucourseplanner.com`, and their `www` variants.
