# State - overwrite each subtask, max 30 lines
Task: UI refresh - finish and release - Updated: 2026-11-23 - Branch: ui-2
## Done so far
Subtasks 1-8 verified per owner Doc instructions; 8 includes the admin single-navigation layout follow-up.
Subtask 9 checks completed against the working tree; release gates failed, so status remains pending.
## Last subtask result (incl. tests)
Frontend npm ci PASS (739 packages); lint PASS; 43 files / 278 tests PASS; clean production build + TypeScript PASS.
Sandbox blocked npm cache and Google Fonts initially; approved retries passed; .next removed before each build.
npm ci audit: 32 vulnerabilities (18 moderate, 12 high, 2 critical); dependencies left unchanged.
Production-server HTTP: /compare -> /compare/courses and /graph -> /graph/load both 307.
Legacy /graph/{load,enrollment,grades}?deptId=14&courseId=3998 return 200; client canonical redirects pass automated tests.
Tests also cover range handling, invalid/unknown IDs and retry; no live browser/API resolution asserted here.
No missing NEXT_PUBLIC_* code references in frontend/.env.example (API_URL, SUPABASE_URL, SUPABASE_ANON_KEY present; SITE_URL also documented).
package.json vs main: added cmdk ^1.1.1, sonner ^2.0.8; recharts ^3.6.0 -> ^3.8.0; no other dependency changes.
git diff --check PASS. No backend/Supabase working-tree or staged changes; no source changes made this session.
## Uncommitted files (from git status)
73 modified tracked files (64 frontend, 8 agent-docs, test/rmp/README.md), 5 staged frontend deletions, 3 untracked files.
Untracked: agent-docs/reference/ui-cleanup-2026-11.md, ui-responsive-2026-11.md; frontend/components/layout/AppShell.test.tsx.
This session changed only agent-docs/state.md and plan.md; prior changes preserved; no git mutations or deploy.
## Blockers / known issues
Working tree is NOT clean. main...HEAD backend/supabase diff: 49 files, +5776/-1529 (45 backend, 4 Supabase).
Includes RMP backend/config/tests, removed legacy scripts, Supabase config, two migrations and seed-users.sql.
Local main (8570b28) vs HEAD (0ab835e) also differs; refs not fetched. Frontend-only release gate fails.
## Next
- [ ] Owner reviews/commits accumulated work and resolves backend/Supabase release scope; rerun clean-tree/scope gates before release.
- [ ] No frontend release runbook found in agent-docs/reference; use the following owner checklist.
- [ ] Push ui-2 -> merge into dev -> wait for CI Frontend + Backend jobs to pass.
- [ ] Merge dev into main through PR with both required checks -> confirm Vercel deployment succeeds.
- [ ] Smoke-test production: landing, browse search, a course + offering page, compare, graphs, sign in, dashboard, admin, 404.
- [ ] Repeat production smoke tests in both themes and on a phone; verify legacy redirects.
