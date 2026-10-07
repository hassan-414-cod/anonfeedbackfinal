# AnonFeedback

Anonymous project feedback — upload a project, get honest reviews under a mask.

A frontend-only **Next.js 14 (App Router)** project. There is no server, no API
routes and no cloud services, so it deploys to Vercel with zero configuration
and no environment variables.

## Run locally

```bash
npm install
npm run dev     # http://localhost:3000
```

## Build

```bash
npm run build
npm start
```

## How data works

All app logic is unchanged, but data is kept in the browser:

| Concern  | File                  | Backed by                |
| -------- | --------------------- | ------------------------ |
| Database | `lib/local-db.ts`     | `localStorage`           |
| Auth     | `lib/local-auth.ts`   | `localStorage`           |
| Files    | `lib/local-storage.ts`| `localStorage` / blob URL|

Each file mirrors the call shapes the pages use (`collection`, `doc`, `query`,
`where`, `onSnapshot`, `signInWithEmailAndPassword`, `uploadBytesResumable`, …).
To connect a real backend later, replace those three files; the pages do not
need to change.

> Data is per-browser. Clearing site data resets it.

## Structure

```
app/          routes (feed, projects, project/[id], rooms, leaderboard, …)
components/   shared UI (Navbar, ProjectCard, AuthModal, …)
lib/          helpers, auth context, local data layer
```
