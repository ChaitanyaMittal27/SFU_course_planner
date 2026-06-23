# SFU Course Planner

Course planning and discovery app for Simon Fraser University. Browse courses/departments, view enrollment trends and grade distributions, compare sections, bookmark offerings, and get notified about enrollment changes.

**Live:** sfucourseplanner.com | **API:** api.sfucourseplanner.com

## Tech Stack

### Backend (Spring Boot)
- Java 17, Spring Boot 3.0.0, Gradle
- Spring Data JPA (Hibernate) + PostgreSQL (Supabase)
- Server port: 5000 (AWS Elastic Beanstalk)
- JPA DDL mode: `validate` (no auto-schema — manage DB schema manually)

### Frontend (Next.js)
- Next.js 16.2.9, React 19, TypeScript 5
- Tailwind CSS v4 + CSS custom properties for theming
- shadcn/ui (built on @base-ui/react) for UI primitives
- Supabase Auth (JWT in httpOnly cookies)
- Recharts for analytics charts
- Lucide React for icons
- nuqs for URL query state
- EmailJS for contact form

## Repository Structure

```
├── build.gradle                    # Spring Boot config (Java 17, Spring Boot 3.0.0)
├── src/main/java/com/example/courseplanner/
│   ├── Application.java           # Spring Boot entry point
│   ├── config/CorsConfig.java     # CORS (localhost + sfucourseplanner.com + vercel.app)
│   ├── controller/
│   │   ├── AboutController.java       # GET /api/about, GET /api/terms/enrolling
│   │   ├── BrowseController.java      # Departments, courses, offerings (public)
│   │   ├── BookmarkController.java    # CRUD bookmarks (JWT protected)
│   │   ├── GraphController.java       # Grade distribution, enrollment history (public)
│   │   ├── UserPreferenceController.java  # Email notification prefs (JWT protected)
│   │   └── TestController.java        # JWT test endpoint
│   ├── entity/                    # JPA entities: Department, Course, Term, Bookmark,
│   │                                UserPreference, CourseStats, CourseDiggerMap/Stats
│   ├── dto/                       # All prefixed Api*DTO (e.g. ApiBookmarkDTO)
│   ├── repository/                # Spring Data JPA interfaces
│   ├── service/
│   │   ├── JwtService.java        # JWT verification via Supabase API call
│   │   └── CourseSysClient.java   # Fetches live data from SFU's CourseSys API
│   ├── model/                     # CourseSysBrowseResult, CourseSysOffering
│   ├── exception/                 # GlobalExceptionHandler, ForbiddenException
│   └── utils/SemesterUtil.java    # Semester code encoding (e.g. 1257 = Fall 2025)
├── src/main/resources/
│   └── application.properties     # DB, Supabase, JPA config (env vars)
├── course-planner-frontend/
│   ├── app/
│   │   ├── layout.tsx             # Root layout (AuthProvider, NuqsAdapter, Navigation, Footer)
│   │   ├── page.tsx               # Landing page with splash screen
│   │   ├── globals.css            # ALL design tokens, theme variables, animations
│   │   ├── fonts.ts               # Font imports (Inter, Geist) + typography style constants
│   │   ├── browse/                # Course browsing and detail view
│   │   ├── dashboard/             # User bookmarks/watchlist (auth required)
│   │   ├── graph/{enrollment,grades,load}/  # Analytics charts
│   │   ├── compare/{courses,sections}/      # Side-by-side comparison
│   │   ├── login/                 # Sign in / sign up
│   │   ├── auth/{callback,reset-password}/  # OAuth callback, password reset
│   │   └── {about,docs,privacy,termsofservice}/
│   ├── components/
│   │   ├── ui/                    # shadcn components (see list below)
│   │   ├── Navigation.tsx         # Sticky header with theme toggle + auth
│   │   ├── Footer.tsx
│   │   ├── BookmarkButton.tsx     # Add/remove bookmark with auth check
│   │   ├── OfferingsTable.tsx     # Course offerings data table
│   │   ├── BookmarksTable.tsx     # Dashboard bookmarks table
│   │   ├── GradeHistogram.tsx     # Recharts bar chart
│   │   ├── LoadBar.tsx            # Enrollment load progress bar
│   │   ├── StatusBadge.tsx        # Enrollment status (open/full/waitlist)
│   │   ├── ErrorMessage.tsx       # Error card with retry
│   │   ├── LoadingSpinner.tsx
│   │   ├── LoadingSkeleton.tsx
│   │   ├── PageContainer.tsx      # Layout wrapper (max-w-7xl)
│   │   ├── ProfileAvatar.tsx
│   │   ├── EmailNotificationToggle.tsx
│   │   ├── Splash.tsx             # First-visit splash animation
│   │   └── landing/HeroPreview.tsx
│   ├── lib/
│   │   ├── api.ts                 # Centralized API client (fetchAPI + fetchAuthAPI)
│   │   ├── types.ts               # All TypeScript interfaces
│   │   ├── utils.ts               # cn() helper (clsx + tailwind-merge)
│   │   └── supabase/{client,server}.ts  # Supabase browser + server clients
│   ├── contexts/AuthContext.tsx   # Auth state (user, userId, isLoading, signOut)
│   └── hooks/
│       ├── useTheme.ts            # Dark/light toggle with localStorage
│       └── useScrollReveal.ts     # Intersection Observer scroll animations
├── coding_standards.txt           # Frontend coding rules (reference)
└── docs/                          # Design system migration docs, API test scripts
```

