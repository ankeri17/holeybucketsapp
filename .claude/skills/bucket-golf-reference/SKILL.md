---
name: bucket-golf-reference
description: >-
  Domain reference for bucket golf AS IMPLEMENTED in the Holey Buckets repo:
  glossary, the exact net-strokes formula with worked cases, tie/rank
  semantics, to-par-over-played-holes rule, ball tracking as billing (not
  scoring), difficultyRank/pip semantics, and the Phase 2 formats catalog.
  Use when reading or reasoning about scoring code (src/lib/scoring.ts,
  Scorecard, leaderboard, share card, PDF numbers), when a term like "bucket
  chip", "net strokes", "OUT/IN", "to-par", or "trackBalls" is unclear, or
  when evaluating a future scoring format. Do NOT use for how to change
  scoring safely (see holey-buckets-change-control and
  holey-buckets-validation-and-qa), for config field editing
  (holey-buckets-config-catalog), or for localStorage round-shape changes
  (holey-buckets-round-data-safety).
---

# Bucket golf — the rules as this repo implements them

This is the domain pack for Holey Buckets (the repo this skill ships in; all paths below are repo-relative).
It documents bucket golf **as encoded in this codebase** — not the sport in general.
Everything below was verified against the source at commit `aa4c527` on 2026-07-02.
The single source of truth for all rule math is `src/lib/scoring.ts`; every screen,
the leaderboard, the scorecard grid, the share image, and the PDF read the same
helpers so they cannot disagree.

## When to use this skill

- You are reading or debugging anything that computes or displays a score, rank,
  to-par, winner, or ball count.
- You hit a domain term (bucket chip, net strokes, OUT/IN, E/+3, trackBalls,
  difficultyRank) and need its exact meaning here.
- You are asked about a scoring format other than stroke play.

## When NOT to use (siblings own these)

| Need | Go to |
|---|---|
| How to safely CHANGE scoring behavior, PR gating | `holey-buckets-change-control` |
| Evidence protocol, hand-check runbook, smoke scripts | `holey-buckets-validation-and-qa` |
| Editing course/branding config fields, defaults | `holey-buckets-config-catalog` |
| localStorage Round shape, migrations, "never lose a live round" | `holey-buckets-round-data-safety` |
| Why the architecture is shaped this way | `holey-buckets-architecture-contract` |
| PR-by-PR history and decisions | `holey-buckets-history-and-decisions` |

## 1. Glossary (define once, use everywhere)

| Term | Meaning in this repo |
|---|---|
| **Bucket golf** | Backyard golf: chip a ball from a tee into a bucket. The app scores a round of it or prints a paper scorecard. |
| **Stroke** | One throw/chip attempt. Raw count per hole (`HoleScore.strokes`, UI minimum 1). |
| **Bucket chip** | Chipping the ball **INTO the bucket** (not near it). Worth −1 stroke. **Binary per hole** (`bucketChip?: boolean`) — you either did or didn't. |
| **Penalty** | Ball into foliage, water, out of bounds, or lost. **+1 each, a COUNT** (`penalties?: number`, default 0) — can happen multiple times per hole. Was a boolean ("foliage") before PR #9 (2026-06-26) converted it to a count. |
| **Net strokes** | The hole score everyone sees: `strokes − chip bonus + penalties`, floored at 0. See §2. |
| **Par** | Expected strokes per hole. Default **3** (`DEFAULT_PAR` in `src/lib/types.ts`); a hole may override via its optional `par` field (`holePar` in `src/lib/course.ts` applies the fallback). |
| **OUT / IN** | Golf convention on the scorecard grid: OUT = subtotal of the front nine (holes 1–9), IN = subtotal of the back nine (10–18). `Scorecard.tsx` splits via `course.holes.slice(0, 9)` / `slice(9)`. OUT + IN = TOTAL. |
| **To-par notation** | `"E"` for even (0), `"+3"` for 3 over, `"-1"` for 1 under — formatted by `formatToPar` in `scoring.ts`. |
| **Stroke play** | The only playable format today: **lowest total net strokes wins**. |
| **Standings / rank** | Leaderboard rows sorted lowest total first; equal totals **share** a rank (see §3). |
| **trackBalls / balls used** | Per-player, round-level tally of balls used/lost, for per-ball venue **billing**. Never touches the score. See §5. |
| **difficultyRank** | Optional per-hole ranking, **1 = hardest**. Reserved for Phase 2 handicaps; today it only drives the course-page difficulty pips. See §6. |
| **Hole "in play"** | Landing on a hole auto-seeds every player's score to par (`{ strokes: holePar(hole) }`) — a deliberate PR #4 decision ("visiting a hole means it's in play", and why the live leaderboard starts at "E"). A missing `scores[playerId][holeNumber]` entry means the hole was never visited/scored. |

