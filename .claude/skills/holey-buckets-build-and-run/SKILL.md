---
name: holey-buckets-build-and-run
description: Environment setup, build, run, and deploy runbook for the Holey Buckets app. Use when recreating the dev environment from scratch, running npm dev/build/start/lint, interpreting healthy build output, understanding the Netlify deploy pipeline, or finding where runtime data and downloaded artifacts land. Do NOT use for the manual QA protocol (see holey-buckets-validation-and-qa), diagnosing a failing build or specific runtime bugs (see holey-buckets-debugging-playbook), editing config values (see holey-buckets-config-catalog), or the localStorage schema in depth (see holey-buckets-round-data-safety).
---

# Holey Buckets — Build & Run Runbook

Holey Buckets is a mobile-first Next.js 14 (App Router) web app for scoring a round of
bucket golf (backyard golf: chip a ball into a bucket). It has **no backend, no database,
no accounts** — a round lives entirely in the phone's `localStorage`. This skill gets you
from an empty machine to a running app, a known-good build, and a live deploy.

## When to use this skill

- Setting up the repo on a fresh machine or fresh session.
- Running, building, or linting the app; reading build output.
- Understanding how deploys happen and where the live site is.
- Finding where user data and downloaded files land at runtime.

## When NOT to use (go to the sibling instead)

| Need | Skill |
|---|---|
| What counts as verification evidence; manual QA protocol | `holey-buckets-validation-and-qa` |
| A specific failure symptom to diagnose (including a failing build) | `holey-buckets-debugging-playbook` |
| Editing branding/course config fields | `holey-buckets-config-catalog` |
| localStorage schema, safe data-shape changes | `holey-buckets-round-data-safety` |
| Whether a change is allowed and how it gets reviewed | `holey-buckets-change-control` |
| Why the architecture is shaped this way | `holey-buckets-architecture-contract` |

## 1. Prerequisites and bootstrap

Prereqs: **Node.js 18 or newer** (per README; verified working on Node 22.22.2 / npm
10.9.7 as of 2026-07-02) and npm. Nothing else — no env vars, no secrets, no services.

```bash
cd /path/to/holeybucketsapp
npm install      # one-time: installs all deps (Next 14.2.35, React 18.3, jsPDF, Tailwind)
npm run dev      # starts the dev server
```

Open <http://localhost:3000>. You should see the landing page ("Holey Buckets",
tagline "Backyard golf for everyone.", a "Find your course" button — since
2026-07-16 the landing is course-agnostic; "Start a round" lives on each course
home at `/courses/<id>`). Pages hot-reload
as you edit. Requires internet on first run: `npm install` hits the npm registry,
and any dev/build compile fetches Google Fonts (see Traps, §5).

There are **no .env files and none are needed** — verified 2026-07-02: no `.env*` files
exist in the repo and `grep -rn "process.env" src/` returns nothing. (`next-env.d.ts`
is a TypeScript ambient-types file, not an env file.)

## 2. Command anatomy

All four scripts, from `package.json` (there are no others):

| Command | Runs | What it actually does |
|---|---|---|
| `npm run dev` | `next dev` | Dev server on http://localhost:3000, hot reload. No lint/type gate — errors surface as overlays in the browser. |
| `npm run build` | `next build` | Production build. **Includes ESLint AND TypeScript type-checking** (the "Linting and checking validity of types" phase). This is the only automated correctness gate in the whole project. Output goes to `.next/`. |
| `npm run start` | `next start` | Serves the LAST production build from `.next/` on port 3000. Fails if you never ran `build`. Rarely needed locally; Netlify handles prod serving. |
| `npm run lint` | `next lint` | ESLint only (config: `.eslintrc.json` extends `next/core-web-vitals`). **Does NOT type-check.** |

**There is NO separate `typecheck` script.** If you want a type-check without a full
build, run `npx tsc --noEmit` — but the canonical gate is `npm run build`, and every PR
must show it passing (see `holey-buckets-change-control`).

## 3. Expected build output (known-good, 2026-07-16)

A healthy `npm run build` ends with this route table (sizes drift a little between
dependency or code changes — the ROUTE LIST and the ○/●/ƒ markers are what you diff):

```text
Route (app)                              Size     First Load JS
┌ ○ /                                    927 B          97.2 kB
├ ○ /_not-found                          873 B          88.4 kB
├ ƒ /admin/[key]                         4.3 kB          106 kB
├ ○ /course                              2.96 kB         108 kB
├ ● /courses/[courseId]                  1.37 kB         103 kB
├   └ /courses/osceola
├ ○ /how-to-play                         175 B          96.4 kB
├ ○ /icon.svg                            0 B                0 B
├ ƒ /play/[roundId]                      5.42 kB         107 kB
├ ƒ /play/[roundId]/results              5.17 kB         110 kB
└ ○ /start                               2.72 kB         107 kB

○  (Static)   prerendered as static content
●  (SSG)      prerendered as static HTML (uses getStaticProps)
ƒ  (Dynamic)  server-rendered on demand
```

