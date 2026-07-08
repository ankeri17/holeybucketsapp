---
name: holey-buckets-change-control
description: >
  Use BEFORE making, reviewing, or merging ANY change to the Holey Buckets repo
  (holeybucketsapp): to classify a change, find its gate and required evidence,
  check it against the project non-negotiables, and write a compliant PR. This
  skill is the gate for anything that changes behavior — load it first, then
  follow its pointers. Do NOT use for: how to run the verification protocol
  itself (holey-buckets-validation-and-qa), localStorage migration mechanics
  (holey-buckets-round-data-safety), PR-body/README templates
  (holey-buckets-docs-and-writing), or the WHY behind architecture decisions
  (holey-buckets-architecture-contract).
---

# Holey Buckets — Change Control

How changes are classified, gated, and reviewed in this repo, plus the project's
non-negotiables with the history behind each. As of 2026-07-08 there IS a small
quality floor: a **vitest suite** (`npm test`, `src/**/*.test.ts`) and **GitHub
Actions CI** (`.github/workflows/ci.yml`: typecheck, lint, test, build on every PR
and on pushes to `main`), both added 2026-07-03 (commit 8b9f680). Netlify still
rebuilds `main` on every push with no staging, so **the PR discipline in this file
is still the quality system** — CI catches breakage, not wrongness; the "Verified"
evidence bar below is unchanged. Skipping it means shipping unreviewed code
straight to the live app.

## When to use this skill

- You are about to change ANY file in this repo and need to know the gate.
- You are writing or reviewing a PR.
- You are deciding whether to add a dependency, touch scoring math, or change
  the stored round shape.
- A proposed change might conflict with a house rule and you need the rule,
  its rationale, and the precedent.

## When NOT to use (go to the sibling instead)

| Need | Sibling skill |
|---|---|
| Step-by-step verification protocol, canonical scoring cases, smoke scripts | `holey-buckets-validation-and-qa` |
| Safe localStorage schema changes, migration checklist, foliage→penalties precedent detail | `holey-buckets-round-data-safety` |
| PR-body template, README/config-comment house style | `holey-buckets-docs-and-writing` |
| WHY the architecture is shaped this way; invariants and weak points | `holey-buckets-architecture-contract` |
| What every config field means and how to add a course/field | `holey-buckets-config-catalog` |
| Full PR-by-PR decision history | `holey-buckets-history-and-decisions` |
| Build/run/deploy commands and traps | `holey-buckets-build-and-run` |
| Game rules and scoring semantics | `bucket-golf-reference` |

## Vocabulary (defined once)

- **Founder-editable**: `src/config/branding.ts`, `src/config/courses/*.ts`, and
  (since 2026-07-08) `src/config/sponsors/*.ts` are edited directly by the owner,
  Erin — a **non-developer**. They stay heavily commented, plain-English, no code
  knowledge required.
- **Bucket chip**: chipping the ball INTO the bucket; a binary −1 stroke bonus
  (`bucketChip` on `HoleScore`).
- **Net strokes**: `max(0, strokes − (bucketChip?1:0) + (penalties??0))` —
  computed ONLY in `src/lib/scoring.ts`.
- **trackBalls**: per-course flag (`Course.trackBalls`) enabling a per-player
  balls-used tally for per-ball billing. Never affects score.
- **Brand tokens**: the color/name/URL values in `src/config/branding.ts`,
  consumed by `tailwind.config.ts` (as the `brand` color namespace),
  `src/app/layout.tsx` (CSS vars), `src/lib/shareImage.ts`, and `src/lib/pdf.ts`.
- **390px render**: viewing every touched screen at a 390px-wide mobile
  viewport — the founder's phone width and the app's design target.

## 1. Change-classification table