## 2. The scoring formula (single source of truth)

From `src/lib/scoring.ts`, `netStrokes(score)` — verbatim logic:

```ts
if (!score) return 0;
const net = score.strokes - (score.bucketChip ? 1 : 0) + (score.penalties ?? 0);
// Can't score below zero, even with a first-throw chip-in.
return Math.max(0, net);
```

In words: **net = strokes − 1 (if chipped into the bucket) + 1 per penalty, floored at 0.**
An undefined/missing score contributes 0 (unscored hole).

Canonical worked cases (from PR #4, 2026-06-26; each re-verified against the code
above — use these whenever scoring math is touched):

| Case | strokes | bucketChip | penalties | Net | Why |
|---|---|---|---|---|---|
| Plain par | 3 | — | 0 | **3** | 3 − 0 + 0 |
| Chip-in on 2nd throw | 2 | true | 0 | **1** | 2 − 1 + 0 |
| 3 strokes + 1 penalty | 3 | — | 1 | **4** | 3 − 0 + 1 |
| Chip and penalty cancel | 3 | true | 1 | **3** | 3 − 1 + 1 |
| First-throw chip-in | 1 | true | 0 | **0** | max(0, 1 − 1) — the floor rule |

Totals: `playerTotal` sums `netStrokes` over every hole the player has an entry
for. The scoring screen shows the big NET number per player and a math line
("3 strokes + 2 penalties = 5") only when a modifier is active.

## 3. Tie semantics

Three cooperating pieces, all in `src/lib/scoring.ts` (tie handling fixed by
PR #14, 2026-06-26, after the founder's real-device round showed "Erin wins!"
on an actual Erin/Laura 54·E tie):

1. **Shared ranks** — `standings()` sorts rows by total ascending, then assigns
   `rank = previous row's rank` when totals are equal, else `i + 1`. So totals
   52, 54, 54, 57 rank as 1, 2, 2, 4 (competition ranking — rank 3 is skipped).
2. **`winners(board)`** — returns **every** row whose total equals the best
   (lowest) total. `length > 1` is the tie test. Empty board → `[]`.
3. **`joinNames(names)`** — output shapes, exactly:
   - 0 names → `""`
   - 1 name → `"Erin"`
   - 2 names → `"Erin & Laura"`
   - 3+ names → `"Erin, Laura & Sam"` (commas, final `&`)

Consumers: the results hero shows "It's a tie!" plus the joined names
(`src/app/play/[roundId]/results/page.tsx`), and the share image swaps its
"WINNER" label for "TIE" with the joined names (`src/lib/shareImage.ts`).
Any new results surface must handle the multi-winner case the same way.

## 4. To-par is computed over PLAYED holes only

`playerToPar` (in `scoring.ts`) iterates **only** the holes present in
`round.scores[playerId]` and sums `netStrokes(score) − holePar(hole)` per
played hole. It never assumes 18 holes.

Why: mid-round, "vs par of all 18" would show every player absurdly under par
on hole 3. This was an explicit **P1 fix demand** in the founder's v2 feedback
note, verified in PR #6 (2026-06-26). If you ever see a to-par figure computed
from `coursePar(course)` for an in-progress round, that is a bug.

Note the interaction with §1's "in play" seeding: visiting a hole seeds
everyone to par there, so a freshly visited hole contributes 0 to to-par — the
leaderboard reads "E" until someone deviates from par.

## 5. Ball tracking is BILLING, never scoring

- The flagship venue, **The Gray Duck** (Osceola, WI, hosted by Hello Again
  Properties), charges players **per ball**. `trackBalls: true` in
  `src/config/courses/osceola.ts` turns on a per-player "Balls used" stepper on
  the scoring screen and a Balls-used section on results.
- The tally is **round-level** (one number per player, `Round.balls`), not
  per-hole, floored at 0 in `updateBalls` (`src/app/play/[roundId]/page.tsx`).