## Build & Run

```bash
# Backend
./gradlew bootRun                  # Starts on port 5000
./gradlew bootJar                  # Build JAR

# Frontend
cd course-planner-frontend
npm install
npm run dev                        # Starts on port 3000
npm run build                      # Production build
npm run lint                       # ESLint
```

## Environment Variables

### Backend (application.properties reads from env)
- `DB_URL_NEW` — Supabase PostgreSQL JDBC URL
- `DB_USER_NEW` — Database username
- `DB_PASS_NEW` — Database password
- `SUPABASE_URL_NEW` — Supabase project URL
- `SUPABASE_KEY_NEW` — Supabase anon key
- `SERVER_PORT` — Server port (default: 5000)

### Frontend (.env.local)
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `NEXT_PUBLIC_API_URL` — Backend API base URL
- `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY` — EmailJS public key
- `NEXT_PUBLIC_EMAILJS_SERVICE_ID` — EmailJS service ID
- `NEXT_PUBLIC_EMAILJS_TEMPLATE_ID` — EmailJS template ID

## API Endpoints

### Public (no auth)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/about` | App info |
| GET | `/api/terms/enrolling` | Current enrolling term |
| GET | `/api/departments` | All departments (sorted by code) |
| GET | `/api/departments/{deptId}/courses` | Courses for department |
| GET | `/api/departments/{deptId}/courses/{courseId}/offerings` | All offerings (~4 years) |
| GET | `/api/departments/{deptId}/courses/{courseId}/offerings/{semesterCode}` | Single semester detail |
| GET | `/api/graph/grade-distribution?courseId=` | CourseDiggers grade stats |
| GET | `/api/graph/enrollment-history?deptId=&courseId=&range=` | Enrollment over time (1yr/3yr/5yr) |

### Protected (JWT required — `Authorization: Bearer <token>`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/bookmarks` | User's bookmarks |
| GET | `/api/bookmarks/offerings` | Bookmarked offerings with live data |
| POST | `/api/bookmarks` | Create bookmark (409 if duplicate) |
| DELETE | `/api/bookmarks/{id}` | Delete bookmark (403 if not owner) |
| GET | `/api/preferences/email-notifications` | Get email pref (default: false) |
| PUT | `/api/preferences/email-notifications` | Update email pref (upsert) |

## Key Architecture Patterns

### JWT Authentication Flow
1. User signs in via Supabase Auth (email/password or OAuth)
2. Supabase stores JWT in httpOnly cookies, frontend reads via `supabase.auth.getSession()`
3. Frontend sends `Authorization: Bearer <JWT>` on protected API calls (`fetchAuthAPI` in `lib/api.ts`)
4. Backend's `JwtService` verifies JWT by calling Supabase's `/auth/v1/user` endpoint (no local JWT parsing)
5. Backend extracts `userId` (UUID) from Supabase response for ownership checks

### Semester Code System
SFU semester codes encode year + term as a single number:
- Formula: `(year - 1900) * 10 + termDigit` where spring=1, summer=4, fall=7
- Example: Fall 2025 = `125 * 10 + 7 = 1257`
- Utility: `SemesterUtil.java` handles encode/decode/previous

### Frontend API Client Pattern
All API calls go through `lib/api.ts`:
- `fetchAPI<T>()` for public endpoints
- `fetchAuthAPI<T>()` for protected endpoints (auto-injects JWT)
- 401 response → "Session expired" error
- 204 response → returns undefined (for DELETE)