Healthy build checklist:

1. `✓ Compiled successfully`
2. `Linting and checking validity of types ...` passes silently (no `Failed to compile`).
3. `✓ Generating static pages (9/9)`.
4. Route table matches above: `/`, `/_not-found`, `/course`, `/how-to-play`,
   `/icon.svg`, `/start` static (○); `/courses/[courseId]` SSG (●, one page per
   registered course); `/admin/[key]`, `/play/[roundId]`, and
   `/play/[roundId]/results` dynamic (ƒ).
5. Exit code 0.

Deviations and what they mean:

| You see | It means |
|---|---|
| `Failed to compile` + a `Type error:` block | TypeScript error — build runs `tsc` in strict mode. Fix the type error; there is no skip flag in use. |
| `Failed to compile` + ESLint rule names | Lint failure under `next/core-web-vitals`. Reproduce faster with `npm run lint`. |
| Fewer/more than 10 routes, or a ○/●/ƒ flip | You added/removed a page, or changed a page's rendering mode (e.g. removed `"use client"` or added server-only code). A ƒ→○ flip on the `/play` routes is a red flag — see Traps. |
| Failure mentioning fonts / `next/font` / fetch during "Creating an optimized production build" | Network to Google Fonts blocked — see Traps §5. |
| First Load JS ballooning (e.g. jsPDF in the shared chunk) | jsPDF must stay a dynamic import (bundle-weight rule, PR #13). See `holey-buckets-architecture-contract`. |

## 4. Deploy pipeline (Netlify — the ONLY automation)

- Netlify is connected to the GitHub repo and reads **`netlify.toml`** at the repo root:
  build command `npm run build`, publish directory `.next`, plugin
  `@netlify/plugin-nextjs`. Zero dashboard config.
- **Every push to `main` triggers an automatic rebuild + publish.** There is no staging
  environment and no preview gate you must pass. Since 2026-07-03 a GitHub Actions
  workflow (`.github/workflows/ci.yml`: typecheck, lint, `npm test` via vitest, build)
  runs on every PR and push to `main` — but Netlify deploys independently of it; the
  Netlify build (lint + type-check, §2) is still the only gate that blocks production.
- Live URL: **https://holeybuckets.netlify.app** (as of 2026-07-02; matches
  `siteUrl` in `src/config/branding.ts`, which is printed on the share card). A real
  custom domain is planned at launch — when it changes, `branding.siteUrl` must be
  repointed too (owned by `holey-buckets-launch-campaign` / `holey-buckets-config-catalog`).
- Deploy discipline: work happens on a branch, merged to `main` via small PRs with a
  "Verified" section. Do not push to `main` to "just deploy" — see
  `holey-buckets-change-control`.
- If a deploy fails on Netlify but builds locally, first suspect the font fetch (§5) or
  a Node-version mismatch on the Netlify image; the build command is identical to local
  `npm run build`, so a local repro is almost always possible.

## 5. Known traps

1. **Google Fonts are fetched AT BUILD TIME.** `src/app/layout.tsx` loads
   Bricolage Grotesque (700/800) and Figtree (400–700) via `next/font/google`, so any
   `next build` (and the first `next dev` compile) must reach `fonts.googleapis.com` —
   plan network access accordingly. Diagnosing a font-fetch build failure (symptom,
   failing phase, fix) is owned by `holey-buckets-debugging-playbook` Case 6. Do not
   swap to local fonts as a workaround without going through change control.
2. **The interactive pages are client-rendered on purpose.** `/start`,
   `/play/[roundId]`, and `/play/[roundId]/results` (plus `PrintBlankButton`) carry
   `"use client"`, and all localStorage access goes through `hasStorage()` guards in
   `src/lib/storage.ts` so server rendering never touches `window`. If you add code to
   these pages, keep it inside that pattern — removing `"use client"` or reading
   `localStorage` outside `storage.ts` breaks the build or crashes at render. The
   scoring page shows "Loading round…" until the client loads the round, then a
   "couldn't find that round on this device" fallback if the id isn't in localStorage.
3. **`.next/` and `node_modules/` are gitignored** (see `.gitignore`). Never commit
   them; a fresh clone always needs `npm install`, and `npm run start` always needs a
   prior `npm run build`.
4. **No env files.** `.gitignore` lists `.env*.local` defensively, but nothing reads
   env vars. If a task seems to need a secret, stop — that is a Phase-2/backend
   conversation, not a local tweak.
