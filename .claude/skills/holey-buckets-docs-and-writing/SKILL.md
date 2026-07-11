---
name: holey-buckets-docs-and-writing
description: >
  Use when WRITING or EDITING any prose in the Holey Buckets repo
  (holeybucketsapp): the README, comments in the founder-editable config files
  (branding.ts, courses/*.ts), code header comments, PR titles/bodies,
  player-facing UI copy, or a skill in this library. Provides the docs-of-record
  inventory, the house style (three voices), the PR-body template extracted
  from merged PRs #1–#15, and the README/skill maintenance checklists. Do NOT
  use for: what evidence a PR must contain or how changes are gated
  (holey-buckets-change-control), how to run verification
  (holey-buckets-validation-and-qa), the meaning of config fields
  (holey-buckets-config-catalog), or why past decisions were made
  (holey-buckets-history-and-decisions).
---

# Holey Buckets — docs of record and house style

This repo has **no wiki, no design docs, no issue tracker**. The written record is:
the README, the comments inside two founder-editable config files, code header
comments, the merged PR bodies on GitHub, and this skill library. If you write
prose anywhere in this project, this skill tells you what voice to use, what must
stay true, and which documents you are obligated to keep current.

**Key term — "founder-editable":** `src/config/branding.ts`,
`src/config/courses/*.ts`, and (since 2026-07-08) `src/config/sponsors/*.ts` are
edited directly by the owner (Erin), who is NOT a developer. The comments in those
files are her only manual. House rule "founder-editable stays sacred" (see
holey-buckets-change-control for the gate): those files must remain editable by a
non-developer at all times.

## When to use this skill / when NOT to

| Situation | Use |
|---|---|
| Writing/updating README, config comments, code comments, UI copy, PR body, or a skill file | **This skill** |
| Deciding whether a change is allowed, what its gate/evidence is | holey-buckets-change-control |
| Running the 390px / build / scoring-math verification itself | holey-buckets-validation-and-qa |
| What a branding/course field means, defaults, adding a field | holey-buckets-config-catalog |
| Rules of bucket golf, scoring cases, formats | bucket-golf-reference |
| Why a decision was made; the PR chronicle | holey-buckets-history-and-decisions |
| Build/run/deploy mechanics | holey-buckets-build-and-run |

## 1. The docs of record — inventory

| Document | Location | Audience | Update trigger |
|---|---|---|---|
| README | `README.md` | The founder (plain English) | Milestone ships; any command/path/claim changes |
| Branding how-to comments | `src/config/branding.ts` | The founder | Any field added/changed in that file |
| Course how-to comments | `src/config/courses/osceola.ts` (and future courses) | The founder | Any Hole/Course field added/changed |
| Sponsor how-to comments | `src/config/sponsors/osceola.ts` (and future courses) | The founder | Any Sponsor field added/changed; when real sponsors replace the SAMPLE data |
| Code header comments | Top of most `src/**` files | Next engineer/model | Module's intent or contract changes |
| PR bodies | GitHub, merged PRs #1–#15 (2026-06-26/27) and onward | Founder + future archaeologist | Every PR — **the PR body IS the design-history archive**; there are no other design docs |
| Skill library | `.claude/skills/*/SKILL.md` | Zero-context successor (human or model) | A fact a skill states drifts — fix in the SAME PR |

**Load-bearing, not decoration:** the comment blocks in `branding.ts` and
`osceola.ts` are founder-facing operating instructions. Deleting or letting them
rot breaks the founder's ability to run her own product. Treat comment edits in
those two files with the same care as code edits.

## 2. README anatomy — what must stay true

`README.md` is plain-English and founder-facing throughout ("You don't need to be
a developer to change these"). Its section contract, verified 2026-07-02:

1. **Title + intro** — what the app is; "a course is just data"; "A Four Irons
   game" credit with the per-course host note.
2. **Status callout** (blockquote) — which milestone the app is at.
3. **"What's here so far"** — one paragraph of current state.
4. **"The three files you'll most likely want to edit"** — THE founder contract:
   numbered list naming exactly `src/config/branding.ts`,
   `src/config/courses/osceola.ts`, and (since 2026-07-08)
   `src/config/sponsors/osceola.ts` with what each controls. Never remove or
   bury this section; if another founder-editable file ever exists, extend it.
5. **"Run it on your computer"** — Node 18+, then `npm install` / `npm run dev`,
   open <http://localhost:3000>. These commands must stay copy-paste true
   (they match `package.json` scripts as of 2026-07-02).
6. **"Deploy it (Netlify)"** — the no-terminal deploy story: connect repo, Netlify
   reads `netlify.toml`, every push to `main` republishes.
7. **"Tech choices (plain English)"** — jargon-free stack summary, including the
   deliberate "No backend / no database / no logins (for now)" line.
8. **"Roadmap (build order)"** — 8 numbered checkboxes. ✅ 1–6, ⬜ 7 (email
   capture + booking link + brand polish), ⬜ 8 (PWA + offline), as of 2026-07-02.

**Known drift: RESOLVED.** The 2026-07-02 drift (Status callout stuck at
"Milestone 1", "near-empty" description) was fixed in the 2026-07-03 "Harden the
MVP" commit (8b9f680); the last residue (roadmap item 4's "foliage penalty"
wording) was fixed 2026-07-08 in the sponsor-placements PR.

### README maintenance checklist (run when a milestone ships or paths change)

1. Tick the milestone's checkbox (`⬜` → `✅`) in "Roadmap (build order)".
2. Update the Status callout and "What's here so far" to describe the new state.
3. If any command, URL, port, or file path in the README changed: update it, then
   **re-test by copy-pasting each command** into a clean terminal (`npm install`,
   `npm run dev`, open localhost:3000). A README command that doesn't work as
   pasted is a bug.
4. If a founder-editable file was renamed/added: update section 4's list.
5. Re-read the whole file as the founder: no jargon crept in? Every term either
   plain or explained inline?

## 3. House style — the three voices

### Voice A — founder-facing plain English (README, branding.ts + courses/*.ts comments)

- No jargon. No unexplained acronyms. "the phone's own storage", not
  "localStorage" (README uses the plain phrase; code comments may use the term).
- Second person, direct: "This is the ONE file to edit to re-skin the whole app."
- Explain consequences, not mechanisms: "Change it here and the whole app
  re-skins."
- Instructions a non-developer can follow mechanically, down to syntax:
  osceola.ts literally says "Keep each hole inside { curly braces } and end it
  with a comma."
- Mark placeholders loudly: osceola.ts opens with "OSCEOLA COURSE — PLACEHOLDER
  DATA" and says exactly what to replace when the owner's worksheet arrives.

### Voice B — technical-but-warm code comments (everything in src/)

Existing files set the voice — read `src/lib/scoring.ts`, `src/lib/types.ts`,
`src/lib/storage.ts` before writing new headers. The pattern:

- **Every module gets a header comment stating its intent and its rule**, e.g.
  scoring.ts: "SCORING — the single source of truth for the bucket golf rules"
  followed by the rules themselves; types.ts: "a **course is data**, never
  hardcoded"; storage.ts: why localStorage and what Phase 2 swaps.
- Big banner (`====` box) headers for contract-bearing modules; a short JSDoc
  paragraph is fine for small ones.
- Comments explain **WHY and the rule, never the syntax**: "Can't score below
  zero, even with a first-throw chip-in." / "Landing on a hole means it's in
  play." / "each player gets a stable id (scores key off the id, not the name —
  two 'Mike's are fine)".
- Inline JSX comments flag intent of blocks: `{/* Balls used — only for venues
  that charge per ball (out of the score) */}`.
- Cross-reference the file that owns a concern: types.ts points editors to
  `src/config/courses/`; branding.ts points host questions to course data.

### Voice C — playful brand voice (player-facing UI copy)

- Punny, warm, short. Tagline: "Backyard golf for everyone." (branding.ts says
  "Keep it playful."). Hole names like "The Warm-Up", "Holey Finish".
- Warnings start "**Heads up —**" (results-page save nudge) or "Heads up:"
  (hazard lines on course/scoring pages). Reuse that opener; don't invent new
  warning idioms.
- Friendly failure copy, never blame: "couldn't find that round on this device"
  (scoring page fallback), "Loading round…".
- Nudges give the player an action: "Screenshot this page, share the card, or
  download the PDF below to keep your results."

### Typographic conventions (verified in src/ 2026-07-02)

| Mark | Use | Examples in repo |
|---|---|---|
| Em dash `—` | Asides and compound headlines, in copy AND comments | "Heads up — rounds aren't saved."; "SCORING — the single source of truth" |
| Middle dot `·` | Joining short facts on one line | "The Gray Duck · Osceola, WI"; "54 strokes · E"; "Balls used · N total" |
| Ellipsis `…` | Loading states | "Loading round…" |
| UPPERCASE | ONLY short eyebrow labels (12px, tracked) — never headlines | "Share the win" eyebrow |

Design-copy guardrails (sunshine always with ink text, penalties = clay + explicit
sign, two fonts only, no emoji in UI — custom SVG icons instead) are
non-negotiables owned by holey-buckets-change-control; obey them in any copy that
carries color or emphasis. Note emoji ARE fine in PR bodies (PR #5 used 🏆) —
the ban is on shipped UI.

## 4. The PR body template (extracted from merged PRs #1–#15)

PR bodies are written **to the founder** in the second person ("per your steer" —
PR #13; "From your real-device testing" — PR #14; both 2026-06-26). They are the only design
archive: every decision, tradeoff, and known gap must be readable there years
later. Keep every PR **single-purpose** (PR #7's "Scope note" explicitly split
the founder's v2 feedback note across PRs #7–#12 rather than shipping it as one).

**Title style** (sentence case, colon after the scope tag):
- Milestone work: `Milestone 6: printable PDF scorecards + screenshot prompt`
- Themed series: `v2 #9: Penalty counter + ball tracking`
- Fixes/tweaks: plain description — `Fix tie results, blank scorecard at start, date on PDF`

**Body skeleton** (the settled form; PRs #9–#13 are the cleanest exemplars):

```markdown
## <Scope tag> — <What this PR is, in one line>

One short paragraph of context: why this change, in plain English.

### What's in here
- **Bold the thing**, then explain it — file paths in backticks, founder
  consequences spelled out ("imported dynamically (only on click), so it
  never weighs down normal page load").
- One bullet per shippable piece.

### Verified
What you actually did and SAW: "Rendered at 390px — <what you observed>.
`npm run build` passes." Plus rule-math reconciliation when scoring was
touched (PR #10: "Erin 25+27=52/−2"). Described observations, not claims.

### Notes
Tradeoffs, known gaps, data-migration consequences (PR #9 documented that old
rounds read as penalty-free), and anything deliberately NOT done (PR #11:
"no QR — would need a QR library").

### Next
One line pointing at the next roadmap item, e.g.
"7. Email capture + booking link → 8. PWA + offline."
```

Rules:
- **"### Verified" is mandatory** — content requirements (390px render, build
  pass, math spot-checks) are owned by holey-buckets-change-control; this skill
  owns only the shape and placement.
- "### Notes" is where tradeoffs go ON THE RECORD. If you accepted a risk
  (dependency, migration, pinned version), it must appear here — PR #1's Next
  14.2.35 advisory acceptance is the precedent.
- "### Next" keeps the roadmap thread unbroken across the archive; early PRs
  wrote it as "### Roadmap (next up)" — either heading is fine.
- Flag future dependencies in writing before adding them: PR #13 added jsPDF
  as "the first runtime dependencies since the scaffold (flagged earlier)",
  and PR #10's "Next" pre-flagged that a QR code "needs a small QR lib"
  (declined in PR #11).

## 5. Writing rules for founder-editable files (sacred)

When touching `src/config/branding.ts`, `src/config/courses/*.ts`, or
`src/config/sponsors/*.ts`:

1. **Never remove or shorten the how-to-edit comment blocks** — the banner
   header ("This is the ONE file to edit…" / "👉 This is the file to edit to
   set up the real Osceola course") and the per-field bullet guide in
   osceola.ts ("How to edit a hole (you don't need to be a developer)").
2. **Every new field MUST ship with a comment a non-developer can follow**,
   in the established format — what it is, what it changes, whether it's
   optional, and any placeholder status. Model: osceola.ts's
   `` `difficultyRank` 1 = hardest hole (optional, used later for handicaps) ``.
   Adding the field itself is gated by holey-buckets-change-control; the field
   list and semantics live in holey-buckets-config-catalog.
3. Keep placeholder warnings accurate: when real data replaces placeholder data
   (e.g. the owner's worksheet lands in osceola.ts), DELETE the "PLACEHOLDER
   DATA" banner language in the same edit — a stale "this is fake" warning over
   real data is as bad as no warning.
4. Plain hex, plain strings, no clever TypeScript in founder-reach — the
   `as const` and `Course` typing stay, but the parts the founder edits must
   read like a form, not code.

## 6. Skill-library maintenance

- Every skill in `.claude/skills/` ends with a `## Provenance and maintenance`
  section: how it was derived plus a table of one-line re-verification commands
  for anything that can drift.
- **When a change moves a fact that a skill states** (a command, path, field,
  route, URL, default, roadmap status), fix the skill **in the same PR** as the
  change. Find victims with:
  `grep -rn "<the old fact>" .claude/skills/`
- Skills follow this same house style: imperative runbook voice, tables over
  prose, jargon defined once, volatile facts date-stamped ("As of 2026-07-02"),
  unbuilt things labeled open/candidate/Phase 2 — never oversold.
- Cite PR history durably: "PR #9 (2026-06-26)" — links survive on GitHub;
  session-local paths do not.

## Provenance and maintenance

Derived 2026-07-02 (repo commit aa4c527) by direct reading of `README.md`,
`src/config/branding.ts`, `src/config/courses/osceola.ts`, `src/lib/scoring.ts`,
`src/lib/types.ts`, `src/lib/storage.ts`, the UI copy in `src/app/**`, and the
full bodies of merged PRs #1–#15 on github.com/ankeri17/holeybucketsapp.

| Fact that can drift | Re-verify with |
|---|---|
| README roadmap ticks (✅ 1–6, ⬜ 7–8) + stale "Milestone 1" status | `grep -n "✅\|⬜\|Status:" README.md` |
| README run commands match package.json | `grep -n "\"dev\"\|\"build\"\|\"lint\"" package.json` then compare README "Run it" section |
| "Three files you'll most likely want to edit" section intact | `grep -n "three files" README.md` |
| branding.ts / osceola.ts how-to comment blocks intact | `head -30 src/config/branding.ts src/config/courses/osceola.ts` |
| osceola.ts carries real worksheet data (since 2026-07-11) | `grep -n "real" src/config/courses/osceola.ts` |
| "Heads up" copy idiom | `grep -rn "Heads up" src/` |
| Middle-dot / em-dash usage in UI copy | `grep -rn "·" src/app src/lib \| head` |
| PR body form still followed | Read the latest merged PR body on GitHub; compare to §4 skeleton |
| Sibling skills all have Provenance sections | `grep -L "Provenance" .claude/skills/*/SKILL.md` (should print nothing) |
| This library's skill list | `ls .claude/skills/` |
