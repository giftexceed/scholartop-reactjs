# TopScholars — university website + student portal

A portfolio project: a fast marketing site for a fictional university plus a working
student/admin portal. Built with React 19, Vite and React Router. No backend; the
portal stores everything in the visitor's browser.

## Run locally

```bash
cd client
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in client/dist
npm run lint     # also enforces the data-layer boundary (see below)
```

## What's inside

- **Landing page** (`/`): programs, about and video, campus gallery with a lightbox,
  testimonials, and a contact form whose messages land in the portal inbox.
- **Portal** (`/login`, `/register`, `/dashboard`): sample data is seeded on the first visit.

| Demo account | Email | Password |
|---|---|---|
| Admin | admin@topscholars.edu | admin123 |
| Student | student@topscholars.edu | student123 |

- **Admins** see an overview with charts and can manage students, courses, the gradebook,
  the attendance register, announcements, the contact inbox and user accounts.
- **Students** see their results and CGPA, attendance, courses and announcements.

Admins can restore the sample data from **My profile → Reset demo data**.

## Performance

- All images are WebP. The hero image is preloaded, with a smaller file for phones.
- Below-the-fold images are lazy-loaded. The video and the gallery load only when opened.
- The portal and its database code are split into their own chunks, so the landing page
  ships only React plus its own code.
- Hashed assets are cached for a year (`client/vercel.json`).

## Project structure

```
client/src/
  config/site.js        brand name, contact details, matric prefix
  lib/                  pure logic: grading/CGPA, date helpers
  data/
    api/                ← the ONLY data interface the UI uses
    useLiveData.js      ← the ONLY data hook the UI uses
    errors.js           DataError with codes (invalid, conflict, forbidden, …)
    local/              IndexedDB implementation (Dexie), seed data, session
  auth/AuthContext.jsx  current user, login/register/logout (via data/api)
  Components/           landing-page sections
  pages/Landing.jsx
  portal/               dashboard layout, pages and UI components
```

### The data layer

UI code never touches storage directly. Pages call async functions from `client/src/data/api`
(`listStudents()`, `createCourse(input)`, `setScore(id, score)`, …) and read them
reactively through `useLiveData(fn, deps)`. ESLint fails the build if anything outside
`client/src/data/` imports Dexie or `data/local/*`.

The data is shaped like it would be on a server:

- string UUID ids and ISO-8601 timestamps on every row
- password hashes never leave the data layer (`toPublicUser`)
- mutations check the caller's role (`requireAdmin`), as an API would
- aggregates (`getAdminOverview`) are computed in the data layer, not in components

## Moving to a real backend

The swap is confined to `client/src/data/`. Components, routes and styles stay unchanged.

1. **Create the tables** in Postgres (Supabase, Neon, etc.) to match the fields in
   `data/local/seed.js`: `users`, `programs`, `courses`, `students`, `enrollments`,
   `attendance`, `announcements` and `messages`. Use `uuid` ids and `timestamptz` dates,
   and keep the same unique constraints (email, matric, course code, student+course,
   student+date).
2. **Re-implement each file in `data/api/`** with `fetch()` or your backend's SDK. Keep
   the function names, arguments and return shapes. Map HTTP/DB errors onto `DataError`
   codes so the existing UI messages keep working.
3. **Auth.** Replace `login`, `register`, `logout`, `changePassword` and
   `getSessionUserId` with your auth provider. Store a token instead of the user id in
   `data/local/session.js`, or let the SDK manage the session. Hashing moves server-side.
4. **Permissions.** Enforce the role checks in `_context.js` on the server (for example,
   Postgres row-level security: students can read only their own enrollments and attendance).
5. **Reactivity.** Re-implement `useLiveData` with TanStack Query's `useQuery`, and
   invalidate the relevant queries after each mutation, or use realtime subscriptions.
   Call sites don't change.
6. **Seed and reset.** `initData()` becomes a no-op. Run the seed once as a SQL script,
   and remove `resetDemoData`.
7. Delete `data/local/`, then `npm uninstall dexie dexie-react-hooks`.

## Deploy (Vercel)

In the Vercel project settings, set **Root Directory** to `client`. Vercel then
detects Vite and installs, builds and serves `dist` automatically.
`client/vercel.json` adds the SPA fallback, so deep links like `/dashboard/students`
survive a refresh, and long-term caching for hashed assets.
