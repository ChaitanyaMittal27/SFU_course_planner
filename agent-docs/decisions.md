# Decisions — one line each: "YYYY-MM-DD <decision>: <why>"
2026-11-23 Tests check structure and behaviour, not editable marketing copy (stats, headlines); read such values from their source constants.
2026-11-23 Next.js upgraded to 16.4.6 before the UI release for security advisories; matching eslint-config-next, React 19.2.1 retained, shadcn CLI/CSS tooling moved to devDependencies.
Seeded entries before 2026-11 are dated by the commit that first documented them.

2026-08-20 JPA `ddl-auto=validate`; schema changes only via Supabase migrations: Hibernate must never create or migrate the production schema.
2026-08-20 Controllers return `Api*DTO`/`Admin*DTO`, never entities: keeps the API contract stable and decoupled from JPA.
2026-08-20 Auth verified server-side via `JwtService` against Supabase; admin via `verifyAdmin`: never trust client-parsed JWTs or client user IDs.
2026-08-20 Course offerings/enrollment fetched live from CourseSys, not persisted: Postgres holds catalog data only.
2026-08-20 Backend semester arithmetic only in `SemesterUtil` (frontend: `lib/semester.ts`): one source for SFU term codes.
2026-08-22 Canonical human-readable course routes via `lib/course-routes.ts`; legacy numeric URLs redirect: stable, shareable links over an ID-based API.
2026-08-22 Admin health checks are bounded reachability checks, not delivery verification: keep outbound calls timed out and honest.
2026-08-23 `EmailService` sends through injected `EmailTransport` (`ResendEmailTransport` in prod): email behavior testable without sending mail.
2026-08-23 Recoverable client errors retry via `useRetryableRequest`, not page reload: preserves route and UI state.
2026-11-03 RMP: store only name+department → RMP ID identification; fetch ratings live; any failure stores nothing: no stale ratings, safe retries.
2026-11-22 Frontend-only UI refresh: no backend changes or redeploys during it.
2026-11-22 Card rule: page header and summary on the background, one card per section, nothing bordered inside a card: calm, consistent layout.
2026-11-22 Geist + Geist Mono replace Inter: unified type, and fixes the flaky Inter build.
2026-11-22 Splash screen removed; hero = "Enrollment, minus the hassle." with stats and an HTML rebuild of the real email: show the product immediately.
2026-11-22 /compare and /graph hub pages removed; tabs + redirects instead: fewer dead-end pages.
2026-11-22 Enrollment status thresholds: almost full ≥90%, full ≥100% (`lib/enrollment-status.ts`): matches the email digest.
2026-11-22 NativeSelect for small pickers, Command combobox for course search: NativeSelect keeps existing tests working.
2026-11-22 Microsoft sign-in kept but hidden behind `SHOW_MICROSOFT_LOGIN`: waiting on SFU Azure setup.
2026-11-22 21st.dev: free components only; hero/nav ended up hand-built: no paid dependencies.
2026-11-22 Full title search waits for backend `GET /api/courses` (to-do): frontend-only refresh can't add the endpoint.
2026-11-23 Auth-card pages, the 404 and the landing hero keep their own h1 instead of PageHeader; failed course lookups are not cached so retries hit the API: no visual redesign in cleanup, and Try again must actually retry.
2026-11-23 Mobile offering sections and dashboard bookmarks become stacked rows; comparisons group values under each measure with plain course/section labels: keep status and actions visible without sideways scrolling. Dense admin tables retain contained scrolling.
2026-11-23 Hero dots follow the email preview; its table responds to container width: the two-column desktop preview is narrower than the viewport breakpoint suggests.

2026-11-23 Admin uses its own navigation shell without public header/footer; desktop and mobile sheet share contents and existing auth/theme actions: one navigation per viewport, consistent controls.

2026-11-23 Seat-load UI recomputes raw ratios from seat counts (including waitlists) and floors labels: rounded API offering percentages cannot distinguish 199/200 from full.
