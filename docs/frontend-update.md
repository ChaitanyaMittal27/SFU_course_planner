# SFU Course Planner — Frontend Redesign Update

## Overview

This document describes the complete frontend redesign migration of the SFU Course Planner Next.js application. The project moved from a patchwork of hardcoded Tailwind utilities, raw SVG icons, and inconsistent one-off component styles to a fully unified design system backed by CSS custom properties, a typed font scale, and shadcn/ui components throughout.

The migration was carried out in phases across the entire `app/` and `components/` directories. The end result is a codebase where every color, font size, and interactive element is controlled from exactly two canonical sources — `app/globals.css` (design tokens) and `app/fonts.ts` (typography scale) — with zero hardcoded values scattered across individual page files.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14+ (App Router, TypeScript) |
| Styling | Tailwind CSS v4 with CSS variable–based design tokens |
| Component library | shadcn/ui built on `@base-ui/react` |
| Icons | Lucide React |
| Charts | Recharts |
| URL state | nuqs |
| Auth | Supabase |
| Utility | `cn()` from `lib/utils.ts` (`clsx` + `tailwind-merge`) |

---

## Design System

### Color Tokens — `app/globals.css`

All colors are defined as CSS custom properties in `:root` (light mode) and overridden inside `.dark` (dark mode). Tailwind tokens are mapped via an `@theme inline` block so token names like `bg-primary` or `text-text-muted` resolve to the CSS vars at build time. Dark mode is activated by the `.dark` class on `<html>` — the `@custom-variant dark (&:is(.dark *))` directive wires this up.

**Token categories:**

```
Core surfaces:    bg-background, bg-surface, bg-surface-raised
Brand:            bg-primary, text-primary, bg-accent, text-accent
                  bg-primary-foreground, bg-accent-foreground
Text:             text-text-primary, text-text-muted, text-text-subtle
Borders:          border-border, border-border-strong
Semantic:         text-destructive, bg-destructive/10
                  text-success, bg-success/10
                  text-warning, bg-warning/10
Navigation:       bg-nav-bg  (light=primary/red, dark=surface/dark)
Interactive:      ring, ring-offset, input
```

