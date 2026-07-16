---
name: holey-buckets-launch-campaign
description: >-
  The executable, decision-gated launch campaign for Holey Buckets: get The
  Gray Duck live for real guests. Covers the full sequence — preflight
  baseline, real course data intake (worksheet + photos into osceola.ts),
  Milestone 7 email capture + booking CTA, real domain + siteUrl repoint,
  launch QA sweep, and measurable launch criteria. Use when working launch
  readiness, importing the owner's course worksheet, wiring the booking link,
  choosing an email-capture approach, or repointing the domain. Do NOT use for
  general QA protocol (see holey-buckets-validation-and-qa), change
  classification/PR rules (see holey-buckets-change-control), env/build/deploy
  mechanics (see holey-buckets-build-and-run), or post-launch growth
  measurement (see holey-buckets-growth-engine).
---

# Holey Buckets — Launch campaign (The Gray Duck goes live)

**Mission.** As of 2026-07-02 the app is feature-complete for its MVP (Milestones 1–6
shipped) but NOT launched: the flagship course file contains invented placeholder holes,
Milestone 7 (email capture + booking link) is unbuilt, the site lives on
`holeybuckets.netlify.app` with no real domain, and nothing is measured. This skill is
the campaign that closes those gaps. It is founder-confirmed as the hardest live problem.

This is a **decision-gated runbook**: every phase ends with a gate checklist. Do not
start phase N+1 until phase N's gate is fully green. Every code change promotes through
a PR with a "Verified" section — see **holey-buckets-change-control** for what that PR
must contain. Success at every gate is **measurable or checkable** (a command output, a
grep hit count, a rendered value, a dashboard entry) — never "looks fine".

## When to use this skill

- You were asked to "launch", "go live", "get the real course in", "add the booking
  link / email capture", or "set up the domain".
- The owner's course worksheet or real photos have arrived and must go into the app.
- You need to decide HOW to do email capture within the MVP constraints.

## When NOT to use (go to a sibling instead)

| Need | Sibling skill |
|---|---|
| What counts as evidence; the manual QA protocol; the smoke script itself | holey-buckets-validation-and-qa |
| Whether a change is allowed; PR "Verified" discipline; dependency gates | holey-buckets-change-control |
| Env setup, commands, routes, Netlify pipeline details, build traps | holey-buckets-build-and-run |
| Field-by-field config reference (every branding/course field) | holey-buckets-config-catalog |
| Scoring rules / formats / ball billing semantics | bucket-golf-reference |
| Something broke mid-campaign; diagnose it | holey-buckets-debugging-playbook |
| localStorage schema safety while changing types | holey-buckets-round-data-safety |
| Why the architecture is shaped this way; invariants | holey-buckets-architecture-contract |
| Which PR decided what (e.g. the QR decline) | holey-buckets-history-and-decisions |
| Writing the PR body / founder-facing comments | holey-buckets-docs-and-writing |
| Measuring share→visit→booking AFTER launch; analytics options | holey-buckets-growth-engine |

## Terms used below (one-line definitions)

- **Founder-editable**: `src/config/branding.ts` and `src/config/courses/*.ts` must stay
  editable by Erin, a non-developer — heavily commented, plain English, no code knowledge
  needed. A house rule; breaking it fails review.
- **trackBalls**: per-course flag; The Gray Duck charges per ball, so the app tallies
  balls used per player (never affects score).
- **Bucket chip / net strokes**: chip-in bonus and the score math — owned by
  **bucket-golf-reference**; not needed to run this campaign except in Phase 4 QA.
- **Gate**: a checklist that must be 100% green before the next phase starts.
- **Change control**: every behavior-changing edit ships as a small PR with a "Verified"
  section (build passes, 390px render, math spot-checks where relevant).

---

## PHASE 0 — Preflight baseline (touch nothing until all green)

Establish that the machine works TODAY, so any later breakage is attributable to the
campaign, not pre-existing rot.

1. From the repo root, run:
   ```
   npm install && npm run build
   ```
   **Expected**: build succeeds with exactly this 10-route table (verified 2026-07-16):
   ```
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
   ```
   (Sizes may drift a little; the ROUTE LIST must match.)
   - **If the build fails on fonts / network**: Google Fonts are fetched at build time —
     see holey-buckets-build-and-run for the trap. Fix the environment, not the code.
   - **If a route is missing or extra**: someone changed the app since this skill was
     written. STOP; reconcile with holey-buckets-architecture-contract before campaigning.
