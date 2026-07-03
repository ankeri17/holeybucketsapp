---
name: holey-buckets-history-and-decisions
description: >-
  The Holey Buckets project chronicle and decision log — every PR (#1–#15),
  every settled decision with its rationale and evidence, the one shipped bug
  (the tie bug), and the "before you propose X" index. Use when you are about
  to propose a change, dependency, or design idea and need to know whether it
  was already decided, tried, or rejected; when someone asks "why is it like
  this?", "has this been tried?", or "what happened in PR #N?"; or when
  writing anything that cites project history. Do NOT use for the current
  rules/gates themselves (see holey-buckets-change-control), for how the
  architecture works today (see holey-buckets-architecture-contract), or for
  game-rule details (see bucket-golf-reference) — this skill owns the
  history, not the rules.
---

# Holey Buckets: History and Decisions

The complete failure archaeology and decision log for the Holey Buckets repo, so nobody
re-fights a settled battle or re-proposes a rejected idea. Everything here is verified
against `git log` and the GitHub PR record (repo `ankeri17/holeybucketsapp`, PRs #1–#15).
As of 2026-07-02 this chronicle is COMPLETE — 15 PRs, all merged, is the entire history.

Context in one line: Holey Buckets is a mobile-first, no-backend Next.js web app for
scoring bucket golf (backyard golf — chip a ball into a bucket), owned by a non-developer
founder ("the founder"/Erin) who device-tests everything on her phone at ~390px.

## When to use this skill / When NOT to

USE this skill when:
- You are about to propose a feature, dependency, refactor, or design change — check the
  "Before you propose X" index first.
- You need to know why something is the way it is (pinned Next version, no QR code,
  penalty color, top-5 share card, par-seeding...).
- You need to cite history in a PR body, doc, or discussion ("settled in PR #9").
- You are investigating whether a bug or idea has precedent.

Do NOT use this skill for (use the sibling instead):
- The change rules and gates themselves → `holey-buckets-change-control` (it owns the
  non-negotiables as enforceable policy; this skill owns where they came from).
- How the code is structured today → `holey-buckets-architecture-contract`.
- Bucket golf rules, scoring math, formats → `bucket-golf-reference`.
- Config fields and their defaults → `holey-buckets-config-catalog`.
- Building/running/deploying → `holey-buckets-build-and-run`.
- Debugging a live symptom → `holey-buckets-debugging-playbook`.
- localStorage schema safety and migrations → `holey-buckets-round-data-safety`
  (it owns the migration checklist; this skill only records the one precedent).
- QA protocol and evidence standards → `holey-buckets-validation-and-qa`.
- PR/doc writing style → `holey-buckets-docs-and-writing`.
- Launch work → `holey-buckets-launch-campaign`. Growth/analytics ideas →
  `holey-buckets-growth-engine`.

Nothing in this skill authorizes a change. Anything that changes behavior still goes
through `holey-buckets-change-control`.

## 1. The chronicle — every PR, #1 through #15

All 15 PRs: authored by ankeri17, merged same-day into `main`, full bodies on GitHub
(`https://github.com/ankeri17/holeybucketsapp/pull/<N>`). PR bodies are the project's
decision record — each carries a "Verified" section (there is no test suite; see
`holey-buckets-validation-and-qa`).

| PR | Date | What changed | Decision(s) embedded | Status |
|----|------|--------------|----------------------|--------|
| #1 | 2026-06-26 | Milestone 1: scaffold Next.js 14 App Router + TypeScript + Tailwind, `netlify.toml`, one-file branding config, plain-English README | Pin Next **14.2.35**, accept remaining DoS-class advisories (D1); branding is one swappable file | merged |
| #2 | 2026-06-26 | Milestone 2: full data model (`types.ts`), placeholder Osceola course, course registry, `/course` page, `holePar()`/`coursePar()` | "A course is data, never hardcoded" — the single most important architectural requirement | merged |
| #3 | 2026-06-26 | Milestone 3: `/start` flow, `localStorage` persistence (`storage.ts`), formats catalog with `available` flags, stable player ids | Players keyed by id not name (two "Mike"s fine); `storage.ts` is the Phase-2 swap boundary | merged |
| #4 | 2026-06-26 | Milestone 4: hole-by-hole scoring screen, `scoring.ts` engine, live leaderboard, results stub | Landing on a hole seeds every player to par (D6); `scoring.ts` is the single source of truth for rule math | merged |
| #5 | 2026-06-26 | Milestone 5: branded results, canvas-drawn share image, native share sheet with PNG-download fallback | Canvas over an image library — zero new deps (D2); share card shows top 5 only (D3) | merged |
| #6 | 2026-06-26 | Visual direction pass from the founder's design feedback note: net hole score made prominent + math line, custom SVG icons replace emoji, contrast fixes, brand tokens formalized as CSS vars | Yellow always pairs with ink text; penalties = clay + explicit sign, never red alone (D12); verified to-par counts only holes played | merged |
| #7 | 2026-06-26 | v2 §1–2: typography kit — Bricolage Grotesque + Figtree via `next/font/google`, tabular figures, softened all-caps; tagline "Backyard golf for everyone." | Exactly two fonts (D11); uppercase reserved for short eyebrow labels | merged |
| #8 | 2026-06-26 | v2 §3: course renamed to its real name "The Gray Duck"; forward-looking course fields added: `code`, `isPublic`, `trackBalls`, `heroImage`, `teePhoto` | Scaffold data fields before the UI exists — "cheap now, painful to retrofit" (D10) | merged |
| #9 | 2026-06-26 | v2 §6: `foliage` boolean → `penalties` COUNT (+ corner undo, math line); ball tracking gated by `course.trackBalls` | Penalties are a count, not a flag (D7); balls never affect score, never coupled to penalties (D8); old-round data loss explicitly accepted (D9) | merged |
| #10 | 2026-06-26 | v2 §7: reusable `<Scorecard>` traditional grid (front/back nines, OUT/IN/TOTAL/to-par); logo lockup | One component feeds screen and (later) PDF so they can't drift; verified by hand-reconciling totals (25+27=52/−2) | merged |
| #11 | 2026-06-26 | v2 §8: share card gains course name + location, month/year, and `branding.siteUrl` in bucket blue | Text URL, NO QR code — a QR would need a new library (D4); the share card is an acquisition channel | merged |
| #12 | 2026-06-26 | v2 §3–5: course hero banner + per-hole tee thumbnails + difficulty pips; collapsed format picker; landing confetti | Collapsed picker over a wall of greyed-out "Soon" cards (D13); branded SVG placeholders because the founder's photos were view-only (D5) | merged |
| #13 | 2026-06-26 | Milestone 6: PDF scorecards (jsPDF + jspdf-autotable, dynamically imported on click); "rounds aren't saved" screenshot nudge | First runtime deps since the scaffold — pre-flagged before being added; dynamic import keeps the main bundle light | merged |
| #14 | 2026-06-26 | Bug fix from the founder's real-device testing: tie handling (`winners()`/`joinNames()`), blank scorecard on the start screen, date on PDFs | THE tie bug — see §3 below. Ties are now a mandatory QA case | merged |
| #15 | 2026-06-27 | Tee photo banner on the scoring screen; scroll-to-top on hole change (device feedback: Next left you mid-page) | Real-device feedback loop works; photos slot in via existing `teePhoto` field | merged |

Verify the record yourself (read-only):

```
git fetch origin main && git log --oneline --merges origin/main
```

Expected: 15 lines "Merge pull request #N from ankeri17/claude/holey-buckets-app-review-gcuzef",
N = 15 down to 1. Caveat: a checkout that doesn't track `main` locally shows only 14 merges
via `git log --oneline --merges HEAD` — PR #15's merge commit lives on `main`, while PR #15's
content commit (aa4c527) may be your branch tip. `git ls-remote origin main` returns the
merged tip either way.

## 2. Settled decisions — do not re-litigate without new facts

Each entry: decision → why → evidence → status. "Settled" means: proposing the opposite
requires NEW information (a real incident, a founder request, a Phase-2 trigger) routed
through `holey-buckets-change-control`.

| # | Decision | Why | Evidence | Status |
|---|----------|-----|----------|--------|
| D1 | Next.js pinned at **14.2.35**; remaining DoS-class advisories (fixed only in newer majors) explicitly accepted | MVP has no backend and no image-optimizer exposure, so the advisory surface doesn't apply; a major bump isn't worth the churn | PR #1 (2026-06-26), Notes section; `"next": "14.2.35"` in package.json | Settled. **Revisit when**: Phase 2 adds a backend, or the advisory surface starts applying |
| D2 | Share image is hand-drawn on a `<canvas>` — no image/rendering library | Zero new runtime dependencies for a nice-to-have; full control of the 1080×1080 layout | PR #5 (2026-06-26); `src/lib/shareImage.ts` has no imports beyond project code | Settled |
| D3 | Share card standings show **top 5 only** | Readability on a square image; PR #5 explicitly offered "everyone or just the podium" as alternatives and the founder kept 5 | PR #5 (2026-06-26) "A choice for your eye"; `board.slice(0, 5)` in `src/lib/shareImage.ts` | Settled — founder's explicit call |
| D4 | Share card carries a **text URL, not a QR code** | A QR code needs a new library; dependency discipline. Offered in PR #10's "Next" note ("flag if you want a QR"), declined | PR #11 (2026-06-26) Note: "Text URL only, per your call — no QR" | Settled — founder declined the dep. **Revisit when**: Phase 2 course-code/QR join ships (the `code` field is already scaffolded for it) |
| D5 | Course hero + tee images are **branded SVG placeholders** | The founder's real photos were shared view-only and could not be committed; placeholders wired through the real `heroImage`/`teePhoto` fields so real photos are a drop-in | PR #12 (2026-06-26) "About the images"; `public/courses/grayduck/hero.svg`, `public/placeholder-tee.svg` | Settled as mechanism; the placeholder CONTENT is a known launch gap (see `holey-buckets-launch-campaign`) |
| D6 | Landing on a hole **auto-seeds every player's score to par** | "Visiting a hole means it's in play, so it counts" — also why the leaderboard starts everyone at "E" | PR #4 (2026-06-26) Behavior notes; the seeding `useEffect` in `src/app/play/[roundId]/page.tsx` | Settled |
| D7 | Penalties are a **count, not a boolean flag** | A penalty (foliage, water, OB, lost ball) can happen more than once per hole; the button increments, with a corner "−" undo | PR #9 (2026-06-26); `penalties?: number` in `src/lib/types.ts` | Settled |
| D8 | Ball tracking is **out of the score and uncoupled from penalties** | You can lose a ball without a penalty and take a penalty without losing a ball; balls exist for per-ball BILLING at `trackBalls` courses (The Gray Duck charges per ball) | PR #9 (2026-06-26), "exactly per the note"; comment in `src/lib/types.ts` | Settled — explicit founder requirement |
| D9 | The `foliage`→`penalties` schema change shipped **without a migration** | Old saved rounds read that hole as penalty-free; accepted ONLY because MVP rounds are ephemeral/local — and the tradeoff was documented in the PR body | PR #9 (2026-06-26) Note section | Settled as PRECEDENT, not license: any future schema change must document its tradeoff the same way — see `holey-buckets-round-data-safety` |
| D10 | Course data fields (`code`, `isPublic`, `trackBalls`, `heroImage`, `teePhoto`) scaffolded **before any UI used them** | "Add the data fields now even if the UI comes later" — cheap now, painful to retrofit | PR #8 (2026-06-26) | Settled pattern for forward-compatible data |
| D11 | Exactly **two fonts**: Bricolage Grotesque (display) + Figtree (text), via `next/font/google` | The v2 note's highest-leverage fix — the app read sterile mostly because of type; self-hosted at build time, no layout shift | PR #7 (2026-06-26); `src/app/layout.tsx` | Settled |
| D12 | Penalty/over-par color is **clay (#E0682E) + an explicit +/− sign, never red alone** | Colorblind safety — a design-note requirement; sign carries the meaning, color only reinforces | PR #6 (2026-06-26); `penalty: "#E0682E"` comment "clay, not red" in `src/config/branding.ts` | Settled |
| D13 | Format picker is **collapsed**: one Stroke Play card + a one-line "More formats coming soon — ..." list | A wall of greyed-out "Soon" cards made the start page feel flat and unfinished | PR #12 (2026-06-26); `src/app/start/page.tsx` filters `FORMATS` on `available` | Settled |

## 3. The one shipped bug: the tie bug (PR #14)

The only user-facing defect that ever reached the founder. Learn its shape.

- **Symptom**: a finished round where Erin and Laura both scored 54 (even par) showed
  "Erin wins!" in the results hero. Caught by the founder testing on her REAL phone —
  she sent the screenshot. Desktop preview review had missed it.
- **Root cause**: the winner hero read `board[0]` — the first row of the standings array —
  which is a single arbitrary player when the top total is shared. (Verifiable in git:
  `git show 8fe5364:'src/app/play/[roundId]/results/page.tsx' | grep 'board\[0\]'`
  shows the pre-fix line `const winner = board[0];`.)
- **Fix** (PR #14, 2026-06-26): new `winners()` and `joinNames()` helpers in
  `src/lib/scoring.ts`. `winners()` returns ALL standings rows tying the best total
  (length > 1 ⇒ tie); `joinNames()` renders "Erin & Laura" / "Erin, Laura & Sam".
  The results hero now says "It's a tie!" with the joined names, and the share card
  prints "TIE" instead of "WINNER". Verified with a deliberate 2-way tie.
- **Lesson institutionalized**: edge cases (ties) ship until a human plays a real round
  on a real device. Since PR #14, a deliberate 2-way tie is a MANDATORY QA case whenever
  ties/multi-player logic is touched — the runbook lives in `holey-buckets-validation-and-qa`.

If you are writing any new "winner"-shaped feature (share card variant, PDF header,
notification, anything): consume `winners()`/`joinNames()`, never `board[0]`.

## 4. The v2 note arc (PRs #6–#12): founder feedback → numbered series → all shipped

After Milestone 5, the founder wrote a design feedback note ("the v2 note"). PR #6
implemented its must-fix visual-direction items top-down (P1 scoring clarity — net score
prominent with a spelled-out math line; P2 custom SVG icons replacing emoji; P3 contrast;
P4/P5 personality + polish, including the yellow-pairs-with-ink and clay-not-red rules).
PRs #7–#12 then worked the note's numbered sections as an explicit series:

| Note § | Demand | Shipped in |
|--------|--------|-----------|
| §1–2 | Typography kit + tagline | PR #7 |
| §3 | Real naming ("The Gray Duck") + forward data fields; landing energy | PR #8 (naming/data), PR #12 (landing) |
| §4 | Course visuals: hero, tee thumbnails, difficulty pips | PR #12 |
| §5 | Start page: collapsed format picker | PR #12 |
| §6 | Penalties as a counter + ball tracking | PR #9 |
| §7 | Traditional scorecard grid | PR #10 |
| §8 | Share card: course, date, site URL | PR #11 |

PR #12's body closes the arc explicitly: "All of §1–8 are now shipped across PRs #7–#12."
There is NO outstanding v2 debt. If someone hands you a copy of the v2 note, treat every
item in it as done — check this table before reopening anything.

Why this matters historically: the v2 note is the template for how founder feedback gets
absorbed here — one note, decomposed into small numbered PRs, each independently verified
and merged same-day. Expect launch feedback to arrive the same way.

## 5. Clean history — no ghosts

As of 2026-07-02, explicitly:

- **NO reverts.** `git log --all --oneline --grep="revert" -i` returns nothing.
- **NO dead branches.** `git branch -a` shows only the shared PR working branch
  (`claude/holey-buckets-app-review-gcuzef` — all 15 PRs rode it, its tip equals PR #15's
  merged head) and the current handoff branch. Nothing abandoned.
- **NO abandoned investigations, no half-built features hiding in history.** Every commit
  on `main` arrived via one of the 15 merged PRs.
- **NO issue tracker in use** (0 GitHub issues). The PR bodies ARE the record.
- The founder confirmed nothing major has burned yet. The archaeology is this chronicle —
  a clean, linear, 15-PR build — not war stories. Do not invent drama, and do not assume
  an undocumented failure explains something odd; check the PR bodies first.

## 6. "Before you propose X, read this" index

Check this table BEFORE writing a proposal. If your idea is here, the burden is on you to
bring new facts and route through `holey-buckets-change-control`.

| If you're about to propose... | Stop — it was settled | Where |
|-------------------------------|----------------------|-------|
| Adding a QR code to the share card | Declined: text URL instead; a QR needs a new library. Revisit only with Phase-2 course-code/QR join | D4; PR #10 "Next" note, PR #11 Note |
| A new library for share images (html2canvas, satori, etc.) | The card is deliberately hand-drawn canvas, zero deps | D2; PR #5 |
| Unpinning/upgrading Next.js | Pinned 14.2.35 with documented advisory acceptance; revisit at Phase 2/backend | D1; PR #1 Notes |
| Changing/removing seed-to-par on hole visit | "Visiting a hole means it's in play" — deliberate, explains the leaderboard starting at "E" | D6; PR #4 |
| Coupling balls to penalties (auto-increment one from the other) | Explicitly uncoupled per the founder's note; balls are billing data, never score data | D8; PR #9 |
| Using red for penalties/over-par | Clay + explicit sign, never red alone — colorblind-safe rule | D12; PR #6; `src/config/branding.ts` |
| Showing all players (or podium-only) on the share card | Top 5 was chosen with alternatives on the table; founder kept 5 | D3; PR #5 |
| Reverting penalties to a boolean/toggle | It's a count because penalties recur within a hole | D7; PR #9 |
| Expanding the format picker to show all formats | Collapsed picker was a deliberate de-flattening fix | D13; PR #12 |
| Removing "unused" course fields (`code`, `isPublic`, etc.) | Scaffolded on purpose for Phase 2 — not dead code | D10; PR #8 |
| Adding a third font | Two-font kit is the design system | D11; PR #7 |
| A localStorage schema change "since rounds are ephemeral anyway" | The PR #9 precedent requires the tradeoff be argued and documented per-change, not assumed | D9; PR #9; `holey-buckets-round-data-safety` |
| Any winner-display logic reading `board[0]` | That exact code was the tie bug | §3 above; PR #14 |

## Provenance and maintenance

Derived 2026-07-02 by the retiring principal engineer from: the full GitHub PR record of
`ankeri17/holeybucketsapp` (PRs #1–#15, all bodies read in full), `git log --all` at
commit aa4c527, direct inspection of the cited source files (including `git show` of the
pre-PR-#14 results page to confirm the tie-bug root cause), and founder-confirmed answers
to handoff questions (the "nothing major has burned" statement and house rules).

This skill is a HISTORY: PRs #1–#15 and decisions D1–D13 will not change. What drifts is
the claim of completeness — after any NEW merged PR, append a chronicle row and any new
decisions, and update the "as of" dates in the intro and §5.

Re-verification commands (all read-only):

| Claim | Command | Expected as of 2026-07-02 |
|-------|---------|---------------------------|
| 15 merged PRs, none since | `git fetch origin main && git log --oneline --merges origin/main` | 15 "Merge pull request #N" lines, #15 topmost |
| No reverts anywhere | `git log --all --oneline --grep="revert" -i` | empty output |
| No stray branches | `git branch -a` | only the PR working branch + your current branch |
| Next still pinned | `grep '"next"' package.json` | `"next": "14.2.35"` |
| Tie fix in place | `grep -n "winners\|joinNames" src/lib/scoring.ts` | both functions exported |
| Top-5 share card | `grep -n "slice(0, 5)" src/lib/shareImage.ts` | one hit in the standings loop |
| No QR dependency crept in | `grep -ri "qrcode" package.json src/` | empty output ("QR join later" comments on the `code` field mention QR but match no dependency) |
| Penalties still a count | `grep -n "penalties?: number" src/lib/types.ts` | one hit |
| Clay-not-red still holds | `grep -n 'penalty:' src/config/branding.ts` | `"#E0682E"` with the "clay, not red" comment |
| SVG placeholders still in use | `ls public/courses/grayduck/ public/placeholder-tee.svg` | `hero.svg` + the placeholder (real photos replacing them is expected at launch) |
| PR bodies (the primary record) | open `https://github.com/ankeri17/holeybucketsapp/pull/<N>` | body with a "Verified" section |
