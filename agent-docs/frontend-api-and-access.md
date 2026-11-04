# Frontend, API, and access control

## Frontend shape

The Next.js application uses the App Router. The root layout wraps every page in `AuthProvider` and `NuqsAdapter` and always renders navigation and footer. Most feature pages are client components because they fetch interactively, read query state, or use Supabase browser auth. The `/admin` layout supplies the admin shell; `proxy.ts` applies route-level session refresh and redirects for `/dashboard` and `/admin`.

`AuthContext` is the shared browser-auth state. It initializes from `supabase.auth.getSession()` and listens for auth changes; it is not the authorization authority. Login, OAuth callback, password reset, and profile changes call the Supabase browser client directly.

## API contract boundary

`frontend/lib/api.ts` is the ordinary frontend-to-backend boundary and `lib/types.ts` is its companion type contract. Add or change a regular API operation in both places, then update the Spring DTO/controller mapping in the same change. `fetchAuthAPI` obtains the current access token on each call, adds `Authorization: Bearer <token>`, and handles 204 responses for deletes. `postAPI` is the public (no token) POST counterpart of `fetchAPI`, used by RMP reports. Non-OK responses from `fetchAuthAPI` throw `ApiError`, which keeps the usual message and adds `status`, for pages that need to react to a specific status (the admin RMP page does).

The public contact form in `app/about/page.tsx` is the intentional direct-fetch exception. Do not use it as a new general pattern.

Backend controllers generally return `Api*DTO` or `Admin*DTO`, rather than JPA entities. Exact shapes and nullability are contractual: browsing, compare/graph pages, dashboard components, and admin pages consume those TypeScript types directly.

## Authentication and authorization flow

```text
Supabase browser session
  -> frontend access token
  -> Authorization header to Spring
  -> JwtService forwards token + anon key to Supabase /auth/v1/user
  -> verified UUID for user-scoped work, or app_metadata.role for admin work
```

Security consequences:

- Do not derive identity from a URL, request body, or unverified JWT contents. Bookmark methods derive it from `JwtService.extractUserId`.
- Do not rely on `proxy.ts` for API protection. It excludes API paths and backend controllers must protect every non-public operation.
- An admin role is exactly the string `"admin"` in Supabase `app_metadata.role`; both frontend route gating and backend verification use it.
- Public contact submission has no authentication requirement. The server validates that name, email, and message are nonblank; the browser applies stricter UX validation but is not authoritative.

## API domains that have coupled consumers

| Domain | Spring boundary | Important frontend consumer/contract |
| --- | --- | --- |
| Browse | `/api/departments/...` | browse and compare pages require local numeric IDs before fetching live offerings |
| Graphs | `/api/graph/...` | chart routes consume CourseDiggers distribution and CourseSys-derived history |
| Bookmarks/preferences | `/api/bookmarks`, `/api/preferences` | bookmark button, dashboard table, email toggle; token required |
| Terms | `/api/terms/enrolling`, `/api/admin/terms` | public selection logic and admin term manager; affects live-history start point |
| Admin | `/api/admin/...` | admin pages call `api.*`; user analytics depend on Supabase Auth table access |
| Contact/support | `/api/contact`, `/api/admin/support/...` | public form creates a persisted support record; admin reply changes its state and attempts email |
| Rate My Professors | `/api/rmp`, `/api/rmp/reports` | instructor cards on offering detail and compare pages; public, uses `postAPI` for reports; see `agent-docs/rmp.md` |
| RMP review (admin) | `/api/admin/rmp/reports/...` | admin RMP Reports page and overview card; set-professor errors shown per status via `ApiError` |

For API additions, preserve the controller’s error semantics (not found, conflict, forbidden, no-content) because `fetchAPI`/`fetchAuthAPI` expose non-OK responses only as generic errors. If client-specific recovery is needed, design it consciously rather than expecting structured error handling already present in the common wrapper.

## UI conventions with architectural impact

UI tokens and typography constants are not just styling preference: `globals.css` defines both light and dark semantic values, and components rely on the corresponding Tailwind tokens. New semantics require paired `:root`/`.dark` tokens. Use the local shadcn primitives and Lucide icons so behavior and styling stay aligned with existing UI.