2. Run the scoring smoke check (owned by holey-buckets-validation-and-qa):
   ```
   node .claude/skills/holey-buckets-validation-and-qa/scripts/scoring-smoke.mjs
   ```
   **Expected**: ends with `ALL CASES PASS`, exit code 0.
   - **If any FAIL**: scoring is broken at baseline. Branch to
     holey-buckets-debugging-playbook; do not proceed.
3. Confirm the deploy pipeline is live: open `https://holeybuckets.netlify.app` in a
   browser (the URL in `branding.siteUrl`).
   **Expected**: the course-agnostic landing renders with the "Find your course"
   button (since 2026-07-16); a course card leads to the course home at
   `/courses/<id>`, which carries "Start a round".
   - **If it 404s or shows a stale build**: check the Netlify dashboard (off-repo) —
     the site deploys on every push to `main` via `netlify.toml`
     (build `npm run build`, publish `.next`, plugin `@netlify/plugin-nextjs`).
     Fix the pipeline before proceeding; holey-buckets-build-and-run owns the details.

**GATE 0** ☐ build passes with the 10-route table ☐ smoke script `ALL CASES PASS`
☐ live site reachable and current. All green → Phase 1.

---

## PHASE 1 — Real course data intake (worksheet → osceola.ts)

`src/config/courses/osceola.ts` currently holds 18 INVENTED placeholder holes (the file's
own header says so). This phase replaces them with the owner's real worksheet data and
real photos.

### 1.1 Field mapping (worksheet column → `Hole` field)

Edit ONLY the `holes` array (and `heroImage` in step 1.3) in
`src/config/courses/osceola.ts`. The `Hole` type (`src/lib/types.ts`) accepts:

| Worksheet column | `Hole` field | Type / rule |
|---|---|---|
| Hole number | `number` | **required**, 1..N in order |
| Hole name | `name` | optional string in quotes |
| Par | `par` | number — the 2026-07 worksheet sets it on every hole (2s, 3s, 4s), so fill it in explicitly |
| Distance (yards, tee→bucket) | `distanceYards` | optional whole number (field renamed from `distancePaces` 2026-07-11) |
| Hazards / watch-outs | `hazards` | optional free text in quotes |
| Difficulty ranking | `difficultyRank` | optional number, **1 = hardest**; drives the course-page pips, reserved for Phase 2 handicaps |
| Where to tee from | `teeLocation` | optional free text (currently not rendered anywhere — safe to fill anyway) |
| Tip for players | `note` | optional free text in quotes |
| Tee photo | `teePhoto` | optional path string — see 1.3 |

Full field semantics live in **holey-buckets-config-catalog**; this table is the
launch-day subset.

### 1.2 Editing rules (keep the file founder-editable — house rule)

1. Do NOT restructure the file: no imports of worksheet parsers, no generated code, no
   loops. One plain object literal per hole, one hole per line where practical, trailing
   commas — exactly the existing shape.
2. KEEP the header comment block (the "How to edit a hole" instructions) — update its
   first paragraph to say the data is now real, and delete the "PLACEHOLDER DATA"
   banner wording. Erin edits this file directly; the comments are her manual.
3. Do not touch `id: "osceola"` (rounds link to courses by id) or `code: "grayduck"`.
4. Leave `trackBalls: true` unless the founder explicitly says billing changed.
5. Verify after editing: `npm run build` (the build type-checks the file) and
   `npx tsc --noEmit` if you want a faster check.

### 1.3 Photo intake (the PR #12 trap)

**Get actual image FILES, not share links.** PR #12 (2026-06-26) failed to commit the
founder's photos because they were shared view-only; branded SVG placeholders were
committed instead. Insist on downloadable files (email attachment, direct upload).

1. Drop real files into `public/courses/grayduck/` (today it contains only `hero.svg`).
   Suggested names: `hero.jpg`, `tee-01.jpg` … `tee-18.jpg`. Web-friendly sizes
   (roughly ≤ 300 KB each; the hero renders as a 176px-tall banner on /course (`h-44`)
   and a 128px banner on the scoring screen (`h-32`), tee thumbs at 64px (`h-16`) —
   huge originals just slow the page). Compression is a judgment call: state
   what you did in the PR.
