# EasyPoint — website + student portal

React 19 + Vite. Public landing page at `/`, plus a demo school portal at `/login` and `/dashboard`.

## Run locally

```bash
cd client
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in client/dist
```

## Portal

All portal data (user accounts, students, courses, results, attendance, announcements,
and contact-form messages) is stored in the browser's IndexedDB via [Dexie](https://dexie.org).
Nothing is sent to a server, so each browser has its own copy. Sample data is seeded on first visit.

| Demo account | Email | Password |
|---|---|---|
| Admin | admin@easypoint.edu | admin123 |
| Student | student@easypoint.edu | student123 |

New visitors can also register a student account at `/register`.
Admins can reset the sample data from **My profile → Reset demo data**.

## Deploy to Vercel

`vercel.json` lives at the repo root and builds the `client/` folder, so import the repo with the
default settings (Root Directory left empty). It also adds the SPA fallback (so `/dashboard/*`
deep links work on refresh) and long-term caching for hashed assets.
