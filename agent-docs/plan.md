# Plan: UI refresh — finish and release
Status: active
## Goal
Finish the frontend UI refresh, clean it up, and release it to production.
## Scope
In: frontend/ and agent-docs/.  Out: backend changes, new features, content rewrites.
## Approach
Card-based, calm, data-first design (see decisions.md). Each subtask is one Claude Code session; /clear between subtasks unless told otherwise.
## Subtasks
| # | Subtask | Status |
|---|---------|--------|
| 1 | Foundations (tokens, Geist, shadcn, shared states) | verified |
| 2 | Landing, nav, footer (+ hero follow-ups) | verified |
| 3 | Browse, course page, offering detail (+ card follow-up) | verified |
| 4 | Compare and Graphs | verified |
| 5 | About, auth, 404, dashboard, privacy/terms, admin | verified |
| 6 | Cleanup: dead code + consistency audit | pending |
| 7 | Hero dot background fix | pending |
| 8 | Full mobile/responsive checkup | pending |
| 9 | Release: merge dev → main, Vercel deploy | pending |
Status: pending → implemented (coding agent) → verified (only via Doc instructions).
