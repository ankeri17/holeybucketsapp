---
name: holey-buckets-validation-and-qa
description: >-
  The verification protocol for the Holey Buckets app: what counts as evidence,
  the manual QA runbook (build, 390px render, scoring reconciliation, tie test,
  PDF and share-card checks), and the scoring-smoke.mjs script that asserts the
  canonical scoring cases. Use whenever validating a change before merge,
  writing the "Verified" section of a PR, or checking that scoring math still
  reconciles — and ALWAYS when touching src/lib/scoring.ts, course.ts, or
  types.ts. Do NOT use for whether a change is allowed at all, its gate, or PR
  discipline (see holey-buckets-change-control), for diagnosing a specific
  failure (see holey-buckets-debugging-playbook), for the scoring RULES
  themselves (see bucket-golf-reference), or for localStorage inspection
  snippets (see holey-buckets-round-data-safety).
---

# Holey Buckets — Validation & QA runbook

Since 2026-07-03 (commit 8b9f680) the repo has a **vitest unit suite** (`npm test`,
`src/**/*.test.ts`) and **GitHub Actions CI** (`.github/workflows/ci.yml`: typecheck,
lint, test, build on every PR and push to `main`). Those cover the pure lib logic —
everything RENDERED (screens, PDFs, share card, real-device behavior) is still
covered only by the manual protocol in this skill. Repo root: the directory
containing `package.json` with `"name": "holey-buckets-app"`.

## When to use this skill

- Before merging ANY change: what to run, what to look at, what "verified" means.
- Writing the "Verified" section of a PR body (the house rule: every PR proves itself).
- Any change touching `src/lib/scoring.ts`, `src/lib/course.ts`, or `src/lib/types.ts`.
- Checking scorecard/leaderboard/share-card/PDF consistency after a UI change.

## When NOT to use (go to a sibling instead)

| Need | Sibling skill |
|---|---|
| Something is broken; diagnose it | holey-buckets-debugging-playbook |
| The scoring rules / formats / ball-billing semantics themselves | bucket-golf-reference |
| Browser-console localStorage inspection & round-rescue snippets | holey-buckets-round-data-safety |
| Whether a change is allowed at all; PR discipline; dependency policy | holey-buckets-change-control |
| Env setup, dev server, deploy pipeline, build traps | holey-buckets-build-and-run |
| Why the architecture is shaped this way | holey-buckets-architecture-contract |

## Glossary (terms used below)

- **Net strokes**: a hole's real score = raw strokes − 1 if *bucket chip* + 1 per penalty, floored at 0. Computed only in `src/lib/scoring.ts` (`netStrokes`).
- **Bucket chip**: chipping the ball INTO the bucket — a binary −1 bonus per hole.
- **Penalties**: a COUNT per hole (+1 each: foliage/water/OB/lost ball), not a flag.
- **trackBalls**: course-level flag; shows a balls-used tally (per-ball billing). Never affects score.
- **Founder / Erin**: the non-developer owner. She device-tests on her phone at ~390px width — hence the 390px rule.
- **Auto-seed**: landing on a hole seeds every player's score to par for that hole (PR #4 decision), so the leaderboard starts at "E".

---

## 1. The evidence bar: verified means OBSERVED, not believed

A change is "verified" only when you have **looked at the actual output** — a rendered
screen, a generated PDF opened, numbers reconciled by hand or by script. "The code looks
right", "TypeScript compiles", or "the helper is shared so it must agree" are NOT
evidence. History: PR #14 (2026-06-26) — a tie showed "Erin wins!" when Erin & Laura were
both 54·E. Desktop code review missed it; the founder's real phone caught it. Edge cases
ship until someone observes them.

