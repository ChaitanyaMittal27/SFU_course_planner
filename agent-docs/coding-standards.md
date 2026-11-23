# Coding standards

These are project conventions that prevent regressions across the Spring API, Next.js frontend, and Supabase boundary. They complement [repo-rules.md](reference/repo-rules.md); existing nearby code remains the style reference for exact details.

## Cross-cutting

- Keep a change within its owning layer. The frontend owns browser UX and readable routes; the backend owns authorization, DTO contracts, and mutations; Supabase owns persisted data and schema constraints.
- Prefer existing shared helpers and boundaries over a second implementation: course routes/resolution, semester utilities, `JwtService`, API clients, and DTOs are the canonical seams.
- Keep secrets and deployment credentials out of source, fixtures, and test output.

## Backend

- Use constructor injection for collaborators. Do not construct HTTP, email, or other external clients inside business methods; expose a small injected boundary instead (for example `RestTemplate` or `EmailTransport`).
- Controllers return `Api*DTO` or `Admin*DTO` values, never JPA entities. Verify Supabase tokens server-side and scope every protected mutation to the authenticated identity.
- Use `SemesterUtil` for backend SFU-term conversions and preserve the current split: PostgreSQL stores catalog data; CourseSys supplies live offering data.
- Treat email, scheduled jobs, and external calls as production-affecting. Make their failure semantics explicit; an attempted provider call is not proof of delivery.

## Tests and validation

- A backend feature or bug fix must include or update focused automated tests in the same change. Test public behavior and error paths, not implementation trivia.
- When a feature changes an API contract, operational behavior, or persistent project convention, update the relevant repository documentation in that same change.
- Use JUnit 5, Mockito, and `@WebMvcTest`/MockMvc as appropriate. Mock Supabase, CourseSys, Resend, repositories, and other external boundaries; unit tests must not require live credentials or network access.
- Run the affected tests while working and `./gradlew test` before handing off a backend change. Run `./gradlew bootJar` for changes that affect production compilation or packaging. The HTML report is `backend/build/reports/tests/test/index.html`.
- Test database migrations, RLS, constraints, and native SQL separately against the local Supabase stack; do not pretend mocked Java tests prove database behavior.

## Frontend

- Keep API access in `lib/api.ts`, route construction in `lib/course-routes.ts`, and auth ownership split between `proxy.ts` (guard/refresh) and `AuthContext` (UI state).
- Reuse semantic UI tokens from `app/globals.css`, typography from `app/fonts.ts`, and components from the responsibility-based `components/` folders. Do not introduce page-local color or typography systems.
- Typography: Geist is the single UI font and Geist Mono is for data. `app/fonts.ts` is the only type scale; use `numericStyles` (Geist Mono, tabular figures) for seat counts, percentages, ratings, and grades.
- Colour: text must meet WCAG AA (4.5:1) on `background` and `surface` in both themes. Use the text-safe tokens for coloured text (`text-accent-text`, `text-success-text`, `text-warning-text`, `text-destructive-text`) and the `*-tint` tokens for badge/alert backgrounds; the plain `success`/`warning`/`destructive`/`accent` tokens are fills (bars, dots, solid buttons). The orange `accent` is never a fill behind text (buttons, badges, pills); it is for charts and highlights only. Buttons use `primary`; badges use the status tint/text tokens. The `email-*` tokens are reserved for the landing-page email illustration and are the same in both themes.
- Radius: use `rounded-sm`, `rounded-md`, or `rounded-lg` from the `--radius` scale (plus `rounded-full` for pills/avatars). Do not use arbitrary `rounded-[Npx]` values.
- Layout: wrap pages in `PageContainer` (the single `max-w-page` / 1180px width, renders a `<div>` inside AppShell's `<main>`) and start each page with `PageHeader` (its one `<h1>`, optional description and actions).
- Cards: one card = one section of content (`components/course/SectionCard.tsx`: `bg-surface`, 1px border, `rounded-lg`, header strip with an `h2` and an optional note). The page header (breadcrumb, `h1`, description, actions) and the summary row sit on the page background. Never put a bordered element inside a card; tables run edge to edge inside their card, and repeated items inside a card are rows separated by top borders, not nested cards.
- Motion: keep it subtle and make sure it respects `prefers-reduced-motion` (a global rule in `globals.css` disables animations/transitions; JS-driven motion such as `useScrollReveal` must check the media query itself).
- Seat-load status (Open / Almost full / Full) comes only from `lib/enrollment-status.ts`, whose thresholds match the backend email digest.
- Add or update colocated Vitest/React Testing Library tests for changed frontend behavior. Mock Supabase, navigation, and API boundaries; cover the successful flow plus relevant loading, error, empty, authorization, or canonical-route behavior. Run `npm run test`, `npm run lint`, and `npm run build` before handoff.