### Backend Controller Pattern (reference: BookmarkController.java)
- Constructor injection for all dependencies (repositories, services)
- `@RequestHeader("Authorization")` to receive JWT
- Extract userId: `UUID.fromString(jwtService.extractUserId(authHeader))`
- Return DTOs (never entities), use `toDTO()` private mapper methods
- Ownership checks before mutations (403 Forbidden if not owner)
- Proper HTTP status codes: 201 Created, 204 No Content, 404 Not Found, 409 Conflict

### External Data: CourseSys Integration
`CourseSysClient` fetches live course offering data from SFU's CourseSys API (`coursys.sfu.ca/browse/`). It parses HTML table responses into structured `CourseSysOffering` objects. Returns empty results (not null) on failure.

## Frontend Coding Standards

### Colors — NEVER hardcode hex values or Tailwind color names
Use CSS variable tokens from `globals.css`:
```
bg-primary, bg-accent, bg-surface, bg-surface-raised, bg-background
text-text-primary, text-text-muted, text-text-subtle
text-primary-foreground, text-accent-foreground
border-border, border-border-strong
bg-success, bg-warning, bg-destructive (semantic)
```

Dark mode is automatic via CSS variables — never use `dark:` prefix with hardcoded colors.

To add a new token: add CSS var in both `:root` and `.dark` in `globals.css`, map it in the `@theme inline` block, then use as Tailwind class.

### Typography — NEVER hardcode font sizes inline
Import style constants from `@/app/fonts`:
```typescript
import { displayStyles, headerStyles, bodyStyles, labelStyles, buttonStyles } from '@/app/fonts'

<h1 className={`${displayStyles.landing} text-text-primary`}>Title</h1>
<p className={`${bodyStyles.md} text-text-muted`}>Description</p>
```

Available constants:
- `displayStyles` — lg, md, sm, hero, landing, lgResponsive, mdResponsive
- `headerStyles` — lg, md, sm, xs, lgResponsive, mdResponsive
- `bodyStyles` — lg, md, sm
- `labelStyles` — lg, md, sm
- `buttonStyles` — lg, md, sm

Fonts loaded: **Inter** (sans, heading) and **Geist** (display). Mono: Cascadia Code.

### Components — use shadcn/ui before writing custom JSX
Installed shadcn components in `components/ui/`:
`Avatar`, `Badge`, `Button`, `Card`, `DropdownMenu`, `Input`, `Skeleton`, `Switch`, `Table`, `Textarea`

### Icons — Lucide React only
```typescript
import { Search, BarChart3, X } from 'lucide-react'
```
Never write raw SVG paths inline.

### Animations — use globals.css classes
Available: `animate-fade-in`, `animate-slide-up`, `animate-slide-down`, `animate-scale-in`, `animate-float`, `animate-pulse-soft`, `animate-shimmer`, `animate-spin-slow`, `animate-reveal-up`, `stagger-children`

Never write animation inline styles or new keyframes in component files — add them to `globals.css` if needed.

### TypeScript
- Every component needs typed props interface
- No `any` types
- Use existing types from `lib/types.ts` before defining new ones

### Spacing
Use Tailwind spacing scale (`p-4`, `gap-6`). Never hardcode px values inline.

## What NOT to Do

- **No hardcoded colors**: Don't use hex values, Tailwind color names (red-600, gray-300, slate-700), or `dark:bg-slate-800`. Use design tokens only.
- **No inline font sizes**: Don't write `text-xl` or `style={{fontSize: '16px'}}`. Use font style constants from `fonts.ts`.
- **No inline animations**: Don't add `@keyframes` in component files. Add to `globals.css`.
- **No inline px spacing**: Don't write `style={{padding: '16px'}}`. Use Tailwind scale.
- **No raw SVG**: Use Lucide React icons.
- **No custom UI primitives**: Check shadcn `components/ui/` first.
- **No JSDoc headers in components**: Inline comments only where logic is non-obvious.
- **No `any` types**: Always type properly; use `lib/types.ts`.
- **No returning entities from controllers**: Always map to DTOs.
- **No local JWT parsing**: JWT verification goes through Supabase API call in `JwtService`.

## Work in Progress

- **UserPreferences backend**: Implemented (`UserPreferenceController`, entity, repository). Email notification toggle connected in frontend.
- **Email notification system**: Planned but not yet implemented — the toggle/preference exists but no email sending logic on backend.
- **Frontend redesign**: Ongoing — responsive UI updates on `responsive-ui` branch, dashboard updates on `dashboard-update` branch. Landing page recently redesigned with new splash screen and feature preview cards.