**Minimum bar for EVERY change, no exceptions:** `npm run build` passes (it includes
ESLint + the TypeScript type check — you'll see a "Linting and checking validity of
types" phase) AND `npm test` passes (vitest, since 2026-07-03). **Additionally
mandatory** for anything touching
`src/lib/scoring.ts`, `src/lib/course.ts`, or `src/lib/types.ts`: run
`scripts/scoring-smoke.mjs` (section 3) and see `ALL CASES PASS`.

Expected tail of a good build (as of 2026-07-16 — 10 routes; ○ static, ● SSG,
ƒ dynamic):

```
Route (app)                              Size     First Load JS
┌ ○ /                                    ...
├ ○ /_not-found                          ...
├ ƒ /admin/[key]                         ...
├ ○ /course                              ...
├ ● /courses/[courseId]                  ...
├   └ /courses/osceola
├ ○ /how-to-play                         ...
├ ○ /icon.svg                            ...
├ ƒ /play/[roundId]                      ...
├ ƒ /play/[roundId]/results              ...
└ ○ /start                               ...
```

If a route disappears from this list or flips static↔dynamic unexpectedly, that is a
finding, not noise.

## 2. The verification runbook (run top to bottom; skip steps only per the table in §2.1)

1. **Build + tests.** From repo root: `npm run build` (must exit 0 with the 10-route
   table above) and `npm test` (all vitest suites pass).
   Trap: the build fetches Google Fonts at build time — a no-network build fails for
   reasons unrelated to your change (see holey-buckets-build-and-run).
2. **Scoring smoke** (if `src/lib/scoring.ts|course.ts|types.ts` touched):
   `node .claude/skills/holey-buckets-validation-and-qa/scripts/scoring-smoke.mjs`
   → must print `ALL CASES PASS` (section 3).
3. **Render at 390px** and LOOK at every touched screen (section 6): `npm run dev`,
   open http://localhost:3000, DevTools device toolbar at 390px width.
4. **Reconcile a scorecard** (if scoring math or the scorecard/leaderboard/results UI
   touched): play a quick round and check OUT + IN = TOTAL and to-par vs played holes
   (section 4).
5. **Tie test** (if ties, standings, winners, results hero, or share card touched):
   produce a deliberate 2-way tie and check every surface (section 5).
6. **PDFs** (if `src/lib/pdf.ts`, Scorecard, or course data touched): actually generate
   and open BOTH cards (section 7).
7. **Share card** (if `src/lib/shareImage.ts`, standings, or branding touched): render
   with a full 5-player board; look for text collisions (section 7).
8. **Founder device pass**: for feature PRs, the founder plays it on her real phone
   before/at merge. You cannot substitute for this step — flag the PR as awaiting it.
9. **Write it down.** The PR body gets a "Verified" section listing what you observed
   (renders described/screenshotted, build output, reconciled numbers) — claims without
   observations don't count. Template and history: holey-buckets-change-control.

### 2.1 Which steps per change class

| Change touches | Required steps |
|---|---|
| Anything at all | 1 |
| `src/lib/scoring.ts`, `course.ts`, `types.ts` | 1, 2, 3, 4, 5 |
| Scoring screen / leaderboard / results / Scorecard.tsx | 1, 3, 4, 5 |
| `src/lib/pdf.ts` | 1, 3, 6 |
| `src/lib/shareImage.ts` | 1, 3, 5, 7 |
| `src/config/branding.ts` | 1, 3, 6, 7 (brand feeds PDFs + share card too) |
| `src/config/courses/*` | 1, 3, 6, 7 (par row, hole count, names flow into the PDFs; the share card draws `course.name · location`) |
| `src/lib/storage.ts` / Round shape | 1, 3, 4 + holey-buckets-round-data-safety migration checklist |
| `src/config/sponsors/*`, `src/lib/sponsors.ts`, `src/components/sponsors/*` | 1, 3 (home + a sponsored hole + results), 6 (sponsor footnote + sponsors strip print on both cards) |
| Copy/styling only | 1, 3 |
| Feature PR of any kind | all applicable + 8, 9 |

## 3. scoring-smoke.mjs — the executable scoring check

Ships in this skill at `scripts/scoring-smoke.mjs`. It compiles
`src/lib/{types,course,scoring}.ts` with the repo's **own** devDependency compiler
(`node_modules/.bin/tsc`, `--module commonjs` into a temp dir), requires the result, and
asserts the canonical cases. No new dependencies; needs `npm install` to have been run.

```bash
# From the repo root:
node .claude/skills/holey-buckets-validation-and-qa/scripts/scoring-smoke.mjs
```

Expected output (verified passing 2026-07-02 at commit aa4c527; exit code 0):

```
Compiling src/lib/types.ts, src/lib/course.ts, src/lib/scoring.ts with the repo's tsc ...
PASS  netStrokes: par-3 plain (3 strokes) = 3
PASS  netStrokes: chip-in on 2nd throw (2 strokes, chip) = 1
PASS  netStrokes: 3 strokes + 1 penalty = 4
PASS  netStrokes: chip + penalty cancel (3 strokes) = 3
PASS  netStrokes: first-throw chip-in floors at 0 (never negative)
PASS  netStrokes: penalties are a COUNT (2 strokes + 3 penalties = 5)
PASS  netStrokes: unscored hole (undefined) = 0
PASS  playerToPar: 2 played holes (nets 2,3) = -1, not -49-over-18-holes
PASS  playerTotal: same round totals 5
PASS  reconcile: OUT (front nine) = 25
PASS  reconcile: IN (back nine) = 27
PASS  reconcile: OUT + IN = playerTotal = 52
PASS  reconcile: to-par over 18 played holes = -2 (course par 54)
PASS  reconcile: formatToPar(-2) renders '-2'
PASS  standings: sorted lowest total first
PASS  standings: tied players SHARE a rank; next rank skips (1,1,3)
PASS  winners: length 2 on a 2-way tie
PASS  winners: tie detected via length > 1
PASS  joinNames: two names -> 'Erin & Laura'
PASS  joinNames: three names -> 'Erin, Laura & Sam'
PASS  formatToPar: 0 -> 'E'
PASS  formatToPar: 3 -> '+3'
PASS  formatToPar: -1 -> '-1'

ALL CASES PASS
```

Any `FAIL` line → exit code 1. A FAIL after your change means you changed rule math:
either revert, or take it through holey-buckets-change-control as an explicit rules
change AND update the script's expectations in the same PR.

**What the cases are:** the canonical scoring table lives in **bucket-golf-reference**
(one home per fact — the rules and worked cases are owned there, from PR #4). This skill
owns their EXECUTION: the script above is the automated check, and when you change any
scoring behavior you additionally hand-check the same cases live on the scoring screen
(tap them in, read the big "hole score" number and the math line, e.g.
"3 strokes + 1 penalty = 4").

## 4. Reconciliation discipline (OUT + IN = TOTAL, to-par vs played holes)

The screen leaderboard, the `<Scorecard>` grid, the share card, and the PDF all read the
same helpers in `src/lib/scoring.ts` — but they SUM independently per surface, so the
check is: do the displayed numbers reconcile?

Checks, in order:

1. **OUT + IN = TOTAL** on the results Scorecard grid, for every player. OUT = sum of
   front-nine net scores, IN = back nine, TOTAL comes from `playerTotal`.
2. **To-par is over PLAYED holes only** — never assumes 18 (an explicit P1 founder
   demand, PR #6). A player at total 5 after 2 par-3 holes shows **−1**, not −49.
   Unscored holes render "–" (stone gray) in the grid and contribute 0 to OUT/IN.
   Note the auto-seed: any hole you have *visited* is scored at par for everyone.
3. **Leaderboard order matches totals**: lowest total first; each row's to-par string
   (`E`, `+3`, `-1`) must be consistent with its total minus the par of its played holes.
4. **Cross-surface agreement**: the same player's TOTAL must be identical on the live
   leaderboard, final standings, Scorecard grid, share card, and PDF.

**Worked example (the precedent):** PR #10 (2026-06-26) verified the new Scorecard grid
by hand-reconciling Erin's card: **OUT 25 + IN 27 = 52 TOTAL, to-par −2** (course par 54,
all 18 played). The smoke script re-asserts exactly this case forever (the `reconcile:`
lines above). If you reconcile by hand, pick one player and one full round and write the
three numbers into the PR body just like that.

## 5. The tie test (mandatory when ties/standings/results/share logic is touched)

This reproduces the PR #14 bug scenario. Exact steps:

1. `npm run dev` → http://localhost:3000/start. (Since 2026-07-16 the landing
   page is course-agnostic — the tap path there is "Find your course" → a course
   card → "Start a round" on the course home at `/courses/<id>`.)
2. On `/start`: enter any group name; the form starts with 2 player slots — enter
   "Erin" and "Laura". Leave format as Stroke Play. Tap Start.
3. On the scoring screen, **touch nothing** — just tap "Next hole →" through all 18
   holes. Auto-seed scores every visited hole at par for both players, so they finish
   tied at 54 · E. (Faster variant: after 2–3 holes, edit the URL to
   `/play/<roundId>/results` — both players are seeded identically so it's still a
   tie — but the full 18 also exercises the front/back-nine split.)
4. On the last hole, tap "Finish round →".

What every surface MUST show (all verified in code at commit aa4c527):

| Surface | Required observation |
|---|---|
| Live leaderboard (during play) | Both players rank **1** (ties share a rank) |
| Results hero | **"It's a tie!"** — never "`<name>` wins!" — with "Erin & Laura · 54 strokes · E" |
| Final standings | Both rows rank 1, same total |
| Share card (preview image) | Sunshine box labeled **TIE** (not WINNER) with "Erin & Laura · 54 (E)" |

Also test the 3-way variant if you touched `joinNames`/`winners`: expected joined form is
"Erin, Laura & Sam". A rank sequence after a 2-way tie must skip: 1, 1, 3 — the smoke
script asserts this too.

## 6. The 390px rule

**Why:** the founder — the only reviewer whose approval ships a feature — tests every
feature on her phone at ~390px width. Anything that overflows, collides, or hides below
the sticky bottom nav at 390px is broken, whatever it looks like on desktop.

**How:** Chrome/Edge DevTools → toggle device toolbar (Ctrl+Shift+M, Cmd+Shift+M on Mac)
→ set width to **390** (or pick the iPhone 12/13/14 preset), or use a real phone on the
LAN dev server. Look at, don't just load, each screen.

Which screens to check per change class:

| Change class | Screens to eyeball at 390px |
|---|---|
| Branding/global CSS/fonts | ALL: `/`, `/course`, `/start`, `/play/[id]`, `/play/[id]/results` |
| Course data (`src/config/courses/*`) | `/course` (long hole names/hazard text wrap), scoring hole header |
| Scoring UI | `/play/[id]`: steppers, chip/penalty buttons ≥56px tap targets, math line wrap, sticky Prev/Next not covering content |
| Results/share/PDF buttons | `/play/[id]/results`: hero, card preview, standings, Scorecard grid scrolls horizontally *inside its container* |
| Scorecard grid | Both nines + Totals table at 390px with 4+ players and long names (they truncate) |
| Start flow | `/start`: many players added, sticky Start button state |

## 7. PDF + share-card verification

**PDFs** (generate and OPEN both — do not trust the code path):

1. Blank card: from `/start` ("Prefer pen and paper?") or `/course`, tap the print-blank
   button. File downloads as `Holey Buckets - The Gray Duck - blank scorecard.pdf`
   (name comes from the course). Open it and check: green header band with
   "HOLEY BUCKETS", "The Gray Duck · Osceola, WI", subtitle "Blank scorecard — fill in
   by hand", **today's** date right-aligned, landscape letter, header row
   Hole/1–9/OUT/10–18/IN/Tot, shaded Par row (3s, 27/27/54), 6 blank rows.
2. Results card: finish a round → "Download scorecard (PDF)". File:
   `Holey Buckets - <group name> scorecard.pdf`. Check: subtitle is the group name, date
   is the **round's** date (createdAt), one row per player with NET per-hole scores,
   OUT/IN/Tot columns matching the on-screen Scorecard grid exactly.
3. Sponsor rows (since 2026-07-08, both cards): with active sponsors configured
   (`src/config/sponsors/`), expect a "Hole N presented by <name>" footnote line and a
   "THANKS TO OUR SPONSORS" strip with the active digital sponsors' logos (or bold
   names when a logo fails to load) under the table. With ZERO active sponsors both
   must be entirely absent — no empty frames.

