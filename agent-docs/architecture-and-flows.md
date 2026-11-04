# Architecture and major flows

## System boundary

The project is two independently deployed applications sharing Supabase:

```text
Next.js (Vercel) ── NEXT_PUBLIC_API_URL ──> Spring Boot API (Elastic Beanstalk)
      │                                           │
      └──── Supabase Auth cookies/session ────────┼──> Supabase PostgreSQL
                                                  ├──> SFU CourseSys (live sections)
                                                  ├──> CourseDiggers (ingested grade data)
                                                  └──> Resend (contact/support/digest email)
```

The browser does not talk to the Spring API through a Next.js proxy: browser-side calls use the configured API base URL. CORS is configured in Spring for local and deployed origins. Supabase has two roles: its Auth service is the identity authority, and PostgreSQL stores the application’s durable state.

## Data ownership

| Data | Authority and access pattern |
| --- | --- |
| Departments, course identity/metadata, terms, bookmarks, preferences, contact submissions | PostgreSQL through JPA/JdbcTemplate |
| Grade distribution and related CourseDiggers mapping | PostgreSQL; populated offline from CourseDiggers |
| Current section, instructor, campus, capacity, and enrollment | CourseSys at request time; not persisted by the web app |
| Identity, account metadata, and admin role | Supabase Auth; `auth.users` is also queried by admin user reporting |

This split is central to change planning: browse, graph, and bookmarked-offering responses combine local IDs/metadata with a live external request. Changes that appear to be “course data” changes may belong in an ingestion script, a CourseSys parser, or a controller rather than an entity.

## Primary request paths

### Browse and offering detail

1. The browse page gets departments and courses through `lib/api.ts`.
2. Spring reads `Department`/`Course` data from repositories and returns API DTOs.
3. When offerings or an offering detail are requested, `BrowseController` loads the local course with its department, then requests CourseSys for the selected semester(s).
4. CourseSys rows become `CourseSysOffering` models and are mapped to API offering DTOs. Offering detail adds locally stored CourseDiggers statistics when available.

The offerings-list endpoint works backward from the enrolling term (or current term) for 12 semesters. It is therefore an externally dependent, multi-request endpoint rather than a database history query.

### Bookmarks and dashboard

1. The browser obtains the Supabase session access token and `fetchAuthAPI` sends it as a Bearer token.
2. `JwtService` calls Supabase Auth’s `/auth/v1/user` endpoint to validate that token and obtain the UUID.
3. Bookmark CRUD is scoped to that UUID in the API. A bookmark identifies one local department/course plus a semester code and section.
4. The dashboard’s bookmarked-offerings call re-fetches each bookmarked course/semester from CourseSys and matches its saved section. A bookmark can therefore remain durable even when a live offering no longer appears; the response simply omits unmatched live offerings.

### Admin functions

The frontend middleware gives an early UI redirect for non-admin users, but each `/api/admin/**` controller independently calls `JwtService.verifyAdmin`. Admin user reports use SQL over Supabase’s `auth.users` plus public preferences/bookmarks; this coupling is not expressible as ordinary JPA entity relations.

Admin support actions mutate `contact_submissions`; replying also invokes Resend. Term updates clear every current/enrolling flag and then set exactly one of each inside a transaction. Admin health checks intentionally exercise the database and third-party reachability. Admin RMP review resolves `rmp_mismatch_reports` and can change the reported `rmp_lookup` row; setting a professor fetches the profile from Rate My Professors first (see `rmp.md`).
