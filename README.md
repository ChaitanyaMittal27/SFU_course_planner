# SFU Course Planner

SFU Course Planner helps Simon Fraser University students research courses, inspect current and historical offerings, compare options, bookmark sections, and receive enrollment updates.

- Live site: [sfucourseplanner.com](https://sfucourseplanner.com)
- Public API reference: [api.sfucourseplanner.com/api-docs](https://api.sfucourseplanner.com/api-docs)
- License: MIT

## Product overview

The application supports:

- Browsing SFU courses and current and historical offerings, with live CourseSys enrollment data and readable, shareable URLs.
- Comparing courses and sections.
- Enrollment, grades, and load graphs, including CourseDiggers grade history.
- Rate My Professors instructor ratings.
- Section bookmarks with a daily enrollment digest sent through Resend.
- A signed-in dashboard for bookmarks, notification preferences, and account settings, using Supabase authentication.
- A role-gated admin console with Overview, Health, Support, Terms, Users, Bookmarks, and RMP reports sections.

## Architecture

| Area | Technology | Responsibility |
| --- | --- | --- |
| Frontend | Next.js App Router, React, TypeScript, Tailwind, shadcn/ui, Geist, Recharts | Browser UI, readable routes, Supabase Auth UI |
| Backend | Java 17, Spring Boot 3.0, Gradle | REST API, authorization, CourseSys integration, scheduled email |
| Database and Auth | Supabase PostgreSQL and Auth | Catalog, terms, bookmarks, preferences, support data, sessions |
| External data | SFU CourseSys, CourseDiggers, and Rate My Professors | Live offerings/enrollment, historical grade data, and instructor ratings |
| Email | Resend | Support replies and bookmark digests |

The Next.js frontend and Spring Boot backend deploy independently. The browser calls the backend through `NEXT_PUBLIC_API_URL`; Spring Boot does not serve the frontend.

PostgreSQL is the source of truth for catalog metadata, terms, preferences, bookmarks, and support submissions. CourseSys data is fetched on demand. Supabase owns authentication; the frontend proxy protects UI routes while the backend independently verifies bearer tokens and enforces ownership and admin authorization.

## Repository layout

```text
frontend/                  Next.js application
  app/                     App Router pages
  components/              Shared UI by responsibility
  contexts/, hooks/, lib/  Auth UI state, reusable hooks, API and route helpers
  proxy.ts                 Session refresh and dashboard/admin route gates
  Dockerfile               dev, test, build, runtime targets

backend/                   Spring Boot API
  src/main/java/.../
    controller/            Public, protected, and admin endpoints
    dto/                   API DTOs
    entity/, repository/   JPA model and persistence
    service/               JWT, CourseSys, and email integrations
    scheduler/             Daily bookmark digest
  Dockerfile               dev, test, builder, runtime targets

supabase/                  Local configuration, migrations, and seed data
  seed-users.sql           Local user and admin accounts
init_db/                   Database initialization guidance, legacy scripts, local output
test/rmp/                  Manual backend RMP client and its tests
AGENTS.md / CLAUDE.md      AI agent entry points
agent-docs/                Persistent project guidance and engineering backlog
  index.md                 Documentation entry point
  plan.md, state.md         Active subtasks and current handoff
  reference/               Repository rules and detailed behavior references
  features/                Feature-specific guidance
.github/workflows/ci.yml   Frontend and backend CI checks
docker-compose.yaml        Local frontend/backend development environment
```

## Local development

### Prerequisites

- Docker Desktop
- Node.js 22+ and npm
- Java 17+ for non-Docker backend work
- Supabase CLI, available through `npx supabase@latest`

### Configure local environment files

Create ignored local configuration files from the examples:

```powershell
Copy-Item frontend/.env.example frontend/.env.local
Copy-Item backend/.env.example backend/.env.local
```

Start Supabase and use its local connection details to fill the placeholder values:

```powershell
npx supabase@latest start
npx supabase@latest status
```

Use these frontend values for local development:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<local-anon-key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Set the backend database and Supabase values in `backend/.env.local` from the local CLI status. Compose overrides the database and Supabase hostnames needed from inside containers. `backend/.env.local` is read by Compose; Spring Boot does not automatically load it when run directly from Gradle or a JAR.

Never commit `.env.local` files, Resend keys, service-role keys, or production connection strings. `NEXT_PUBLIC_*` variables are browser-visible configuration and must not contain privileged secrets.

### Run the full local stack

From the repository root:

```powershell
npx supabase@latest start
docker compose up --build
```

Open:

- Frontend: <http://localhost:3000>
- Backend: <http://localhost:5000>
- Swagger UI: <http://localhost:5000/api-docs>
- Supabase Studio: <http://127.0.0.1:54323>
- Mailpit inbox: <http://127.0.0.1:54324>

After a local database reset, open <http://localhost:3000/login> and use email/password sign-in with the local-only accounts from `supabase/seed-users.sql`: `user@test.com` / `user` for the dashboard, or `admin@test.com` / `admin` for the admin console. `supabase/config.toml` loads this file after the catalog seed. Local Google sign-in requires separate provider configuration.

Stop the application containers and local Supabase separately:

```powershell
docker compose down
npx supabase@latest stop
```

Compose is for local development only. It does not deploy the Vercel frontend, Elastic Beanstalk backend, or Supabase project.

### Run without Docker

Frontend:

```powershell
Set-Location frontend
npm ci
npm run dev
```

Backend, after loading `backend/.env.local` values into the current shell:

```powershell
Set-Location backend
./gradlew bootRun
```

## Testing and builds

Run the normal checks before opening a pull request or deploying:

```powershell
# Frontend
Set-Location frontend
npm run lint
npm run test
npm run build

# Backend
Set-Location ../backend
./gradlew test
./gradlew bootJar
```

Frontend tests use Vitest and React Testing Library with mocked external boundaries. Backend tests use JUnit 5, Mockito, and MockMvc; they do not call live Supabase, CourseSys, or Resend. The backend HTML report is written to `backend/build/reports/tests/test/index.html`.

To run either suite through Docker:

```powershell
docker build --target test --tag sfucourseplanner-frontend:test ./frontend
docker build --target test --tag sfucourseplanner-backend:test ./backend
```

Generated local reports in `test-logs/` are ignored and should not be committed.

## Local database workflow

The local schema is defined in `supabase/migrations/`; `supabase/seed.sql` supplies catalog data and `supabase/seed-users.sql` supplies local test accounts after a reset.

```powershell
# Recreate only the local database from migrations and seed data
npx supabase@latest db reset

# Start a reviewed schema migration
npx supabase@latest migration new <descriptive_name>
```

Test migrations locally before a reviewed `db push`. The linked Supabase project is production: never run `db reset --linked`, and review a `db push` before applying it.

Local confirmation and password-reset messages arrive in Mailpit instead of being sent externally.

## API documentation

Springdoc generates the public API reference:

- Swagger UI: `/api-docs`
- OpenAPI JSON: `/v3/api-docs`

Admin operations under `/api/admin/**` are intentionally absent from the public reference. They still require both a valid Supabase bearer token and the `app_metadata.role == "admin"` claim.

## CI and contribution flow

GitHub Actions runs two checks on pushes and pull requests targeting `dev` or `main`:

- `Frontend`: install, lint, test, and production build;
- `Backend`: test and JAR build.

`main` requires a pull request and both checks before merging. Direct pushes to `dev` are currently permitted as the integration workflow. Keep the `Frontend` and `Backend` check names stable unless branch protection is updated at the same time.

For deeper project conventions, architecture details, and the hardening backlog, see [agent-docs/](agent-docs/).

## Working with AI agents

Agents start at [AGENTS.md](AGENTS.md), then [agent-docs/index.md](agent-docs/index.md).
Read the current plan and state before starting; the index identifies any additional guidance needed.
[agent-docs/protocol.md](agent-docs/protocol.md) covers completion and handoff.

## Deployment

- Frontend: Vercel, served at the custom domain.
- Backend: Spring Boot JAR deployed to AWS Elastic Beanstalk.
- Database and Auth: hosted Supabase.

Docker validates and runs the local development environment. It is not currently the production deployment mechanism; deployment changes should be made deliberately, including the relevant Vercel or Elastic Beanstalk configuration.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| Supabase client reports a missing URL or key | Ensure all four frontend variables are present in `frontend/.env.local`, then restart the frontend. |
| Backend cannot connect locally | Start Supabase first and confirm the database credentials in `backend/.env.local`; Compose uses `host.docker.internal` for the local stack. |
| A newly added dynamic route returns an old 404 in Compose | The disposable `frontend_next` cache may be stale. Run `docker compose down -v`, then `docker compose up --build`. This removes Compose caches only; it does not remove Supabase CLI data. |
| Frontend dependencies are missing or outdated after package.json changes | The `frontend_node_modules` volume is stale. Run `docker compose down -v && docker compose up --build` (in PowerShell 5.1, run the two commands separately). This recreates Compose volumes, not Supabase CLI data. |
| No password-reset or confirmation email appears | Check Mailpit at <http://127.0.0.1:54324>. |
| Local Gradle uses an old JVM | Confirm `java -version` reports Java 17 or newer before running Gradle. |
