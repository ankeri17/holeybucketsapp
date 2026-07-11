---
name: holey-buckets-architecture-contract
description: >-
  The load-bearing design decisions of the Holey Buckets app, why they exist,
  the invariants that must hold, and the known weak points. Use when designing
  or reviewing ANY change to this repo, when deciding where new code should
  live, when tempted to hardcode a course/color/rule, or when asking "why is it
  built this way?". Do NOT use for: the change/PR approval process (see
  holey-buckets-change-control), localStorage schema-change mechanics (see
  holey-buckets-round-data-safety), config field-by-field reference (see
  holey-buckets-config-catalog), build/run commands (see
  holey-buckets-build-and-run), or bucket golf rule details (see
  bucket-golf-reference).
---

# Holey Buckets — Architecture Contract

The design decisions this app stands on, stated as invariants. Violating any
numbered invariant below is an architecture regression even if the build passes
and the screen looks right. There are NO automated tests — these invariants are
enforced only by review, so you must know them before writing code.

Repo root: the project this skill ships in (Next.js 14 App Router, TypeScript,
Tailwind; ~24 source files under `src/`). All paths below are repo-relative.

## When to use this skill

- Before adding a feature, component, page, or dependency — to know where it goes.
- When reviewing a diff for architectural violations (hardcoded course data,
  duplicated rule math, hex colors outside branding, direct localStorage calls).
- When you need the WHY behind a decision (auto-seed-to-par, pinned Next, no QR).
- When assessing risk: section "Known weak points" is the honest gap list.

## When NOT to use (siblings own these)

| Question | Go to |
|---|---|
| How do I get a change approved / what must a PR body contain? | `holey-buckets-change-control` |
| How do I change the Round/HoleScore shape without losing live rounds? | `holey-buckets-round-data-safety` |
| What does each branding/course/format field mean; how to add a course? | `holey-buckets-config-catalog` |
| How do I build, run, deploy; what breaks builds? | `holey-buckets-build-and-run` |
| What are the exact scoring rules and worked cases? | `bucket-golf-reference` |
| Why did PR #N do X; full decision history? | `holey-buckets-history-and-decisions` |
| How do I verify a change works? | `holey-buckets-validation-and-qa` |

## Glossary (terms used below)

- **Course**: a data object (`Course` in `src/lib/types.ts`) — name, location,
  holes. Never a component, never hardcoded UI.
- **Bucket chip**: chipping the ball INTO the bucket; −1 stroke bonus (binary per hole).
- **Net strokes**: `max(0, strokes − (bucketChip ? 1 : 0) + penalties)` — the
  score everything displays. Owned by `src/lib/scoring.ts`.
- **trackBalls**: per-course flag; venue tallies balls used/lost for per-ball
  billing. Never affects score.
- **Founder-editable**: `src/config/branding.ts` and `src/config/courses/*.ts`
  are edited directly by the non-developer owner; they stay heavily commented
  and plain-English.
- **Phase 2**: the future backend era (saved rounds, accounts, owner-created
  courses, more formats). Nothing Phase 2 is built yet — the MVP has no
  backend, no database, no accounts.

---

## Invariant 1 — A course is data, never hardcoded (PR #2, 2026-06-26)

"The single most important architectural requirement" per the repo's own
comments (`src/lib/types.ts` header). Operationally:

- Every component and page that touches course info takes a `Course` object (or
  a `courseId` it resolves via the registry). None may import `osceola` directly.
- Course data lives in `src/config/courses/<id>.ts`. The registry is
  `src/config/courses/index.ts`, exporting exactly: `courses: Course[]`,
  `defaultCourse` (currently `osceola`), and `getCourse(id)` (returns
  `undefined` on no match). Adding a course = new file + one array entry.
- The scoring screen resolves its course with `getCourse(round.courseId)`;
  `/start` uses `defaultCourse` (a known gap — see weak points).

**Violations to reject on sight:** importing `osceola` anywhere outside the
registry; a component with "Gray Duck"/"Osceola" or hole names in JSX; par,
hole counts, or hazards written as literals instead of read from `Course`;
assuming 18 holes (use `course.holes.length`).

