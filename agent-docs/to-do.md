# Prioritized engineering to-do list

This is a product-hardening backlog derived from the repository audit. It is ordered by expected risk reduction and enabling value; it is not a release plan.

0. RMP follow-ups (backend done, see `agent-docs/rmp.md`): professor stats card in the UI using `/api/rmp` (show `searchUrl` for NO_MATCH/UNAVAILABLE, plus a "report wrong match" button calling `/api/rmp/reports`); admin view to review `rmp_mismatch_reports` and correct `rmp_lookup` rows (add a manual-override flag so an admin-set no-match is not re-searched after 7 days); update `test/rmp/manual.py` wording to the live-fetch approach; review `departments.rmp_name` labels against real RMP results.
1. Fix backend CORS for Vercel previews: `allowedOrigins("https://*.vercel.app")` is literal, so preview origins currently receive 403. Use an intentional Spring origin-pattern strategy without widening production access unnecessarily.
2. Normalize missing/invalid bearer-auth responses to 401. Required `Authorization` headers currently fail in Spring MVC with 400 before `JwtService`/the global handler can apply the documented authentication contract.
3. Add a small browser-level end-to-end suite for critical user flows: auth, canonical routes, bookmarks, and dashboard states. The Vitest unit/component suite already covers these flows with mocked boundaries.
4. Add local Supabase/pgTAP tests for migrations, RLS, constraints, native repository SQL, and the `auth.users` dependency used by admin reporting.
5. Build a complete support-ticket lifecycle: persisted threads and replies, clear owner/status state, outbound delivery outcomes, and an inbound-email/webhook or managed-mailbox strategy that attaches replies to the correct ticket.
6. Upgrade the backend to Java 21 LTS and Spring Boot 3.5.x; align local, Docker, and Elastic Beanstalk runtimes.
7. Add CourseSys request timeouts, safe error handling, and predictable fallback responses.
8. Cache CourseSys results in the backend, starting with an in-memory Caffeine cache.
9. Finish strict bookmark input validation: semester code, normalized section, and duplicate-insert races.
10. Add versioned database migrations with Flyway or Liquibase.
11. Complete a frontend accessibility and responsive-design pass: keyboard-operable interactive rows, reduced-motion support, breakpoint coverage, Recharts container sizing, and manual testing on narrow/mobile layouts.
12. Decide whether the backend remains JAR-on-Elastic-Beanstalk or becomes Docker-on-Elastic-Beanstalk/ECR.
13. Standardize Python ingestion-script configuration, credential handling, execution instructions, and data-safety expectations.
14. Improve observability for CourseSys and email: structured failures, latency visibility, and meaningful health checks.
15. Add the Spring Boot validation provider before relying on Jakarta Bean Validation annotations; the current application starts with a missing-provider warning.

Backend Java unit/MVC coverage and frontend Vitest unit/component coverage are complete for the current implementation. The next test layers are browser-level E2E and local Supabase database behavior; neither is replaced by mocked unit/component suites.
