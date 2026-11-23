# UI finish checks — 2026-11-23

## Subtask 6 verification
Reviewed the existing uncommitted cleanup against `ui-cleanup-2026-11.md`, including resolver failure caching/retry, bookmark/dashboard failure feedback, generated UI token mappings, and removed component/asset references. No blocking issue found. Baseline: 42 Vitest files / 260 tests passed; final lint and production build also pass with subtasks 7–8 included. Subtask 6 marked verified at the owner's explicit request; its existing changes and staged deletions were preserved.

## Subtask 7
The dots were rendered but faint and mostly masked behind the opaque preview. Anchor the backdrop to the email, spread its halo outside the preview, and increase the light/dark dot token opacity. `SHOW_HERO_GRID` remains the switch. Screenshots inspected in light and dark themes.

## Subtask 8
- Offerings: compact phone columns, vertically arranged load bar/percentage, wrapping seat counts (including waitlist suffixes); instructor/campus columns appear at desktop widths.
- Offering sections: stacked rows below `lg`, keeping bookmark, status, campus, counts, and outline visible. Native table semantics remain in the accessibility tree.
- Summary: wrap figures independently; dividers only on large screens and no leading divider on badges.
- Comparisons: mobile measures span the row, with two values side by side or three values stacked. Repeat plain labels, avoiding duplicate interactive links; reveal the screen-reader header when a header link receives keyboard focus.
- 404: hide illustrative Title/Seats columns on phones so “Not offered” stays visible.
- Compare course picker: suppress selection guidance during department/course failures; test retry restoring guidance.
- Duplicate React key: sibling picker/results used the same course+term key; prefix the picker key. The problem was not a missing section key in the sections map.
- Graph department picker uses the same `name` as comparison pickers. Search already uses that field; full names need catalog data correction (backlog).
- RMP: distinguish matched-but-unrated from NO_MATCH in comparison; test it. Rating detail numbers stay on one line and use two columns on phones.
- Dashboard: populated bookmark rows stacked on phones after a 621px-wide row was found. Counts/status/removal remain visible; title wraps.
- Email illustration: container queries collapse Term/Title when the preview itself is narrow, including the two-column desktop hero. Status no longer requires internal scrolling.

## Checks and limits
- Final: lint passes; 42 Vitest files / 262 tests pass; production build (including TypeScript) passes; `git diff --check` clean.
- Real local API: course/offering and two-item course/section comparisons checked at 320, 375, 768, 1280px. Course/offering table scroll width equals available width at each size; comparisons fit at each size.
- Landing email checked at the same four widths: no inner/page overflow. Light/dark hero screenshots inspected. Section comparison console: zero errors/warnings after loading.
- Public routes (landing, browse, about, login, reset-password, privacy, terms, three graphs, 404) and admin overview/users/bookmarks/terms/support/RMP/health checked at 375 and 768px for page overflow: none. Wider admin tables intentionally scroll inside cards.
- Signed in with local user/admin accounts provided by the owner. Dashboard empty state checked with live data; populated dashboard checked with intercepted bookmark GET fixtures (no persisted bookmark changes). Admin support/RMP and bookmark analytics had empty local datasets; populated workflows remain covered by existing component tests, not a new live-data visual check. No admin writes performed.
- Local Docker frontend needed restarts to pick up some host edits. Used port 3000 after port 3001 encountered the backend CORS restriction. The extra host dev process was stopped.
- Screenshots/browser traces are generated artifacts under ignored `test-logs/`. No credentials were written into repository files. Subtasks 7–8 await owner review; no release/commit performed.
