# Rentobots website + admin panel

Next.js 16 + Payload CMS 3 + PostgreSQL.

- **Public pages** are the original hand-built HTML in `site/`. Sections marked with
  `cms:` comments are filled from the database by `src/site/render.ts`; everything else
  is served exactly as designed. Pages are cached and rebuilt only when content changes.
- **Admin panel** at `/admin` — admins only, no public sign-up.
- **Static files** (CSS, JS, images) are in `public/assets/`.

## Content in the admin panel

| Section | Shown on |
|---|---|
| Case studies | `/case-studies` |
| Products | `/products` |
| Robots | robot tags on case studies |
| Photos | used by case studies and products (auto-converted to WebP) |
| Bookings | saved when a visitor sends a booking from `/hire` (WhatsApp still opens) |
| Admins | staff accounts |

## Run locally (Windows)

Double-click `start-local.cmd`, or in two terminals (Node 24 required):

```
npm run db     # local PostgreSQL on port 5433 (data in .pgdata/)
npm run dev    # http://localhost:3000  and  http://localhost:3000/admin
```

First time only:

```
npm install
npm run seed   # imports the current case studies, products and robots
```

Then open `/admin` and create the first admin account.

## Adding a new editable section

1. Add a collection in `src/collections/` and register it in `src/payload.config.ts`.
2. Mark the region in the page in `site/` with `<!--cms:key-->…<!--/cms:key-->`.
3. Add a renderer for that page in `src/site/render.ts`.
4. Add `revalidatePages(['page-name'])` hooks so edits appear immediately.

## Vercel preview (for the team)

Vercel has no permanent disk or built-in database, so the preview uses:

- **Neon** (free PostgreSQL) → `DATABASE_URL`
- **Vercel Blob** (photo storage) → `BLOB_READ_WRITE_TOKEN` (added automatically when a Blob store is connected)
- `PAYLOAD_SECRET` (long random string) and `NEXT_PUBLIC_SITE_URL` (the preview URL)

The build command (`vercel.json`) is `npm run ci`, which applies database migrations, then builds.

Load the current content into the online database once, from this PC:

```
set DATABASE_URL=<neon url>
set BLOB_READ_WRITE_TOKEN=<blob token>
npm run payload migrate
npm run seed
```

## Database changes

Locally, tables update automatically. For the online database, after changing a collection run
`npm run payload migrate:create <name>` and commit the new file in `src/migrations/`.
