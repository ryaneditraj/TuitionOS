# Security policy

## Reporting a vulnerability

Please report security issues privately. Use GitHub private vulnerability reporting on [ryaneditraj/TuitionOS](https://github.com/ryaneditraj/TuitionOS/security/advisories/new).

Do not open a public issue for an unfixed vulnerability, and do not include exploit details in a pull request description.

Include what you found, the version or commit, and the impact you expect. The maintainer will acknowledge a report and follow up with a fix or a reason it will not be changed.

## Supported versions

Security fixes land on the default branch. There are no versioned releases yet.

## Before you deploy this app

The local walkthrough is a demo. It is not safe for real student records until all of the following are true:

1. `JWT_SECRET` is a new random value of at least 32 characters. The old default `trinity-one-super-secret-key-2026-tei` was committed to git history and the app refuses to sign with it. Rotate any deployment that ever used that value. History was not rewritten.
2. `DEMO_MODE=false`. While demo mode is on, the app signs a visitor in as the sample student and `POST /api/auth/switch-demo` can assume any seeded persona, including super admin, without a password.
3. `DEMO_PASSWORD` is not the public sample password `trinity123`. Delete `trinity.db` after changing it so accounts are reseeded.
4. The process is served over HTTPS so the session cookie's `Secure` flag is meaningful (`NODE_ENV=production`).

## Known limitations

These are accepted for this demo and should be treated as production blockers:

- **Demo authentication is on by default.** That is what makes the sample personas work with no setup. Turn it off before real data.
- **The sample password is public.** It is in this file, the README, and the seed script as a fallback so the documented walkthrough keeps working.
- **Uploaded files are written under `public/uploads` and are world-readable** by anyone who can reach the server. Homework submissions and profile photos should move behind an authenticated download route before real use.
- **SQLite is a local file** (`trinity.db`) with no row-level security. The API enforces the checks described below. The database file itself must not be exposed.
- **`supabase-schema.sql` is a reference, not the live database.** The running app does not apply it. Row-level security is incomplete: several tables have RLS enabled and no policies (default deny). `SECURITY DEFINER` helpers set `search_path`. Do not point a production Supabase project at this file and assume it is finished.
- **Faculty scope is broad.** A teacher can schedule, upload, and mark attendance across batches. Batch admins are limited to batches they manage when scheduling or assigning tasks.
- **Anonymous community posts** store no author id, and the API does not return one. A later vote from the same account can still be correlated with that account. Anonymous feedback stores a null student id.
- **Search** is available to the signed-in demo session and returns institution content.
- **In-memory login rate limiting** applies inside one Node process only. It resets on restart and does not coordinate across multiple servers.
- **Content-Security-Policy allows `'unsafe-inline'`** because the Next.js App Router bootstraps with inline scripts. Development also allows `'unsafe-eval'`.
- **Dependency advisories that remain** are in the Tailwind CSS 3 build toolchain (`braces`, `micromatch`, `chokidar`, `fast-glob`, `postcss-selector-parser`) and the ESLint plugin used by `eslint-config-next`. They run at build or lint time. Clearing them means a Tailwind CSS 4 migration or an ESLint 9 move, which this change does not include. Runtime Next.js and PostCSS are on patched releases. See the pull request that introduced this file for the audit snapshot.
- **There is no automated test suite.**

## What the API already checks

- Session cookies are `HttpOnly` and `SameSite=Lax`, and `Secure` in production.
- Passwords are stored as bcrypt hashes. Login compares a dummy hash when the email is unknown.
- Login is limited to 8 attempts per email and address per 10 minutes in a single process.
- Students receive their own attendance, test marks, feedback, and problem reports. Class rosters require a faculty or admin role.
- Uploads require a faculty or admin role, stay inside the chosen bucket, and must match an allow-listed extension and file signature. HTML, SVG, and JavaScript uploads are rejected.
- Stored file and photo URLs must be an `/uploads/...` path or an `http`/`https` URL.
- Recurring schedules are limited to 370 days so a far-future date cannot fill the database.
- Production API errors do not return the underlying exception message.
