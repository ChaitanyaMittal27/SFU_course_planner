# Agent docs index

## Always read
- [state.md](state.md) — current status, uncommitted files, blockers, next step.
- [plan.md](plan.md) — active task and subtask statuses.

## Read per task type
| Task | Read |
| --- | --- |
| Any code change | [coding-standards.md](coding-standards.md); rules in [reference/repo-rules.md](reference/repo-rules.md) |
| Cross-app change or feature planning | [architecture.md](architecture.md), then [reference/architecture-and-flows.md](reference/architecture-and-flows.md) |
| Frontend UI (pages, components, tokens) | [coding-standards.md](coding-standards.md) (Frontend), [decisions.md](decisions.md) |
| Backend/API contract, auth, dashboard, admin UI | [reference/frontend-api-and-access.md](reference/frontend-api-and-access.md) |
| Courses, terms, graphs, external data | [reference/course-data-and-semesters.md](reference/course-data-and-semesters.md) |
| Ops/deploy: email, scheduler, admin actions, DB ingestion, validation | [reference/operations-and-maintenance.md](reference/operations-and-maintenance.md) |
| Rate My Professors | [features/rmp.md](features/rmp.md) |
| Tests | Tests sections of [coding-standards.md](coding-standards.md) and [reference/repo-rules.md](reference/repo-rules.md); RMP tests in [features/rmp.md](features/rmp.md) |
| Conflicting docs or known hazards | [reference/discrepancies-and-hazards.md](reference/discrepancies-and-hazards.md) |
| Planning new work / backlog | [to-do.md](to-do.md), [decisions.md](decisions.md) |

## Process
- [protocol.md](protocol.md) — completion protocol for any task that changes files.
- [decisions.md](decisions.md) — one line per design decision; add one when you make a design choice.

## Read only when asked
- [changelog.md](changelog.md) — release history; touch only via Doc instructions.

Reference docs describe verified behavior as of writing; source and DTOs remain the authority for exact shapes.
