# Operations and maintenance

## Email and scheduler side effects

Spring scheduling is enabled by `Application`. `NotificationScheduler` runs at 00:05 in `America/Vancouver`.

For each opted-in `UserPreference`, a run:

1. joins that user’s bookmarks to local course/department data;
2. deduplicates CourseSys requests by department/course/semester, sleeping 150 ms between requests;
3. builds an HTML digest per user using the matching saved section;
4. calls Resend and records `last_notified_at` for all opted-in users after the loop.

`EmailService` sends through the injected `EmailTransport`; `ResendEmailTransport` is the production adapter. `EmailService` catches and logs all transport exceptions rather than rethrowing. Consequently, support replies and digest runs can persist their “sent/replied/notified” state even when Resend actually failed; scheduler result counts record attempted calls, not confirmed delivery.

The public contact endpoint first calls the same non-throwing mail helper, then persists the submission and returns 201. Admin replies update the submission after that helper returns.

## Database and schema operations

JPA is configured with `ddl-auto=validate`; a running backend requires a pre-existing compatible schema. The current baseline is captured in `supabase/migrations/20260821070750_remote_schema.sql`; `supabase/seed.sql` contains public catalog data but excludes application-user data, preferences, bookmarks, and contact submissions. In addition to JPA, admin users and analytics use direct SQL: `UsersController` selects from Supabase `auth.users` and public preferences/bookmarks, so schema/privilege changes around Auth can break admin reporting even when entity validation passes.

Use the Supabase CLI for local database work: `npx supabase@latest start` starts the local stack, and `npx supabase@latest db reset` recreates the local database from migrations and seed data. Treat `db push` as a production-affecting action because the linked project is production; review its SQL and use a dry run first. Never run `db reset --linked`.

## Population scripts

The Python programs under the Java source tree are independent operational tools using `psycopg2` and hard-coded placeholder connection values, not Spring configuration or dependency management. They cover:

- department and base-course discovery from SFU course outlines;
- latest-term metadata enrichment and backfill for missing course metadata;
- CourseSys-derived aggregate `course_stats`;
- CourseDiggers ID mapping and grade-stat ingestion.

Several scripts use insert-on-conflict/upsert or only fill null/missing values, but their safety and time ranges differ. Inspect the target SQL and constants before use; do not assume the scripts share current runtime credentials or the same CourseSys semester representation as the Java app.

## Development and validation facts

- Backend: Gradle wrapper, Spring Boot 3.0.0, Java 17 source compatibility. From `backend/`, `bootRun`, `test`, and `bootJar` are the relevant tasks.
- Springdoc 2.1.0 is pinned for Spring Boot 3.0 compatibility. It exposes Swagger UI at `/api-docs` and JSON/YAML specifications at `/v3/api-docs` and `/v3/api-docs.yaml`; validate that internal admin paths remain absent when changing controller visibility.
- Frontend: npm lockfile, Next.js 16/React 19, with `dev`, `lint`, `test`, `build`, and `start` scripts. Vitest/React Testing Library tests are isolated from live Supabase and API services. Run `npm run test`, `npm run lint`, and `npm run build` for frontend validation.
- Backend behavior has a JUnit 5/Mockito/MockMvc suite under `backend/src/test/java`; it is isolated from live Supabase, CourseSys, and Resend. Run `./gradlew test` and `./gradlew bootJar` for backend validation. GitHub Actions runs the same frontend and backend checks for `dev`/`main` pushes and pull requests; production deployment remains external (Vercel plus Elastic Beanstalk).
- Dockerfiles are present for both apps. Their targets are `dev`/`test`/`builder`/`runtime` for the backend and `dev`/`test`/`build`/`runtime` for the frontend. `docker-compose.yaml` runs development targets only; it does not participate in Vercel or Elastic Beanstalk deployment. Use `docker build --target test` when validating inside Docker.
- Start local Supabase with `npx supabase@latest start`, then run `docker compose up --build`; stop them separately with `docker compose down` and `npx supabase@latest stop`. The former PowerShell scripts were removed. Compose containers reach Supabase through `host.docker.internal`, while browser-visible Supabase URLs remain `127.0.0.1`/`localhost`. If dynamic routes return stale 404s after route changes, recreate only the `frontend_next` Compose cache volume/container.
- Backend environment is supplied through `application.properties` placeholders; its `.env.local` is for Docker or manual shell loading, not auto-loaded by Spring. Frontend variables are `.env.local`. Keep credentials outside source control.
