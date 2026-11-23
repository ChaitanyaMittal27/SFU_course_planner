# State - overwrite each subtask, max 30 lines
Task: UI refresh - subtask 10 hero stats test follow-up - Updated: 2026-11-23 - Branch: main
## Done so far
Subtasks 1-8 remain verified; subtasks 9-10 implemented (owner verification pending).
Exported HERO_STATS without changing its current values; preserved existing Hero edits.
Landing stats test reads source constants, checks exact item count and each item's label/value.
Checks semantic label/value order and reversed-column classes that put the number above its label.
Added the requested one-line testing decision; updated plan row 10, still implemented.
## Last subtask result (incl. tests)
Frontend lint PASS; Vitest PASS (43 files, 288 tests); production build PASS.
git diff --check PASS.
## Uncommitted files (git status)
M README.md
M agent-docs/changelog.md
M agent-docs/decisions.md
M agent-docs/plan.md
M agent-docs/state.md
M agent-docs/to-do.md
M frontend/app/page.test.tsx
M frontend/components/landing/Hero.tsx
## Blockers / known issues
No blockers. Existing README, changelog, to-do and Hero copy edits preserved.
Existing Docker dependency/cache refresh and dev-only shadcn audit backlog remain.
## Next
- [ ] Owner review/verify subtask 10 and commit changes.
- [ ] Continue owner release flow from subtask 9: merge/CI/deploy and production smoke.