5. **Next.js is pinned at 14.2.35 deliberately** (PR #1, 2026-06-26): some DoS-class
   advisories were accepted as not-applicable for a no-backend MVP. `npm audit` noise
   is expected; do not bump the major "to fix audit" without change control.

## 6. Where data and artifacts land at runtime

Everything user-visible is client-side; the server writes nothing.

| Thing | Where | Detail |
|---|---|---|
| A round in progress | Browser localStorage | Keys `holeybuckets:round:<id>` (JSON) and `holeybuckets:activeRoundId`. Schema and safe-change rules: see `holey-buckets-round-data-safety`. |
| Blank printable scorecard (PDF) | User's Downloads | Filename `Holey Buckets - <course name> - blank scorecard.pdf` (from `src/lib/pdf.ts`). |
| Completed-round scorecard (PDF) | User's Downloads | Filename `Holey Buckets - <group name> scorecard.pdf`. |
| Share image (1080×1080 PNG) | Native share sheet, or Downloads as fallback | Filename `holey-buckets-result.png` (from `src/lib/shareImage.ts`). |
| Build output | `.next/` (gitignored) | Produced by `npm run build`; served by `npm run start` / Netlify. |

Rounds are device-local and unrecoverable across devices — that is a known,
deliberate MVP limitation, and the results page tells users so.

## 7. Route map (all 10 routes)

| Route | Mode | Purpose |
|---|---|---|
| `/` | static | Course-agnostic landing (since 2026-07-16): what Holey Buckets / bucket golf is, a 3-step how-to-play summary (full rules → `/how-to-play`), and a "Find your course" list with one card per registry course → `/courses/<id>`. |
| `/courses/[courseId]` | SSG (●) | Per-course home — the screen a course card lands on: resume-round button, "Start a round" → `/start`, links to `/how-to-play` and `/course`, rotating sponsor slot. Prebuilt for every registered course via `generateStaticParams`; unknown ids 404. |
| `/how-to-play` | static | The house rules as a short numbered list, with a sticky "Start a round" CTA. |
| `/admin/[key]` | dynamic (ƒ) | Owner admin panel, gated by the `adminKey` in `src/config/sheets.ts`; a wrong key renders only "There's nothing at this address." |
| `/course` | static | Course preview for the flagship course "The Gray Duck" (Osceola, WI), rendered entirely from `src/config/courses/osceola.ts`: hero, per-hole cards, difficulty pips, blank-PDF button. Hole data is placeholder until the owner's worksheet arrives. |
| `/start` | static shell, client logic | Start a round: group name, players, format picker (only Stroke Play is available today), blank-PDF button. On start it creates the round in localStorage and routes to `/play/<id>`. Always uses `defaultCourse` — there is no course-selection UI yet. |
| `/play/[roundId]` | dynamic (ƒ) | THE scoring screen. Loads the round from localStorage by URL id. Per-player: strokes stepper, "Chipped in −1" toggle (bucket chip = holing out by chipping into the bucket, −1 net), "Penalty +1" counter, and a "Balls used" stepper (only when the course sets `trackBalls` — a billing tally that never affects score). Live leaderboard; every tap saves immediately. |
| `/play/[roundId]/results` | dynamic (ƒ) | Winner hero (handles ties), share-image buttons, final standings, scorecard grid, PDF download. |
| `/icon.svg` | static | The favicon, served as a route by Next (`src/app/icon.svg`). |
| `/_not-found` | static | Next.js default 404. |

("Net strokes" = strokes − 1 if bucket-chipped + 1 per penalty, floored at 0. Full rule
math lives in `bucket-golf-reference`; the implementation's single source of truth is
`src/lib/scoring.ts`.)

## 8. Provenance and maintenance

Derived 2026-07-02 (repo commit aa4c527) by direct inspection of `package.json`,
`README.md`, `netlify.toml`, `.eslintrc.json`, `.gitignore`, `next.config.mjs`,
`src/app/layout.tsx`, `src/lib/storage.ts`, `src/lib/pdf.ts`, `src/lib/shareImage.ts`,
plus an actual `npm run build` whose output is quoted verbatim in §3. PR facts are from
the repo's GitHub PR history (e.g. PR #1, 2026-06-26; PR #13).

Re-verify before trusting, if time has passed:

| Claim | One-line check |
|---|---|
| Scripts are exactly dev/build/start/lint | `cat package.json` (scripts block) |
| Build passes; route table matches §3 | `npm run build` and diff the route table |
| lint config is next/core-web-vitals | `cat .eslintrc.json` |
| Netlify build/publish/plugin | `cat netlify.toml` |
| CI workflow present (since 2026-07-03) | `ls .github/workflows` (ci.yml) |
| Still no env usage | `ls -a \| grep '^\.env'` and `grep -rn "process.env" src/` (both empty) |
| Live URL / siteUrl | `grep siteUrl src/config/branding.ts` and open https://holeybuckets.netlify.app |
| Fonts still build-time via next/font | `grep -n "next/font" src/app/layout.tsx` |
| localStorage key names | `grep -n "holeybuckets:" src/lib/storage.ts` |
| Artifact filenames | `grep -n "\.pdf\|\.png" src/lib/pdf.ts src/lib/shareImage.ts` |
| Node/Next versions | `node --version`; `grep '"next"' package.json` |
