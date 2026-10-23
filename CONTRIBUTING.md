# Contributing to Trinity One

Thanks for helping improve Trinity One. The app is the mobile-first operating system in this repository (TuitionOS).

## Ground rules

- Be respectful. The [Code of Conduct](CODE_OF_CONDUCT.md) applies to issues, pull requests, and discussions.
- Keep pull requests focused. A feature, a bugfix, and a docs change can be separate PRs when they are easier to review that way.
- Do not commit `.env`, `trinity.db`, or real student data.
- Do not open a public issue for a security vulnerability. Use [SECURITY.md](SECURITY.md).

## Local setup

```bash
git clone https://github.com/ryaneditraj/TuitionOS.git
cd TuitionOS
cp .env.example .env
# Put a long random value in JWT_SECRET
npm install
npm run dev
```

Open http://localhost:3000. With `DEMO_MODE=true` (the default), the app signs in as the sample student Ryan Thomas. Use **Switch Role** in the header to try faculty and admin.

The sample password is the value of `DEMO_PASSWORD` (default `trinity123`). It is public on purpose for the local walkthrough. Change it before any shared deployment, then delete `trinity.db` so the database is seeded again.

## Checks

```bash
npm run lint
npm run build
```

There is no automated test suite yet. Please describe how you checked a behavior change in the pull request.

## What to include in a pull request

- What changed and why.
- Screenshots for visible UI changes.
- Any new environment variable, added to `.env.example` and the README.

## Project layout

- `src/app` — App Router pages and API routes
- `src/components` — views and modals
- `src/lib` — auth, database, and shared helpers
- `public/uploads` — demo notes, board photos, and papers
- `supabase-schema.sql` — reference PostgreSQL schema, not used by the local app
