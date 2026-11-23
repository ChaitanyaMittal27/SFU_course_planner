# To-do — one line per item

Product-hardening backlog derived from the repository audit, ordered by expected risk reduction and enabling value; not a release plan. Original item numbers kept in brackets.

## Active
- [0] RMP health check in /admin/health (backend). Ship in the same backend release as GET /api/courses.
- [17] GET /api/courses for full title/fuzzy search (backend): return all courses with dept code, number, title so browse search can match titles and fuzzy queries across every department; frontend search is code-only until then. Ship with the RMP health check.
- [0.5] Test coverage tooling + gaps (after the UI refresh): measure current coverage, then add tests.
- [UI] Load chart clips bars above 110% — accepted for now.
- [1] Fix backend CORS for Vercel previews: `allowedOrigins("https://*.vercel.app")` is literal, so preview origins get 403; use an intentional Spring origin-pattern strategy without widening production access unnecessarily.
- [2] Normalize missing/invalid bearer-auth responses to 401: required `Authorization` headers currently fail in Spring MVC with 400 before `JwtService`/the global handler can apply the documented auth contract.
- [3] Add a small browser-level E2E suite for critical flows (auth, canonical routes, bookmarks, dashboard states); Vitest unit/component suite already covers these with mocked boundaries.
- [4] Add local Supabase/pgTAP tests for migrations, RLS, constraints, native repository SQL, and the `auth.users` dependency used by admin reporting.
- [6] Upgrade backend to Java 21 LTS and Spring Boot 3.5.x; align local, Docker, and Elastic Beanstalk runtimes.
- [7] Add CourseSys request timeouts, safe error handling, and predictable fallback responses.
- [9] Finish strict bookmark input validation: semester code, normalized section, and duplicate-insert races.
- [11] Frontend accessibility and responsive pass: keyboard-operable interactive rows, reduced-motion support, breakpoint coverage, Recharts container sizing, manual testing on narrow/mobile layouts.
- [12] Decide whether the backend stays JAR-on-Elastic-Beanstalk or becomes Docker-on-Elastic-Beanstalk/ECR.
- [13] Standardize Python ingestion-script configuration, credential handling, execution instructions, and data-safety expectations.
- [14] Improve observability for CourseSys and email: structured failures, latency visibility, meaningful health checks.
- [15] Add the Spring Boot validation provider before relying on Jakarta Bean Validation annotations; app currently starts with a missing-provider warning.

## Deferred
- [8] Cache CourseSys results in the backend, starting with an in-memory Caffeine cache.
- [5] Complete support-ticket lifecycle: persisted threads and replies, owner/status state, outbound delivery outcomes, and an inbound-email/webhook or managed-mailbox strategy that attaches replies to the right ticket (most tickets are one response, which the current system handles).

## Done
- [16] ~~Fix flaky frontend build (Next 16.3.x Turbopack `next/font/google` Inter resolve failure, vercel/next.js#97344)~~: Inter removed; UI uses Geist and Geist Mono only (UI refresh Batch 0); three consecutive clean `next build` runs passed.

## Test coverage note
Backend Java unit/MVC and frontend Vitest unit/component coverage are complete for the current implementation; the next layers are browser-level E2E and local Supabase database behavior, neither replaced by mocked suites.