2. Point `heroImage` at the new file, e.g. `heroImage: "/courses/grayduck/hero.jpg"`.
3. Add `teePhoto: "/courses/grayduck/tee-01.jpg"` per hole. Any hole WITHOUT a
   `teePhoto` silently falls back to `/placeholder-tee.svg` — that is acceptable for
   launch only if the founder agrees; list the gaps in the PR.

### 1.4 Hole-count sanity (what if the real course is not 18 holes?)

The scorecard grid and PDF split at nine: `Scorecard.tsx` uses
`course.holes.slice(0, 9)` (front, "OUT") and `slice(9)` (back, "IN"), and
`pdf.ts scorecardSkeleton()` does the same. Traced behavior (verified in source,
2026-07-02):

- **18 holes**: front/back nines, OUT/IN/TOT — the designed case.
- **9 holes**: `back` is empty. `Scorecard.tsx` has a `back.length > 0` guard, so the
  IN table is simply not rendered; the Totals table still shows an IN column, which
  computes to **0** for every player (it sums over an empty list). The PDF renders
  `Hole, 1..9, OUT, IN, Tot` with the IN column = 0. Functional, not broken — but the
  dead IN=0 column is cosmetically odd. If the real course is 9 holes, flag the IN
  column as a follow-up UI change through change control; do NOT block launch on it.
- **10–17 holes**: front is holes 1–9 ("OUT"), back is the remainder ("IN") — the
  tables render, subtotals reconcile (OUT + IN = TOTAL), labels are just loosely named.
- **Scoring math is count-agnostic**: `playerToPar` only sums holes actually scored,
  and the play screen iterates `course.holes` — no hardcoded 18 anywhere in the flow.

**Action**: confirm the real hole count from the worksheet FIRST. If ≠ 18, write the
expected rendering (above) into the PR so the reviewer isn't surprised.

### 1.5 The placeholder disclaimer (a real code change)

RESOLVED 2026-07-11: the paragraph is now conditional — it renders
"Some tee photos are placeholders…" only while any hole lacks a `teePhoto`,
and disappears by itself once every hole has a real photo (holes 17–18 are
the remaining gaps). No further edit needed when the last photos land.

**GATE 1**
☐ `npm run build` passes with the new data
☐ smoke script still `ALL CASES PASS`
☐ `/course` at 390px viewport renders REAL names/distances/hazards and the real hero
photo (check 3 specific holes against the worksheet, cite them in the PR)
☐ `grep -n "until the real course data" src/app/course/page.tsx` returns **nothing**
(disclaimer gone)
☐ founder confirms the data matches her worksheet (she is the source of truth)
☐ **Promote via a PR with a Verified section (change control).**

---

## PHASE 2 — Milestone 7: email capture + booking link

Roadmap M7 is "email capture + booking link + brand polish". Two independent pieces.

### 2.1 Email capture — the solution menu, RANKED (choose ONE, with the founder)

MVP constraint (deliberate, from the README/architecture): **no backend, no database,
no accounts**. Rank options by how little they disturb that:

| Rank | Option | Obligations / verdict |
|---|---|---|
| (a) | **Netlify Forms** | No new dependency, no backend — best fit for MVP constraints. **Known caveat (unvalidated in this repo)**: Netlify's form detection scans static HTML at deploy time, and this app renders through the `@netlify/plugin-nextjs` runtime, so a form written only in JSX may not be detected; a hidden static HTML form (e.g. in `public/`) plus a matching `form-name` field is the commonly documented workaround. **Must prove on a deploy preview: a test submission appears in the Netlify dashboard (Forms tab)** before merging. That dashboard entry IS the gate — not "the form renders". |
| (b) | **mailto: / booking-link only** | Zero build. "Get updates" → `mailto:` to the founder's inbox, plus the booking CTA. No submission storage, no dashboard, worst UX on some devices — but shippable in an hour and honest. Acceptable launch fallback if (a) can't be proven in time. |
| (c) | **Third-party form embed** (Formspree/Tally/Google Form etc.) | New EXTERNAL dependency (a script or iframe + a vendor account) — a dependency-policy gate per holey-buckets-change-control. Only if (a) fails validation AND (b) is rejected. Founder must own the vendor account. |
| (d) | **Tiny backend / serverless DB** | **FENCED OFF.** Violates the MVP no-backend constraint. Revisit only in Phase 2 of the roadmap (the storage.ts swap era), through change control. Do not build this for launch. |