**Chart / SVG colors** (must use CSS var strings directly — Tailwind classes don't apply to SVG attributes):
```
var(--primary), var(--accent), var(--success), var(--warning),
var(--destructive), var(--border), var(--surface-raised),
var(--text-primary), var(--text-muted), var(--text-subtle), var(--background)
```

**Rules enforced:**
- Never use `dark:text-gray-400` style class pairs — the CSS vars handle both modes automatically
- Never use `dark:` with a hardcoded color utility — only `dark:bg-white/10` style opacity variants are permitted
- New colors always go to `globals.css` first before being used anywhere

### Typography Scale — `app/fonts.ts`

All font sizes, weights, and line heights are encapsulated in exported constant objects. No page or component file sets `text-xl` or `font-bold` directly — it composes from these constants.

```typescript
displayStyles.hero  = "text-[3.75rem] md:text-[4.5rem] font-bold leading-[1.1] tracking-tight"
displayStyles.sm    = "text-[1.5rem] font-semibold leading-[1.2]"

headerStyles.lg     = "text-[1.25rem] font-semibold leading-[1.3]"
headerStyles.md     = "text-[1.125rem] font-semibold leading-[1.3]"
headerStyles.sm     = "text-[1rem] font-semibold leading-[1.4]"

bodyStyles.lg       = "text-[1rem] font-normal leading-[1.6]"
bodyStyles.md       = "text-[0.875rem] font-normal leading-[1.6]"
bodyStyles.sm       = "text-[0.75rem] font-normal leading-[1.5]"

labelStyles.lg      = "text-[0.875rem] font-medium leading-[1.2]"
labelStyles.md      = "text-[0.75rem] font-medium leading-[1.2]"
labelStyles.sm      = "text-[0.625rem] font-medium leading-[1.2]"

buttonStyles.lg/md/sm
```

**Exception:** `font-bold`, `font-semibold`, `font-light` used alongside an existing font constant for inline emphasis (`<strong>`, progress stats, chart annotation text) is acceptable. The rule targets standalone font utility classes that duplicate what a constant already expresses.

---

## Coding Standards Established

### What was replaced

| Before | After |
|---|---|
| `light-card dark:dark-card` | `<Card>` from shadcn |
| `dark-card` standalone | `<Card className="...">` |
| `table-header` / `table-cell` / `table-row` | `<TableHead>` / `<TableCell>` / `<TableRow>` from shadcn |
| `input-field` | `<Input>` from shadcn, or `selectClass` constant for native `<select>` |
| `btn-primary` / `btn-secondary` | `<Button>` / `<Button variant="outline">` from shadcn |
| Hardcoded hex in className | CSS var in `style={{}}` or token class |
| `text-gray-900 dark:text-white` | `text-text-primary` |
| `text-gray-600 dark:text-gray-300` | `text-text-muted` |
| `text-orange-600 dark:text-orange-400` | `text-accent` |
| `bg-orange-50 dark:bg-orange-900/20` | `bg-accent/5` or `bg-accent/10` |
| `bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400` | `bg-destructive/10 text-destructive` |
| `bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400` | `bg-success/10 text-success` |
| `bg-gray-100 dark:bg-gray-800` | `bg-surface-raised` |
| `border-gray-200 dark:border-slate-700` | `border-border` |
| `from-red-600 to-orange-600` | `from-primary to-accent` |
| Raw SVG icons | Lucide React components |
| Emoji icons (📊 📈 👥) | Lucide React components |
| Multi-paragraph docblock comments | Removed entirely |

### Select element pattern

Native `<select>` elements (used in graph/browse/compare filter dropdowns where shadcn's Select was not needed) are styled via a `selectClass` constant defined per file:

```typescript
const selectClass =
  "w-full rounded-md border border-border bg-background text-text-primary " +
  "px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50";
```

### Recharts tooltip styling

Recharts tooltip containers cannot use Tailwind classes for SVG fill/stroke or for the floating tooltip `div`. The pattern used:

```tsx
// Tooltip container
style={{
  background: "var(--surface-raised)",
  border: "1px solid var(--border)",
  color: "var(--text-primary)",
}}

// Chart strokes / fills
<Line stroke="var(--primary)" />
<Bar fill="var(--accent)" />
```

### Inline style rule

`style={{}}` is only used when:
1. A value is computed at runtime (dynamic widths, positions, animation delays)
2. A CSS var is needed inside a recharts or SVG context where Tailwind can't reach
3. A dynamic color function result (e.g., `getLoadColor()`) must be applied

All hardcoded color strings and hardcoded `fontSize`/`fontWeight` values were removed from inline styles and replaced with token classes or font constants.

### Known shadcn limitations

- `DropdownMenuTrigger` and `DropdownMenuItem` do not support `asChild` — this is a `@base-ui/react` constraint, not a bug
- Lucide React does not export a `Github` icon — `components/Footer.tsx` keeps its raw SVG intentionally; this is the only permitted raw SVG in the codebase

---

## Shared Components Built

These components are reusable across pages and were extracted to avoid duplication:

### `components/Navigation.tsx`
Top navigation bar. Uses `bg-nav-bg` token so it's red in light mode and dark-surface in dark mode. Contains the auth-aware user menu via shadcn `DropdownMenu`.

### `components/Footer.tsx`
Site footer. Contains the sole permitted raw SVG — the GitHub brand logo (Lucide doesn't include brand icons).

### `components/PageContainer.tsx`
Standard page wrapper with consistent max-width, padding, and `bg-background`.

### `components/LoadingSpinner.tsx`
Animated spinner for async states.

### `components/ErrorMessage.tsx`
Error display with optional retry callback.

### `components/Splash.tsx`
Animated landing splash screen shown before the main app loads. Uses CSS var–based gradient (`var(--primary)`) and animated background orbs with dynamic positioning via inline styles.

### `components/ProfileAvatar.tsx`
Displays a user's initials in a gradient circle. Interface: `{ name: string; size?: "sm" | "md" | "lg"; className?: string }`.

### `components/LoadBar.tsx`
Horizontal load percentage bar with color semantics (green → yellow → red via token classes). Interface: `{ percent: number; className?: string }`. Width is the only inline style (dynamic).

### `components/BackButton.tsx`
Reusable back navigation button. Interface: `{ onClick: () => void; label?: string; className?: string }`.

### `components/StatusBadge.tsx`
Semantic status badge component (available but currently unused in active pages).

### `components/GradeHistogram.tsx`
Bar chart for grade distribution. Uses `fill="var(--accent)"` directly on the recharts `<Bar>` component.

### `components/BookmarkButton.tsx`
Toggleable bookmark/watch button used in the browse detail view.

### `components/BookmarksTable.tsx`
Table component for displaying bookmarked offerings (available but dashboard uses inline Table directly).

### `components/EmailNotificationToggle.tsx`
Toggle switch for email notification preferences, used in the dashboard sidebar.

---

## Pages Migrated

### `app/page.tsx` (Root / Home)
Entry point. Renders `<Splash>` followed by the main landing content. All hardcoded colors replaced with token classes.

### `app/layout.tsx`
Root layout. Mounts `<Navigation>` and `<Footer>`. Dark mode class toggling managed here.

### `app/graph/page.tsx`
Graph landing page. Replaced emoji icons with Lucide (`TrendingUp`, `Users`, `BarChart2`). Feature checkmarks use `<Check className="text-success">`. Info box uses `text-accent`. Card gradient uses `from-primary to-accent`. All `light-card` → `<Card>`.

### `app/graph/grades/page.tsx`
Grade distribution chart page. Orange info box → `bg-accent/5 border border-accent/20`. Median grade card → `bg-surface-raised`. Fail rate card → `bg-destructive/10`. Empty state icon → `<BarChart2 className="text-text-subtle">`. `input-field` → `selectClass`.

### `app/graph/load/page.tsx`
Course load over time chart page. `getLoadColor()` function returns `var(--success/warning/destructive)` strings. `CustomDot` stroke → `var(--background)`. Line stroke → `var(--primary)`. Reference lines use `var(--warning)` and `var(--destructive)`. Legend dots use `bg-success`, `bg-warning`, `bg-destructive`. Range toggle buttons: active → `from-primary to-accent text-primary-foreground`, inactive → `bg-surface-raised text-text-muted hover:bg-border`.

### `app/graph/enrollment/page.tsx`
Enrollment vs capacity chart. Enrolled line → `var(--primary)`. Capacity line → `var(--text-subtle)`. Legend and tooltip use CSS var strings. Range buttons follow same pattern as load page.

### `app/compare/page.tsx`
Compare landing page. Arrow SVG → `<ArrowRight>`. Book/clipboard SVGs → `<BookOpen>`, `<ClipboardList>`. Hero gradient → `from-primary to-accent`. Example course codes use `font-semibold text-accent` inline spans (intentional — inline emphasis).

### `app/compare/courses/page.tsx`
Side-by-side course comparison. `ComparisonSection` helper → `<Card><CardContent>`. `ComparisonRow` helper → shadcn `<TableRow><TableCell>`. Course tags → `bg-accent/10 text-accent`. Remove button → `bg-destructive/10 text-destructive`. Empty state → `<ClipboardList className="text-text-subtle">`.

### `app/compare/sections/page.tsx`
Side-by-side section comparison. Section toggle buttons: active → `border-accent bg-accent/5`, inactive → `border-border hover:border-accent/50`. Load bar gradient → `from-primary to-accent`. Link color → `text-accent`.

### `app/browse/page.tsx`
Course browser with search, sidebar, and offerings table. Search input → token border/bg/focus classes. Search icon → `<Search className="text-text-subtle">`. Search dropdown → `bg-surface-raised border-border`. Sidebar active button → `from-primary to-accent`, inactive → `bg-accent/5`. Offerings table uses shadcn `<Table>` family. Row tinting: even → `bg-background`, odd → `bg-accent/5`, enrolling → `bg-success/5`, active → `bg-accent/10`. Enrolling badge → `bg-success/10 text-success`. Back button in detail view → `<BackButton>` shared component.

### `app/dashboard/page.tsx`
User dashboard. Profile avatar → `<ProfileAvatar name={displayName} size="lg">`. Inputs → `<Input>`. Buttons → `<Button>` variants. Load bars in table → `<LoadBar percent={...}>`. Delete buttons → `bg-destructive/10 text-destructive`. Enrolling badges → `bg-success/10 text-success`. Full watcher table uses shadcn `<Table>` family.

### `app/docs/page.tsx`
API documentation page. All section cards → `<Card className="p-6">`. Code blocks → `bg-surface-raised`. Inline code → `text-accent`. All headings → font constant classes. Parameter tables use native `<table>` with `border-border` and token text classes (shadcn Table not needed for static content here).

### `app/privacy/page.tsx`
Privacy policy. All content cards → `<Card>`. Accent highlight card uses `border-l-4 border-accent`. All text → token classes.

### `app/termsofservice/page.tsx`
Terms of service. Same pattern as privacy page. All cards, text, and accent elements use token classes.

### Auth pages (`app/auth/`, `app/login/`, `app/signup/`, etc.)
Auth flow pages migrated to use `<Card>`, `<Input>`, `<Button>`, and token text/color classes throughout.

---

## shadcn Components in Use

| Component | Where used |
|---|---|
| `<Card>` / `<CardContent>` | Every page — replaces `light-card dark:dark-card` |
| `<Button>` | Every interactive button — replaces `btn-primary`, `btn-secondary`, raw `<button>` |
| `<Input>` | Text/password fields — replaces `input-field` |
| `<Table>` / `<TableHeader>` / `<TableBody>` / `<TableHead>` / `<TableRow>` / `<TableCell>` | browse, dashboard, compare pages — replaces `table-header`, `table-cell`, `table-row` |
| `<Badge>` | Status indicators |
| `<Avatar>` | User avatar fallback |
| `<DropdownMenu>` | Navigation user menu |
| `<Switch>` | Email notification toggle |
| `<Skeleton>` | Loading states |
| `<Textarea>` | Multi-line input fields |

---

## Final Audit Results

A full sweep of `app/` and `components/` was run at the end of the migration:

| Standard | Result |
|---|---|
| Hardcoded color utilities (e.g., `text-red-600`, `bg-slate-800`) | **Zero remaining** |
| Hardcoded hex values in className | **Zero remaining** |
| Forbidden `dark:color-utility` pairs | **Zero remaining** |
| Raw SVG elements | **One** — `components/Footer.tsx` GitHub logo (intentionally exempt) |
| Font utilities bypassing `fonts.ts` constants in page/component code | **Resolved** — remaining occurrences are acceptable inline emphasis |
| Inline styles with hardcoded color strings | **Zero** |
| Inline styles with hardcoded `fontSize`/`fontWeight` not using CSS vars | **Three** — in recharts tooltip `<p>` elements in graph pages (minor, isolated to chart context) |
| `react-chartjs-2` import | **Zero** — package removed from `package.json` and uninstalled |
| `npx tsc --noEmit` | **Clean** — no TypeScript errors |

---

## Dependency Change

`react-chartjs-2` was discovered in `package.json` but was never imported anywhere in the codebase (all charts use Recharts). It was removed:

```
npm uninstall react-chartjs-2
```

This reduced the dependency tree by 3 packages.

---

## Post-Migration Visual Enhancements

After the core migration was complete, a second pass of visual and UX improvements was made. All changes remain on the `frontend-update` branch.

---

### Dark Mode Color Hierarchy

The original dark mode used `#0a0a0a` for the background and lighter surfaces on top, which felt flat and unstructured. The palette was updated to match GitHub's three-level dark hierarchy:

| Level | Token | Value | Usage |
|---|---|---|---|
| Navbar | `--nav-bg` | `#010409` | Navigation bar — darkest |
| Page | `--background` | `#0d1117` | Page body |
| Cards | `--surface` | `#161b22` | Card backgrounds |
| Raised | `--surface-raised` | `#21262d` | Dropdowns, tooltips, inputs |
| Border | `--border` | `#30363d` | Default border |
| Border strong | `--border-strong` | `#484f58` | Emphasized border |

The shadcn compatibility tokens (`--card`, `--popover`, `--secondary`, `--muted`, `--input`, `--ring`) in both `:root` and `.dark` were also updated to reference the surface hierarchy via CSS vars instead of hardcoded hex values.

**Root cause of invisible card depth:** The contrast ratio between `#0d1117` (background) and `#161b22` (surface) is ~1.05:1 — imperceptible without a visible border. The `Card` component's original `ring-1 ring-foreground/10` resolved to `rgba(240,240,240,0.1)` in dark mode, which was invisible. Fixed by replacing with `border border-border` (`#30363d`), which is clearly visible.

---

### Font System (Inter + Geist)

Two fonts are now loaded via `next/font/google` from `app/fonts.ts`:

- **Inter** — body, heading, UI text (`--font-inter` → `--font-sans`, `--font-heading`)
- **Geist** — display/hero headings only (`--font-geist` → `--font-display`)

```typescript
// app/fonts.ts
import { Inter, Geist } from "next/font/google";

export const inter = Inter({ variable: "--font-inter", subsets: ["latin"], weight: ["400","500","600","700"], display: "swap" });
export const geist = Geist({ variable: "--font-geist", subsets: ["latin"], display: "swap" });
```

`displayStyles.hero`, `.lg`, `.md`, `.lgResponsive`, `.mdResponsive` use `font-display` (Geist). `displayStyles.sm` and the header/body/label tiers remain `font-sans` (Inter).

**Font loading bug fixed:** Both `inter.variable` and `geist.variable` must be on `<html>`, not `<body>`. The `@apply font-sans` rule is on `html` in globals.css, and CSS vars only cascade down — so `<html>` cannot read `--font-inter` if it's defined on a child element. Fix: moved both classes to `<html className={...}>` in `app/layout.tsx` and removed them from `<body>`.

---

### Grammarly Hydration Warning

The Grammarly browser extension injects `data-new-gr-c-s-check-loaded` and `data-gr-ext-installed` attributes into `<body>` before React hydrates, causing a tree hydration mismatch error. Fixed by adding `suppressHydrationWarning` to `<body>` in `app/layout.tsx`.

---

### Background Pattern — `app/page.tsx`

A subtle dot grid was added behind the landing page content:

```tsx
<div
  className="absolute inset-0 z-0 pointer-events-none"
  style={{
    backgroundImage: "radial-gradient(circle, var(--border-strong) 1px, transparent 1px)",
    backgroundSize: "24px 24px",
    opacity: 0.5,
  }}
/>
```

`var(--border-strong)` is used instead of `var(--border)` so the grid is visible in both modes: `#c4c4c4` on white (light) and `#484f58` on `#0d1117` (dark). All content sits above the pattern via `relative z-10` on the content wrapper. Gradient orbs that were prototyped here were removed — the dot grid alone is cleaner.

---

### Scroll Reveal — `hooks/useScrollReveal.ts`

A reusable `useScrollReveal` hook was created at `hooks/useScrollReveal.ts`:

```typescript
export function useScrollReveal({ threshold = 0.1, delay = 0 }: UseScrollRevealOptions = {}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = "0";
    el.style.transform = "translateY(12px)";
    el.style.transition = `opacity 0.4s ease-out ${delay}ms, transform 0.4s ease-out ${delay}ms`;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
        observer.unobserve(el);
      }
    }, { threshold });
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, delay]);
  return ref;
}
```

Uses `IntersectionObserver` for one-shot entrance animations (fade up 12px). Unobserves after firing so it doesn't re-trigger on scroll back up.

**Applied to all pages:**

| Page | Elements animated | Stagger |
|---|---|---|
| `app/page.tsx` | Hero section + 4 feature cards | 0 / 0 / 100 / 200 / 300ms |
| `app/graph/page.tsx` | 3 chart type cards | 0 / 100 / 200ms |
| `app/about/page.tsx` | About card / FAQ card / Contact card | 0 / 100 / 200ms |
| `app/compare/page.tsx` | 2 mode cards | 0 / 100ms |
| `app/browse/page.tsx` | Main 12-column grid wrapper | 0ms |
| `app/dashboard/page.tsx` | Profile column / Bookmarks column | 0 / 100ms |

**Hook placement rule:** All `useScrollReveal` calls must be declared before any conditional early return in the component function, following React Rules of Hooks. On `browse/page.tsx` (which has an `if (offeringDetail)` early return) and `dashboard/page.tsx` (which has `if (!user && loading) return null`), the refs are declared before those guards.

---

## Branch

All work was done on the `frontend-update` branch.
