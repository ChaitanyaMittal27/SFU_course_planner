# Completion protocol — run at the end of any task that changes files
1. Run `git status`. Report uncommitted changes from git, not from memory.
2. Overwrite agent-docs/state.md (max 30 lines): what changed, test results, uncommitted files, blockers, next step.
3. If the prompt names a subtask, set it to `implemented` in agent-docs/plan.md. If it names none (setup, finalize), skip this. Always apply any "Doc instructions" in the prompt. Never mark your own work `verified`.
4. Update to-do.md only if pending work changed; decisions.md only if you made a design choice (one line).
5. Touch changelog.md only if the prompt's Doc instructions say so.
6. Never commit, push, reset, stash or discard changes.
7. Reply in max 10 lines: status, files changed, tests, deviations, docs updated.
