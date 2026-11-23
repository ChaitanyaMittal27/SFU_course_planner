# UI cleanup (subtask 6, 2026-11-23): dead code removed and kept

How "unused" was proven: a repo-wide search of `frontend/` (all `.ts/.tsx/.css`, tests included, plus `node_modules/shadcn/dist/tailwind.css` and `tw-animate-css` for CSS variables), checking import specifiers, identifiers, string-built class names (`animate-${…}`, `xStyles[…]`), dynamic imports and `vi.mock` targets. For assets, `git grep` covered the whole repository, backend and supabase included. Lint, tests and build were green after every part.

## Deleted
| Item | Proof |
| --- | --- |
| `components/ui/card.tsx` | No importer anywhere; cards use `SectionCard`. |
| `components/ui/tooltip.tsx` | No importer; every "Tooltip" reference is recharts' `Tooltip`. |
| `hooks/useScrollReveal.ts` + `vi.mock` in `app/admin/admin-pages.test.tsx` | Only the test mock referenced it; no component imported it. |
| `InstructorRatings` `variant="grid"` (heading + grid of cards) | The only caller (`OfferingDetailScreen`) passed `variant="card"`. The component now always renders the card. Tests for real behaviour (ratings, retry, report, empty) were kept and now run against the card. |
| `ProfessorCard` `layout="card"` (bordered standalone card) | Only reachable through the grid variant above; `ProfessorCard` is now always the row. |
| `adminTable` export (`components/admin/AdminPage.tsx`) | Zero references; admin tables now use `cardTable`. |
| `getEnrollmentStatusLabel` (`lib/enrollment-status.ts`) | Only its own test used it. The test now checks `ENROLLMENT_STATUS_LABELS` directly. |
| `numericStyles.lg` (`app/fonts.ts`) | No `numericStyles.lg` and no dynamic `numericStyles[…]` access. |
| `globals.css`: `@keyframes fade-in, slide-up, slide-down, pulse-soft, reveal-up`; `.animate-fade-in/-slide-up/-slide-down/-pulse-soft/-reveal-up`; `.stagger-children` (5 rules) | No class usage, no string-built `animate-` names. `fade-in-0` etc. are tw-animate's own utilities. |
| `globals.css` tokens: `--primary-hover`, `--accent-hover`, `--accent-foreground`, `--destructive/success/warning-foreground` (+ their `--color-*` mappings) | No `bg-/text-/…` utility or `var()` use in code, shadcn css or tw-animate. |
| `globals.css`: `--chart-3/4/5` (+ `--color-chart-3/4/5`) | Charts use only `chart-1`, `chart-2` and the status fills. |
| `globals.css`: `--color-sidebar*` (8 mappings) | No shadcn sidebar component and no `sidebar-*` utility. |
| `globals.css`: raw shadcn duplicates `--card(-foreground)`, `--popover(-foreground)`, `--secondary-foreground`, `--muted(-foreground)`, `--input`, `--ring` (both themes) | `@theme` maps the `--color-*` names straight to our tokens; nothing reads the raw vars. |
| `public/older-favicon.ico`, `public/older-favicon.png` | `git grep` finds no reference in the repository (frontend, backend, supabase). |

## Suspected unused but kept
| Item | Why kept |
| --- | --- |
| `--secondary` (both themes) | Read directly by `button.tsx` (`var(--secondary)` in the secondary hover). |
| `components/ui/toggle.tsx`, `input-group.tsx` | Used transitively by `toggle-group.tsx` and `command.tsx`. |
| Unused named exports inside shadcn `components/ui/*` (e.g. `DialogTrigger`, `CardFooter`-style parts, `TableFooter`) | Generated primitive files; trimming them makes future shadcn updates harder. |
| Exports used only within their own file (e.g. `RANGES`, `PICKER_TERMS`, `SeatTotals`) or only by tests (`clearRmpLookupCache`, `bestIndex`, `editDistance`, …) | Used code. The `export` is only there for tests or types. |
| `public/favicon-16.png`, `favicon-32.png`, `favicon-512.png` | No repo reference, but they are stable public URLs that email clients or external services may still load. |
| `public/google8182975b077d8534.html` | Google site verification, fetched by URL. |
| `public/favicon.png` | Linked from the backend email (`NotificationScheduler`). |
| `baseline-browser-mapping` (devDependency) | Not imported by design: it updates browserslist data so the build doesn't print the outdated-data warning. No dependencies removed. |
| `components/feedback/LoadingSpinner.tsx` | Still used inline by `CourseSearch` ("Loading courses"). No longer used for whole pages. |
| `SHOW_MICROSOFT_LOGIN`, `--email-*` tokens, `SHOW_HERO_GRID`/`.hero-dots`/`--hero-dot` | Kept as instructed (Microsoft login pending; email illustration; subtask 7). |
| 404 "course row" table and landing `Features`/`EmailPreview` tables | Illustrations, not card tables; they keep their own styling. |