Whatever is chosen, the email capture UI belongs where users finish happy: the results
page (its own comment says Milestone 7 "slot[s] in below later") and/or the landing
footer. Keep tap targets ≥ 56px (`.tap-target`) and the design guardrails (sunshine
pairs with ink text; see holey-buckets-change-control).

### 2.2 Booking CTA — wire `brand.bookingCta` into the UI

`branding.ts` defines `bookingCta: { label: "Book your round", url: "https://helloagainproperties.com" }`
(URL is a marked PLACEHOLDER). As of 2026-07-02 it is rendered **NOWHERE** — verify:

```
grep -rn "bookingCta" src/
```
**Expected today**: exactly one hit, `src/config/branding.ts`. **If you see hits in
`src/app/` or `src/components/`**: someone already wired it — audit those renders
against this phase's gate instead of adding another.

Steps:
1. Ask the founder what the real booking channel is (booking page, contact email,
   Instagram DM link) and repoint `bookingCta.url` — a one-line founder-editable change.
2. Render the CTA as a prominent link/button using `brand.bookingCta.label` +
   `brand.bookingCta.url` on the **results page** (below the standings/PDF area) and
   optionally the **landing footer**. Never hardcode the label or URL in the component —
   the whole point is that repointing stays a one-line branding.ts edit.

**GATE 2**
☐ email-capture option chosen WITH the founder and recorded in the PR body
☐ if (a): a test submission visibly arrives in the Netlify Forms dashboard from a
deploy preview (screenshot in the PR); if (b): the mailto opens a draft to the right
address on a real phone; if (c): a test submission arrives in the vendor dashboard
☐ `grep -rn "bookingCta" src/` now shows branding.ts PLUS the rendering component(s)
☐ tapping the CTA on a real phone opens the real booking channel
☐ `npm run build` passes; 390px render checked
☐ **Promote via a PR with a Verified section (change control).**

---

## PHASE 3 — Real domain + share loop repoint

The share card is the acquisition channel: `shareImage.ts` draws `brand.siteUrl` in
bucketBlue at the card's footer (canvas text — it shows whatever the config says, no
DNS involved). Three steps, in order:

1. **Pick + attach the domain (off-repo checklist)**: founder buys/chooses the domain →
   Netlify dashboard → Domain settings → add custom domain → follow Netlify's DNS
   instructions → wait for the certificate. Done when `https://<realdomain>` serves the
   app. Nothing in the repo changes for this step.
2. **Repoint `siteUrl`** in `src/config/branding.ts` (one line; shown WITHOUT
   `https://` — match the existing style, e.g. `siteUrl: "holeybuckets.gg"`).
3. **Verify the share loop**: play a short throwaway round → results page → the share
   card preview. **Expected**: the card footer shows the NEW domain. Then type that
   exact URL into a phone browser — **expected**: the app loads. (The card is
   regenerated per round from live config; there is no cached image to bust.)

**GATE 3** ☐ real domain serves the app over HTTPS ☐ `grep -n "siteUrl" src/config/branding.ts`
shows the new domain ☐ a freshly generated share card carries the new URL ☐ open
`holeybuckets.netlify.app` in a browser and confirm it still redirects or serves —
do NOT assume Netlify's default behavior; if it dead-ends, old shared cards point
nowhere ☐ **Promote via a PR with a Verified section (change control).**

---

## PHASE 4 — Launch QA sweep (real device, real round)

Run the FULL protocol from **holey-buckets-validation-and-qa** (build, 390px renders,
scoring reconciliation, PDF + share-card checks) — that skill owns the details. Then,
on top of it, walk one REAL round end-to-end **on a phone against the production
deploy** (PR #14's lesson: the tie bug shipped past desktop review and was caught only
by a human playing a real round):

1. `/start`: group name + ≥2 players → Start. **Expected**: lands on hole 1, every
   player pre-seeded to par, leaderboard reads "E".
2. Score all holes (all of them — 18 or whatever Phase 1 established), using at least
   one chip-in, one multi-penalty hole, and the balls stepper (trackBalls is on).
3. **Engineer a deliberate 2-way tie** across the round. **Expected** on results:
   "It's a tie!" hero with joined names; share card says "TIE". Never skip this case.
4. Results: share card renders with no text collisions (5-player board), Share opens
   the native sheet, PDF downloads and opens with correct header/par row/totals/date,
   OUT + IN = TOTAL reconciles against the on-screen scorecard.