Classify EVERY change before writing code. A PR should fall into ONE class
(split it if it doesn't — see §3). "Baseline evidence" = `npm run build` passes
(build includes ESLint + TypeScript type-check) + 390px render of touched screens.

| Class | Typical files | Gate | Required evidence in PR "Verified" section |
|---|---|---|---|
| **Config-only founder edit** | `src/config/branding.ts`, `src/config/courses/*.ts`, `src/config/sponsors/*.ts` (values only, not structure) | Lightest. Founder may edit directly. If YOU edit: preserve every comment and the plain-English style (non-negotiable #4) | `npm run build`; 390px look at `/`, `/course`, and one scoring screen if colors changed. `branding.ts` also feeds the share card + PDFs (non-negotiable #2): if colors changed, ALSO render the share card and open both PDFs (validation-and-qa §2.1 steps 6–7) |
| **UI / feature** | `src/app/**`, `src/components/**`, `src/app/globals.css` | Standard PR + **founder device-test before/at merge** (see §3). Respect design guardrails (non-negotiable #8) | Baseline + screenshots/described renders of every touched screen; tap targets still ≥56px (`.tap-target`) |
| **Scoring math** | `src/lib/scoring.ts`, `src/lib/course.ts`, anything computing or displaying a score | HIGH. All rule math stays in `scoring.ts` (non-negotiable #3). Load `holey-buckets-validation-and-qa` and run its canonical math cases | Baseline + hand-checked canonical cases + scorecard reconciliation (OUT + IN = TOTAL; to-par over played holes only) + a deliberate 2-way tie if ties/multi-player logic touched |
| **Storage schema** | `src/lib/storage.ts`, `Round`/`HoleScore` in `src/lib/types.ts`, `src/lib/round.ts` | HIGHEST. Route through `holey-buckets-round-data-safety` FIRST. Any change that could corrupt or drop an in-progress round needs an explicit, documented decision in the PR (non-negotiable #5) | Baseline + old-round compatibility statement ("a round saved before this change loads and reads as …") + the round-data-safety checklist |
| **Dependency** | `package.json` dependencies | Flag BEFORE adding; justify vs a zero-dep alternative; heavy deps must dynamic-import (§4) | Baseline + bundle-impact note + the rejected zero-dep alternative |
| **Deploy config** | `netlify.toml`, `next.config.mjs`, Next version pin | Rare and deliberate. Next is pinned 14.2.35 with documented accepted advisories (PR #1, 2026-06-26) — do not bump majors casually | Baseline + a successful Netlify deploy preview or an explicit rollback plan |
| **Types / registry** | `src/lib/types.ts` (non-Round parts), `src/config/courses/index.ts`, `src/lib/formats.ts` | Standard PR. New Course/Hole fields must stay optional so existing course files keep compiling | Baseline + confirmation `osceola.ts` still compiles unchanged. If `src/lib/types.ts` is touched at all, ALSO run `scoring-smoke.mjs` and see `ALL CASES PASS` (mandatory per validation-and-qa — types.ts is part of the scoring contract) |

The step-by-step execution of each evidence item — and the authoritative
change-class → runbook-step mapping — is owned by `holey-buckets-validation-and-qa`
(its §2.1 table). If this column and that table ever disagree, §2.1 wins; fix the
drift in the same PR.

Edge rules:
- A change touching two classes takes the **stricter** gate (e.g. a feature that
  adds a `HoleScore` field is a storage-schema change).
- `src/lib/pdf.ts` and `src/lib/shareImage.ts` are UI/feature class, but if they
  compute any score themselves instead of calling `scoring.ts` helpers, that is
  a scoring-math violation — reject.
- Structural changes to the two founder-editable files (renaming fields, adding
  required fields) are NOT config-only — they are types/registry or storage
  class, and must keep the files founder-editable afterward.

## 2. The non-negotiables (rule → why → history → how to comply)

1. **A course is data, never hardcoded.**
   Why: "the single most important architectural requirement" — the whole Phase-2
   plan (owner-created courses, multiple venues) depends on it.
   History: PR #2 (2026-06-26) established the course-as-data model.
   Comply: every component takes a `Course` object; course data lives ONLY in
   `src/config/courses/<id>.ts`; new courses register in
   `src/config/courses/index.ts` (`courses` array / `defaultCourse` /
   `getCourse(id)`). Grep check: no component may reference `osceola` or
   "Gray Duck" directly — only the registry.

2. **One branding file re-skins everything.**
   Why: brand tokens feed Tailwind, CSS vars, the canvas share card, AND the
   PDFs from one source, so they can never drift apart.
   History: PRs #1 and #6 (2026-06-26).
   Comply: never hardcode a brand hex/name/URL anywhere; add tokens to
   `branding.ts` and consume via `brand.colors.*` / Tailwind `brand-*` classes /
   the CSS vars published in `layout.tsx`.

3. **`scoring.ts` is the single source of truth for rule math.**
   Why: scoring screen, live leaderboard, `<Scorecard>` grid, share card, and
   PDF all read the same helpers "so they can't disagree".
   History: PRs #4, #10, #13 (2026-06-26).
   Comply: any surface showing a score imports `netStrokes` / `playerTotal` /
   `playerToPar` / `standings` / `winners` etc. from `src/lib/scoring.ts`.
   Never re-derive net strokes inline. Verified consumers as of 2026-07-02:
   `Scorecard.tsx`, `play/[roundId]/page.tsx`, `results/page.tsx`, `pdf.ts`,
   `shareImage.ts`.

4. **Founder-editable stays sacred** (founder-confirmed house rule).
   Why: the owner is a non-developer who edits `branding.ts` and
   `src/config/courses/*.ts` herself; that is the product's operating model.
   History: standing house rule; the files' own comments encode it ("you don't
   need to be a developer").
   Comply: edits to those files must preserve the comment blocks, plain-English
   field explanations, and simple literal-value style. No clever TypeScript, no
   computed values, no removing the editing instructions. README stays
   plain-English too.

5. **Never lose a live round** (founder-confirmed house rule).
   Why: a round lives ONLY in one phone's `localStorage`
   (`holeybuckets:round:<id>`, `holeybuckets:activeRoundId`); there is no
   recovery path.
   History: PR #9 (2026-06-26) changed `foliage: boolean` →
   `penalties: number`, which made older saved rounds read as penalty-free —
   accepted ONLY because rounds are ephemeral/local, and the PR documented the
   tradeoff explicitly. That is the required standard, not a license to repeat it.
   Comply: route ALL stored-shape changes through
   `holey-buckets-round-data-safety`; state old-round behavior explicitly in
   the PR; silent corruption or silent drop is an automatic reject.

6. **Every PR proves itself** (founder-confirmed house rule).
   Why: CI (since 2026-07-03) only proves the code compiles, lints, and passes
   the unit tests — the "Verified" section remains the only evidence layer for
   rendered screens, PDFs, and real-device behavior.
   History: house discipline across PRs #1–#15; e.g. PR #10 verified the
   scorecard by hand-reconciling OUT+IN=TOTAL (25+27=52/−2).
   Comply: §3 below.

7. **Dependency discipline** (observed convention, not founder-stated).
   Why: mobile-first app on backyard Wi-Fi/cell signal; bundle weight is a
   feature. Also fewer deps = fewer advisories on a pinned Next.
   History: §4 below.
   Comply: §4 below.

8. **Design-system guardrails** (from the founder's v2 feedback note; PRs #6–#7).
   Comply, always: sunshine yellow (`#F6B92C`) pairs with ink text, never white;
   penalties render in clay (`brand.colors.penalty`, `#E0682E`) WITH an explicit
   +/− sign, never red alone (colorblind-safe); uppercase only for short eyebrow
   labels; two fonts only (Bricolage Grotesque display, Figtree text); custom
   SVG icons from `src/components/icons.tsx`, never emoji in UI; interactive
   controls ≥56px via the `.tap-target` class in `globals.css`.

## 3. PR discipline

1. **Small, single-purpose PRs into `main`.** Work on a branch; merge via PR.
   One class of change per PR (split mixed diffs). Every merge to `main`
   triggers a Netlify rebuild+publish of the live site — there is no staging.
2. **Every PR body carries a "Verified" section** containing, at minimum:
   - Rendered at 390px: which screens, what you saw (screenshots or described
     renders — observations, not claims).
   - `npm run build` passes (this runs lint + type-check; expect
     "Linting and checking validity of types" then a 7-route output ending
     "Generating static pages").
   - Class-specific evidence from the §1 table (scoring spot-checks,
     old-round compatibility, PDF opened, etc.).
   The exact PR-body template lives in `holey-buckets-docs-and-writing` — use it.
3. **Founder device-testing before/at merge for feature PRs.** The founder plays
   the flow on her real phone. This is not optional ceremony: PR #14
   (2026-06-26) fixed a tie bug ("Erin wins!" shown when Erin & Laura both shot
   54·E) that desktop preview review missed and real-device play caught.
   Lesson: edge cases like ties ship until a human plays a real round.
4. **Merges are same-day, small batches** (historical pattern, PRs #1–#15, all
   merged same-day). Don't let a branch drift for days against a moving `main`.
5. No issue tracker is in use (0 issues as of 2026-07-02); the PR body is the
   record. Write it for the zero-context reader.

## 4. Dependency policy

Runtime deps as of 2026-07-02 (verify against `package.json`): `next` (pinned
`14.2.35`), `react`/`react-dom` ^18.3, `jspdf` ^4.2.1, `jspdf-autotable` ^5.0.8.
That is the complete list.

Rules, with precedent:

| Rule | Precedent |
|---|---|
| **Flag a dep before adding it** — propose in the PR (or earlier) with the problem, the dep, and the zero-dep alternative you rejected | jsPDF was pre-flagged in the PR #6 era and only added in PR #13 (2026-06-26) |
| **Prefer zero-dep solutions** | Share card is a hand-drawn 1080×1080 `<canvas>` PNG, no image library (PR #5); a QR-code library was declined in PR #11 — a text URL on the share card instead |
| **Dynamic-import heavy deps** so the main bundle stays light | `pdf.ts` does `await import("jspdf")` / `await import("jspdf-autotable")` only when the user clicks a download button (PR #13). Any future heavy dep follows this pattern |
| **Don't bump Next majors casually** | Next pinned at 14.2.35 since PR #1, with known DoS-class advisories explicitly accepted as not worth a major bump for a backend-less MVP. Re-litigate that decision in a dedicated deploy-config PR, not as a drive-by |
| Test-runner dep admitted | `vitest` became a devDependency (with the CI workflow) on 2026-07-03, commit 8b9f680 — the shape validation-and-qa §9 proposed. Further test/CI deps (e.g. playwright) still go through this gate |

## 5. What NEVER to do

1. **Never break founder-editability** of `src/config/branding.ts`,
   `src/config/courses/*.ts`, or `src/config/sponsors/*.ts` — no stripped
   comments, no required-field additions that break existing files, no logic
   in config.
2. **Never drop or corrupt a live round silently.** Any stored-shape change
   states its effect on pre-existing saved rounds in the PR, per
   `holey-buckets-round-data-safety`.
3. **Never hardcode a course.** No component references a specific course; all
   course data flows from `src/config/courses/` via the registry.
4. **Never bypass `scoring.ts`.** No inline score math anywhere — screen, PDF,
   share card, scorecard all call the same helpers.
5. **Never let brand tokens drift from `branding.ts`.** No literal brand hex
   codes, brand names, or the site URL hardcoded in components, canvas code, or
   PDFs.
6. **Never merge a feature the founder hasn't device-tested**, and never merge
   any PR without a "Verified" section backed by real observations.
7. **Never push to `main` directly** for behavior changes — `main` deploys live.

## Provenance and maintenance

Derived 2026-07-02 (repo commit aa4c527) from direct inspection of the source
files named above plus the repo's GitHub PR history (#1–#15; #1–#14 merged
2026-06-26, #15 on 2026-06-27 — all same-day merges) and the founder's
confirmed house rules. There has been no
major production incident to date — the history above is the complete
archaeology; do not invent war stories.

Re-verify before relying on volatile facts:

| Claim | One-line check |
|---|---|
| Runtime dep list / Next pin | `grep -A8 '"dependencies"' package.json` |
| Test suite + CI present | `ls .github/workflows; grep -E '"(test|vitest)"' package.json` (expect ci.yml; vitest + a test script) |
| jsPDF still dynamic-imported | `grep -n 'await import' src/lib/pdf.ts` |
| Share card still zero-dep | `grep -n '^import' src/lib/shareImage.ts` (only `./types`, `./scoring`, `@/config/branding`) |
| scoring.ts consumers | `grep -rn 'from ".*scoring"' src` (shareImage.ts imports it as `./scoring`, not `@/lib/scoring`) |
| No hardcoded course in components | `grep -rn 'osceola\|Gray Duck' src/app src/components` (expect no hits) |
| localStorage keys unchanged | `grep -n 'holeybuckets:' src/lib/storage.ts` |
| Brand tokens flow (no drift) | `grep -n 'branding' tailwind.config.ts src/app/layout.tsx src/lib/shareImage.ts src/lib/pdf.ts` |
| Netlify deploy config | `cat netlify.toml` (build `npm run build`, publish `.next`, plugin `@netlify/plugin-nextjs`) |
| Build passes + 7 routes | `npm run build` (7 incl. `/icon.svg` since 2026-07-03) |
| Founder-editable comments intact | `head -30 src/config/branding.ts src/config/courses/osceola.ts src/config/sponsors/osceola.ts` |