- It **never affects any score** — `playerBalls`/`totalBalls` in `scoring.ts`
  are read-only tallies with no path into `netStrokes`/`playerTotal`.
- It is deliberately **uncoupled from penalties** (PR #9, 2026-06-26): you can
  lose a ball with no penalty, or take a penalty (e.g. water you retrieve from)
  without losing a ball. Do not "helpfully" auto-increment one from the other.
- It is a per-course setting (multi-tenant): off by default for other courses.
  UI gates: `course.trackBalls &&` in both play and results pages.

## 6. difficultyRank and the pip formula

- `Hole.difficultyRank` is optional; **1 = hardest hole** on the course.
- Reserved for a **Phase 2 handicap system** (not built; do not build scoring
  logic on it without change control).
- As of 2026-07-02 its ONLY consumer is the 5-pip `DifficultyMeter` on the
  course page. Formula, verbatim from `src/app/course/page.tsx`:

```ts
const level = Math.max(1, Math.min(5, Math.ceil(((total - rank + 1) / total) * 5)));
```

where `total` = number of holes on the course. So on an 18-hole course,
rank 1 (hardest) → level 5 (all pips filled), rank 18 (easiest) → level 1.
Pips render in penalty clay (`bg-brand-penalty`) when filled. The meter only
renders when `hole.difficultyRank != null`.

## 7. Scoring formats catalog (MVP + Phase 2)

`ScoringFormat` union in `src/lib/types.ts` has **7 members**; the visible
picker catalog `FORMATS` in `src/lib/formats.ts` has **6 entries** with
`available` flags. As of 2026-07-02 only `strokePlay` is `available: true`
(= `DEFAULT_FORMAT`); the start screen shows unavailable ones under "More
formats coming soon".

**Known gap:** `teamAlternateShot` exists in the type union but is **absent
from the FORMATS list** — it is type-only today and never shown in the UI.

Real-world rules per format, plus how each *could* map onto the existing
`Round`/`HoleScore` model. Every mapping below is a **candidate — not
implemented**; building one is a behavior change that goes through
`holey-buckets-change-control`.

| Format (union id) | In FORMATS? | Real-world rules | Candidate mapping onto Round/HoleScore (not implemented) |
|---|---|---|---|
| `strokePlay` | Yes (available) | Lowest total net strokes over the round wins. | **Shipped.** `playerTotal` + `standings` as described above. |
| `matchPlay` | Yes | Head-to-head: each hole is won/lost/halved by lower net score; most holes won takes the match. | Per-hole `netStrokes` comparison between two players; derive hole wins from existing `scores` — no schema change needed for 2 players. Multi-player brackets would need pairing data on `Round`. |
| `skins` | Yes | Each hole is its own prize ("skin"); outright lowest net on a hole wins it; ties carry the skin over to the next hole. | Derivable from `scores`: per hole, find unique minimum `netStrokes`; carry-over is pure computation. A per-skin value/stake would need a new `Round` field. |
| `fiveThreeOne` | Yes | 5-3-1: points per hole for a group of 3 — best net gets 5, middle 3, worst 1 (house variants exist for ties). | Derivable: rank `netStrokes` per hole across players, award 5/3/1; tie-splitting rule must be chosen and documented. Standings would rank by points DESCENDING — `standings()` sorts ascending, so a parallel points board is needed. |
| `teamBestBall` | Yes | Teams; every player plays their own ball; the team's score on a hole is its best (lowest) individual net. | Needs a team assignment field on `Round` (e.g. `teams: Record<teamId, playerId[]>`). Hole scores stay per-player; team score is `min(netStrokes)` per hole — computable from existing `scores`. |
| `pigAndWolf` | Yes | Rotating "wolf" picks a partner (or goes alone, "pig") hole by hole after seeing tee shots; points per hole to the winning side. | Needs per-hole partnership records (wolf id + chosen partner or lone flag) — a new per-hole structure on `Round`, plus a points ledger. Largest schema addition of the six. |
| `teamAlternateShot` | **No — type-only** | Teams of 2 share one ball, alternating strokes; one team score per hole. | Breaks the per-player `scores[playerId][holeNumber]` assumption — score belongs to a team, not a player. Cleanest candidate: score under a synthetic team "player" id, plus a `teams` field. Must also be ADDED to `FORMATS` to ever appear in the picker. |

## 8. Where each rule lives in code

| Rule / concept | File : symbol |
|---|---|
| Net-strokes formula + floor at 0 | `src/lib/scoring.ts` : `netStrokes` |
| Default par 3 constant | `src/lib/types.ts` : `DEFAULT_PAR` |
| Par fallback per hole / course total par | `src/lib/course.ts` : `holePar`, `coursePar` |
| HoleScore shape (strokes, bucketChip, penalties) | `src/lib/types.ts` : `HoleScore` |
| Player total (played holes only) | `src/lib/scoring.ts` : `playerTotal` |
| To-par over played holes only | `src/lib/scoring.ts` : `playerToPar` |
| Holes-scored count | `src/lib/scoring.ts` : `holesScored` |
| Leaderboard + shared ranks | `src/lib/scoring.ts` : `standings`, `Standing` |
| Tie detection (multi-row winners) | `src/lib/scoring.ts` : `winners` |
| Name joining ("A", "A & B", "A, B & C") | `src/lib/scoring.ts` : `joinNames` |
| To-par notation (E/+3/−1) | `src/lib/scoring.ts` : `formatToPar` |
| Ball tallies (never scoring) | `src/lib/scoring.ts` : `playerBalls`, `totalBalls`; write path `src/app/play/[roundId]/page.tsx` : `updateBalls` |
| trackBalls flag (billing venues) | `src/lib/types.ts` : `Course.trackBalls`; set in `src/config/courses/osceola.ts` |
| Auto-seed hole to par ("in play") | `src/app/play/[roundId]/page.tsx` : the seeding `useEffect` (writes `{ strokes: holePar(hole) }`) |
| OUT/IN/TOTAL grid + net-vs-par color coding | `src/components/Scorecard.tsx` |
| Tie hero ("It's a tie!") | `src/app/play/[roundId]/results/page.tsx` |
| TIE label on share image (top-5 board) | `src/lib/shareImage.ts` |
| Formats catalog + available flags + default | `src/lib/formats.ts` : `FORMATS`, `DEFAULT_FORMAT` |
| ScoringFormat union (7 members) | `src/lib/types.ts` : `ScoringFormat` |
| Difficulty pips formula | `src/app/course/page.tsx` : `DifficultyMeter` |
| NET per-hole numbers on the PDF scorecard | `src/lib/pdf.ts` : `downloadResultsScorecard` |

There is **no test suite** covering any of this — verification is manual
(hand-check the §2 table; see `holey-buckets-validation-and-qa`).

## Provenance and maintenance

Derived 2026-07-02 by direct reading of the source at commit `aa4c527`
(`src/lib/scoring.ts`, `types.ts`, `formats.ts`, `course.ts`, `shareImage.ts`,
`src/components/Scorecard.tsx`, `src/app/course/page.tsx`,
`src/app/play/[roundId]/page.tsx` and `results/page.tsx`,
`src/config/courses/osceola.ts`), cross-checked against the GitHub PR history
(#4, #6, #9, #14). Each worked case in §2 was traced through `netStrokes` by
hand.

Re-verify before trusting volatile facts (run from the repo root):

| Fact | Command | Expect |
|---|---|---|
| Formula + floor unchanged | `grep -n "Math.max(0" src/lib/scoring.ts` | the `return Math.max(0, net)` line in `netStrokes` |
| DEFAULT_PAR still 3 | `grep -n "DEFAULT_PAR = " src/lib/types.ts` | `export const DEFAULT_PAR = 3;` |
| Only strokePlay available | `grep -n "available: true" src/lib/formats.ts` | 1 line (strokePlay) |
| teamAlternateShot still type-only | `grep -c "teamAlternateShot" src/lib/formats.ts` | `0` |
| trackBalls still on for flagship | `grep -n "trackBalls" src/config/courses/osceola.ts` | `trackBalls: true` |
| Pip formula unchanged | `grep -n "Math.ceil" src/app/course/page.tsx` | the `((total - rank + 1) / total) * 5` line |
| To-par still played-holes-only | `grep -n -A 8 "playerToPar" src/lib/scoring.ts` | reduce over `Object.entries(byHole)`, no 18-hole assumption |
| difficultyRank consumers | `grep -rn "difficultyRank" src/ \| grep -v types.ts` | only `course/page.tsx` and course config |
| Balls stay out of scoring | `grep -n "balls" src/lib/scoring.ts` | only `playerBalls`/`totalBalls`, unused by `netStrokes`/`playerTotal` |