5. Email capture + booking CTA (Phase 2 artifacts) both work from the phone.
6. Confirm the production deploy on the real domain is the build you tested
   (Netlify dashboard: latest deploy = latest `main` commit).

**GATE 4** ☐ full validation-and-qa protocol green ☐ real phone round completed
including the tie case ☐ production deploy hash matches `main` ☐ founder has done her
own device pass (house rule for feature-level changes). All green → launch.

---

## PHASE 5 — Launch + measurement hooks

"Launched" here is a measurable state, not an announcement. All four must be true:

| # | Launch criterion | How to check |
|---|---|---|
| 1 | Real course data live | `/course` on the real domain shows worksheet holes + real photos; no placeholder disclaimer |
| 2 | Email capture receiving | A real (non-test) submission has arrived in the chosen channel's inbox/dashboard |
| 3 | Booking clicks possible | The rendered CTA opens the founder's real booking channel from a phone |
| 4 | Share loop carries the real domain | A share card generated post-launch shows the real URL, and that URL serves the app |

When all four hold, the campaign is done — declare it in a final summary to the founder
listing the four criteria with evidence.

**Measurement beyond this point is not this skill's job.** As of 2026-07-02 the app has
NO analytics of any kind (verified by grep); counting share-card visits and booking
clicks — and the instrumentation options with their dependency gates — is owned by
**holey-buckets-growth-engine**. Do not bolt analytics on during launch week.

---

## Fenced-off wrong paths (do not go here)

| Wrong path | Why it's fenced |
|---|---|
| Backend/database/serverless store for email capture | Violates the deliberate MVP no-backend constraint; Phase 2 territory (storage.ts swap), change-control gated |
| Adding a QR-code library (e.g. for the share card or course join) | Declined in PR #11 (2026-06-26) — text URL instead, no new dep. Revisit only via change control |
| Restructuring osceola.ts while importing the worksheet (parsers, generators, JSON imports) | Breaks founder-editability, a house rule; the file must stay a hand-editable commented literal |
| Skipping the deliberate-tie QA case | PR #14 (2026-06-26): the tie bug shipped and was caught only in a real round on a real phone |
| Judging any gate "by eye" without the listed check | Every gate above has a command/observable; "looks fine" is not evidence in this repo |
| Merging anything without a Verified PR section | House rule; holey-buckets-change-control owns the format |

## Provenance and maintenance

Derived 2026-07-02 (repo commit aa4c527) by the retiring principal engineer from direct
source inspection (`branding.ts`, `courses/osceola.ts`, `types.ts`, `Scorecard.tsx`,
`pdf.ts`, `shareImage.ts`, `course/page.tsx`, results/landing pages, `netlify.toml`),
a passing `npm run build` and scoring-smoke run in this environment, and the PR #1–#15
history plus founder-confirmed priorities. The Netlify Forms detection caveat in Phase
2 is general Netlify/Next.js knowledge, NOT validated in this repo — that is exactly
why its gate demands proof on a deploy preview.

Re-verify before relying on volatile facts:

| Fact | One-line check |
|---|---|
| Route table still 10 routes | `npm run build` (compare table in Phase 0) |
| Scoring engine healthy | `node .claude/skills/holey-buckets-validation-and-qa/scripts/scoring-smoke.mjs` |
| osceola.ts still placeholder (Phase 1 not done) | `grep -n "PLACEHOLDER" src/config/courses/osceola.ts` |
| Disclaimer still hardcoded | `grep -n "until the real course data" src/app/course/page.tsx` |
| bookingCta still unrendered (Phase 2 not done) | `grep -rn "bookingCta" src/` — one hit = not wired |
| siteUrl current value | `grep -n "siteUrl" src/config/branding.ts` |
| Share card draws siteUrl | `grep -n "siteUrl" src/lib/shareImage.ts` |
| Scorecard nine-split + guard | `grep -n "slice(0, 9)\|back.length" src/components/Scorecard.tsx src/lib/pdf.ts` |
| Photo assets present | `ls public/courses/grayduck/` |
| No analytics yet | `grep -rin "analytics\|gtag\|plausible\|posthog" src/` — expect no hits |
| Deploy pipeline config | `cat netlify.toml` |
| Live site | open `https://holeybuckets.netlify.app` (or the real domain after Phase 3) |
