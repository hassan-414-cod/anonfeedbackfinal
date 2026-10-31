# AnonFeedback

Anonymous project feedback: upload a project, get honest reviews under a mask.

```
Browser ──▶ Next.js (frontend, :3000) ──/api/*──▶ Express (backend, :4000) ──Knex──▶ PostgreSQL
```

- **Frontend:** Next.js 14 (App Router) in the repo root. It never talks to the database: every
  `/api/*` request is forwarded to the Express backend by a rewrite in `next.config.mjs`.
- **Backend:** Express + Knex in [backend/](backend). Migrations and seeds build the whole database.
- **Database:** PostgreSQL. Uploaded files go to local disk (`backend/uploads`) in development.

## First-time setup

1. Have PostgreSQL running.
2. Create the env files:
   - `backend/.env`: copy `backend/.env.example` and put your Postgres password in `DATABASE_URL`.
   - `.env` (root): copy `.env.example` (only holds `BACKEND_URL`, the default works locally).
3. Install, then create the database, run migrations and seeds:

```bash
npm run install:all     # frontend + backend dependencies
npm run db:setup        # create database + knex migrate:latest + seeds
npm run dev:all         # frontend on :3000 and backend on :4000
```

Open http://localhost:3000. To use `/admin`, sign up in the app, then:

```bash
npm run make-admin -- you@example.com
```

## Database commands (run from the repo root, or inside `backend/` without the prefix)

| Command | What it does |
|---|---|
| `npm run db:setup` | create the database if missing, run all migrations, run seeds |
| `npm run migrate` | apply new migrations only |
| `npm --prefix backend run migrate:rollback` | undo the last batch |
| `npm --prefix backend run migrate:make -- add_something` | create a new migration file |
| `npm --prefix backend run seed` | re-run seeds (idempotent) |
| `npm --prefix backend run db:reset` | **dev only**: drop and rebuild the database from scratch |

Anyone who clones the repo gets the identical database with `npm run db:setup`.

## Structure

```
app/, components/, lib/, hooks/    Next.js frontend (lib/api.ts is the browser API client)
backend/
  migrations/                      Knex migrations (tables, enums, triggers)
  seeds/                           default data (the 4 chat rooms)
  src/
    server.js, app.js              Express bootstrap and middleware
    routes/                        auth, me, projects, feedback, rooms, reports, admin, public
    middleware/                    session auth, CSRF origin check, upload, errors
    services/                      auth (argon2, sessions), storage (local disk)
    utils/                         validation, serializers, rate limit, handles
  scripts/                         db-create, db-reset, make-admin
  API.md                           endpoint reference
```

## Moving to production

- Set `DATABASE_URL` for the production Postgres and run `npm run db:setup` against it.
- Set `FRONTEND_ORIGIN` (backend) and `BACKEND_URL` (frontend) to the real URLs; use HTTPS so the
  session cookie is `Secure`.
- Replace `backend/src/services/storage.js` (local disk) with S3 / R2; it has three functions.
- Remove `DEMO_BILLING` and the `/me/plan` route; set `subscription_status` from a payment webhook.
- Swap the in-memory rate limiter (`utils/rateLimit.js`) for Redis; send real password-reset emails
  (the link is currently printed in the backend console).