**Share card** (1080×1080 canvas PNG on the results page):

1. Play a round with **5 players** (the card deliberately shows top 5 only — PR #5
   decision; with more players, verify it still shows exactly 5 and nothing overlaps).
2. Check the preview image: green header + bucket mark, "We played Holey Buckets!",
   course name · location, month + year, sunshine winner box (WINNER or TIE per §5),
   ranked standings with totals and to-par strings, footer = group name,
   "A Four Irons Game", site URL in blue.
3. Collision hunt: use long player names and a long group name — text is not truncated
   on the canvas, so overflow shows up here first.
4. Tap Share on a phone → native share sheet; on desktop it falls back to downloading
   `holey-buckets-result.png`. Both paths count as one observation each.

## 8. Inspecting a live round's data

Round state lives in `localStorage` (`holeybuckets:round:<id>`,
`holeybuckets:activeRoundId`). The browser-console inspection/rescue snippets and the
safe-migration checklist are owned by **holey-buckets-round-data-safety** — use that
skill; do not improvise writes to localStorage during QA.

## 9. The test suite (vitest — BUILT 2026-07-03) and what's still candidate

The vitest half of the original proposal shipped on 2026-07-03 (commit 8b9f680,
"Harden the MVP"): `vitest` is a devDependency, `npm test` runs `src/**/*.test.ts`
(scoring, course, round, storage — plus sponsors since 2026-07-08), and the CI
workflow runs it on every PR. The smoke script (`scoring-smoke.mjs`) still exists and
still runs independently of vitest.