Why: the MVP ships one course, but Phase 2 is owner-created courses on many
properties. The same code paths must already work for any `Course`.

## Invariant 2 — Two single-source-of-truth chains ("they can't disagree")

### 2a. Branding: `src/config/branding.ts` re-skins everything (PRs #1, #6)

One file exports `brand` (`as const`): name, tagline, umbrella credit,
`siteUrl`, `colors` (primary/fairway `#1E9B4E`, deepPine, sunshine, bucketBlue,
cream, card, ink, stone, line, penalty clay `#E0682E`), `bookingCta`. Consumers:

| Consumer | How it reads branding |
|---|---|
| `tailwind.config.ts` | `colors: { brand: brand.colors }` → classes like `bg-brand-primary`, `text-brand-stone` |
| `src/app/layout.tsx` | publishes CSS custom properties (`--fairway-green`, `--penalty-clay`, ...) on `<html>`; also metadata title and `themeColor` |
| `src/lib/shareImage.ts` | canvas share card draws with `brand.colors.*`, `brand.name`, `brand.umbrellaCredit`, `brand.siteUrl` |
| `src/lib/pdf.ts` | PDF header band, table colors via `hexToRgb(brand.colors.*)` |

Rule: a color/name change is one edit in `branding.ts`; screen, share card, and
PDF all follow. **Never write a brand hex literal anywhere else** — that is
exactly the drift this chain exists to prevent. (`tailwind.config.ts` says it
itself: "Change colors there, not here.")

### 2b. Rule math: `src/lib/scoring.ts` (PRs #4, #10, #13)