Still CANDIDATE (not built): **playwright** browser tests for the tie-test and
reconciliation flows. It would be a new devDependency — pre-flag it and go through
**holey-buckets-change-control** (the policy that admitted jsPDF in PR #13 and
declined a QR library in PR #11). Unit tests do NOT replace the rendered-surface
steps of this runbook — 390px renders, PDFs, share card, and the founder device
pass remain manual.

## Provenance and maintenance

Derived 2026-07-02 (commit aa4c527) from the retiring principal engineer's handoff notes,
the PR history (#1–#15, especially #4, #6, #10, #13, #14), and direct reading of
`src/lib/scoring.ts`, `course.ts`, `types.ts`, `pdf.ts`, `shareImage.ts`,
`src/components/Scorecard.tsx`, and both `/play` pages. `npm run build` and
`scoring-smoke.mjs` were both executed and observed passing on that date.

Re-verification commands (run from repo root) for anything that may drift:

| Claim | Check |
|---|---|
| Test suite + CI present | `ls .github/workflows; grep -E '"(test|vitest)"' package.json` → ci.yml; vitest + test script. `npm test` → all suites pass |
| Smoke script still passes | `node .claude/skills/holey-buckets-validation-and-qa/scripts/scoring-smoke.mjs` |
| tsc still a devDep | `node_modules/.bin/tsc --version` (5.9.x installed against `"typescript": "^5.5.3"` as of 2026-07-02) |
| Route list unchanged | `npm run build` → 10-route table in §1 |
| Scoring exports unchanged | `grep -n "export function" src/lib/scoring.ts` → netStrokes, getHoleScore, holesScored, playerTotal, playerToPar, standings, playerBalls, totalBalls, winners, joinNames, formatToPar |
| Tie hero string | `grep -n "It's a tie" "src/app/play/[roundId]/results/page.tsx"` |
| Share card top-5 + TIE label | `grep -n "slice(0, 5)\|\"TIE\"" src/lib/shareImage.ts` |
| PDF filenames | `grep -n "doc.save" src/lib/pdf.ts` |
| trackBalls still on for flagship | `grep -n trackBalls src/config/courses/osceola.ts` |