Every surface that shows a score reads the same helpers: `netStrokes`,
`getHoleScore`, `holesScored`, `playerTotal`, `playerToPar` (computed ONLY over
holes actually scored — never assumes 18; a founder P1 fix, PR #6),
`standings()` (lowest total first, ties share a rank), `playerBalls`/
`totalBalls` (never affect score), `winners()` (all rows tying the best total;
`length > 1` = tie, the PR #14 tie-bug fix), `joinNames`, `formatToPar`.

Verified consumers: scoring screen + live leaderboard
(`src/app/play/[roundId]/page.tsx`), results page, `src/components/Scorecard.tsx`,
`src/lib/shareImage.ts`, `src/lib/pdf.ts`.

**Violation:** any arithmetic on `strokes`/`bucketChip`/`penalties` outside
`scoring.ts` (helpers in `src/lib/course.ts` — `holePar`, `coursePar` — are the
one sanctioned adjunct). If a new surface needs a number scoring.ts can't
produce, add a helper there; do not inline the math.

## Invariant 3 — `src/lib/storage.ts` is the only module that knows persistence

The MVP is deliberately backend-free: a round lives entirely in the phone's
`localStorage`. Phase 2 adds a hosted backend **by replacing this one module
only** — the module's own header comment states this. The contract any
replacement must honor:

| Function | Contract |
|---|---|
| `saveRound(round: Round): void` | persist by id (key `holeybuckets:round:<id>`, JSON); no-op outside the browser |
| `loadRound(id: string): Round \| null` | `null` if missing OR unparseable — callers never see a throw |
| `setActiveRoundId(id: string): void` | remember the in-progress round (key `holeybuckets:activeRoundId`) |
| `getActiveRoundId(): string \| null` | `null` if none |

Callers (start page, scoring screen) treat `null` as "round not on this
device" and render a fallback with a link to `/start` — never a crash.

**Violations:** `window.localStorage` touched anywhere outside `storage.ts`;
callers assuming `loadRound` throws; a second persistence path. Widening the
contract (e.g. async) is a Phase 2 design decision — route it through
`holey-buckets-change-control`. Schema changes to what's stored:
`holey-buckets-round-data-safety`.

## Invariant 4 — Client/static split and the SSR guard

Verified against the build manifests (as of 2026-07-02, 6 routes):

| Route | Rendering | Why |
|---|---|---|
| `/` (landing) | Static, server component | No state, no storage |
| `/course` | Static, server component | Rendered straight from course config at build time |
| `/start` | Prerendered shell + `"use client"` page | Form state + writes to localStorage on submit |
| `/play/[roundId]` | Dynamic, `"use client"` | Round exists ONLY in the phone's localStorage — the server can never render it |
| `/play/[roundId]/results` | Dynamic, `"use client"` | Same, plus canvas share image and PDF (browser APIs) |

`"use client"` appears in exactly 4 files: the start page, the two play pages,
and `src/components/PrintBlankButton.tsx` (click → PDF download). Keep it that
way: mark a file `"use client"` only when it needs state, effects, or browser
APIs; everything else stays a server component so `/` and `/course` remain
static.

The SSR guard pattern: `storage.ts` gates every function on a private
`hasStorage()` (`typeof window !== "undefined" && !!window.localStorage`), so
storage calls are safe to import from anywhere without crashing prerendering.
Client pages additionally load rounds inside `useEffect` (never during render)
and show "Loading round…" until loaded, then a "couldn't find that round on
this device" fallback if `loadRound` returned `null`.

Related build fact (owned by `holey-buckets-build-and-run`): fonts load via
`next/font/google` at build time, and jsPDF is imported dynamically on click
only — do not convert either to a static/runtime pattern casually.

## Invariant 5 — Data-model invariants (`src/lib/types.ts`)

1. **Scores key off player `id`, never name.** `createRound`
   (`src/lib/round.ts`) gives each player a stable `newId()`; two players named
   "Mike" are fine. `Round.scores: Record<playerId, Record<holeNumber, HoleScore>>`.
2. **A missing scores entry means "hole not scored yet"** — not zero. All
   totals/to-par iterate only over existing entries (see Invariant 2b).
3. **Balls are out of the score.** `Round.balls` is a per-player round-level
   tally for per-ball billing, gated by `course.trackBalls`, NOT coupled to
   penalties (PR #9). Nothing in scoring may read it except the two
   ball-counting helpers.
4. **`format` is a real field from day one.** `ScoringFormat` union has 7
   members; only `strokePlay` is implemented. `src/lib/formats.ts` gates the UI
   with `available` booleans (only strokePlay `true`). Note:
   `teamAlternateShot` is in the type union but absent from the `FORMATS`
   list — type-only, deliberate.
5. **Optional fields were scaffolded early on purpose** (PR #8: "cheap now,
   painful to retrofit"): `Course.code` (course-code/QR join later),
   `isPublic`, `trackBalls`, `heroImage`; `Hole.teePhoto`, `difficultyRank`
   (1 = hardest; reserved for Phase 2 handicaps, today only drives the course
   page difficulty pips). Follow this precedent: when a Phase 2 feature needs a
   data field, add it as optional NOW rather than retrofitting — but adding
   fields still goes through change control.
6. `DEFAULT_PAR = 3`; a hole may override via `par` (`holePar` in
   `src/lib/course.ts` resolves it). Only `Hole.number` is required.

## Invariant 6 — Auto-seed-to-par on the scoring screen (PR #4, deliberate)

Where: the second `useEffect` in `src/app/play/[roundId]/page.tsx` (comment:
"Landing on a hole means it's in play"). On every hole change, any player with
no `HoleScore` for the current hole gets `{ strokes: holePar(hole) }` written
and immediately `saveRound`ed.

Consequences you must not "fix" as bugs:

- The leaderboard starts at "E" the moment hole 1 renders — everyone is seeded
  to par.
- Visiting a hole makes it count toward totals and to-par even if nobody
  touches a stepper. Skipping past holes with Next seeds them too.
- Holes never visited stay unscored ("–" on the scorecard) and are excluded
  from to-par.

Why: on a casual backyard round most players make par; seeding means the group
only records deviations (chip-ins, penalties, extra strokes) instead of
entering every score. Changing this behavior changes what a saved round means —
it is a change-control matter, not a refactor.

## Known weak points (state of 2026-07-02 — plainly)

These are accepted gaps, not undiscovered bugs. Do not paper over them
silently, and do not "fix" them without going through
`holey-buckets-change-control`.

| # | Weak point | Detail |
|---|---|---|
| 1 | Thin automated coverage (UPDATED 2026-07-08) | Since 2026-07-03 (commit 8b9f680) there IS a vitest unit suite (`npm test`) and a GitHub Actions CI (typecheck/lint/test/build). But nothing rendered is covered — screens, PDFs, share card remain manual QA (see `holey-buckets-validation-and-qa`). Ties shipped broken until real-device play (PR #14). |
| 2 | No analytics/telemetry/error boundary | Nothing measured, verified by grep. The share→visit→booking growth loop is unmeasured (see `holey-buckets-growth-engine`). |
| 3 | Single-device rounds | localStorage only: a round is unrecoverable from another phone, after browser-data clear, or in a different browser. Phase 2 (Invariant 3) is the fix. |
| 4 | No course-selection UI | `/start` imports `defaultCourse` directly; a second course in the registry would be unreachable from the UI. |
| 5 | `bookingCta` configured but unused | Defined in `branding.ts` (URL is itself a placeholder), rendered nowhere — reserved for Milestone 7. |
| 6 | Placeholder hole data | `src/config/courses/osceola.ts` says so at the top: hole names/distances/hazards are invented pending the owner's worksheet. Hero/tee images are branded SVG placeholders (PR #12). |
| 7 | Pinned Next 14.2.35 | Deliberate (PR #1): known DoS-class advisories fixed only in newer majors were accepted as low-risk for a backend-less MVP. Do not bump majors casually; do not re-report the advisories as news. |
| 8 | `teamAlternateShot` type-only | In the `ScoringFormat` union but not in `FORMATS`, so it never appears in the picker. Harmless; intentional. |

---

## Provenance and maintenance

Derived 2026-07-02 (repo commit `aa4c527`) from direct source inspection of
every file cited above plus the GitHub PR history (#1–#15) and the retiring
engineer's handoff notes. Every path, function name, key, and route above was
re-verified against the working tree on that date. PR citations are durable on
the GitHub repo.

Re-verify before relying on volatile facts:

| Claim | Command | Expect |
|---|---|---|
| Registry exports | `grep -n "export" src/config/courses/index.ts` | `courses`, `defaultCourse`, `getCourse` |
| No course hardcoding | `grep -rn "osceola" src --include='*.ts*' \| grep -v config/courses` | only one doc-comment example in types.ts; no imports |
| Branding consumers | `grep -rln "config/branding" src tailwind.config.ts` | layout.tsx, shareImage.ts, pdf.ts, tailwind.config.ts, page.tsx, icons.tsx |
| No stray brand hexes | `grep -rn "#1E9B4E\|#E0682E" src \| grep -v branding.ts` | no hits |
| Rule math stays home | `grep -rn "bucketChip" src \| grep -v "scoring.ts\|types.ts"` | only prop passing / toggles, no arithmetic |
| Storage is the only persistence | `grep -rn "localStorage" src \| grep -v lib/storage.ts` | no hits |
| Storage contract | `grep -n "export function" src/lib/storage.ts` | saveRound, loadRound, setActiveRoundId, getActiveRoundId |
| Client-component set | `grep -rln '"use client"' src` | 4 files (start, play, results, PrintBlankButton) |
| Route split | `npm run build` | `/` `/course` `/start` static; `/play/[roundId]`(+`/results`) dynamic |
| Auto-seed still present | `grep -n "in play" 'src/app/play/[roundId]/page.tsx'` | the seeding useEffect comment |
| Format availability | `grep -n "available: true" src/lib/formats.ts` | strokePlay only |
| bookingCta still unused | `grep -rn "bookingCta" src \| grep -v branding.ts` | no hits (until Milestone 7 lands) |
| Next still pinned | `grep -n '"next"' package.json` | `"next": "14.2.35"` (exact, no caret) |
| Tests + CI present (since 2026-07-03) | `ls .github/workflows; grep -in '"test"' package.json` | ci.yml; a vitest test script |
