---
name: holey-buckets-debugging-playbook
description: >
  Use when something in the Holey Buckets app (holeybucketsapp) LOOKS broken and
  you need to triage: "couldn't find that round" errors, scores that look wrong,
  tie/winner display issues, hydration/SSR errors, brand colors not applying,
  build failures, PDF or Share buttons misbehaving, or Netlify deploys differing
  from local. Gives symptom → likely cause → discriminating check → fix, with
  copy-paste console/shell checks, plus a list of things that look like bugs but
  are deliberate decisions. Do NOT use for: the routine pre-merge verification
  protocol (holey-buckets-validation-and-qa), changing the localStorage round
  schema safely (holey-buckets-round-data-safety), env setup / deploy pipeline
  reference (holey-buckets-build-and-run), or gating a fix you're about to ship
  (holey-buckets-change-control).
---

# Holey Buckets — Debugging Playbook

Symptom-first triage for this app's real failure modes, derived from how the code
actually works (repo state: commit aa4c527, 2026-07-02). This app has shipped
exactly ONE real bug so far — the tie bug, PR #14 (2026-06-26) — so most "bugs"
you'll be handed are actually deliberate behavior. **Check the [Traps](#traps-things-that-look-like-bugs-but-are-decisions) section before you change anything.**

## When to use this skill / When NOT to

- USE when: a user or founder reports broken behavior, an error appears in the
  console/build/deploy log, or output (scores, colors, PDFs, share cards) looks wrong.
- Do NOT use for: the manual QA protocol and evidence standards → `holey-buckets-validation-and-qa`.
  Changing the stored Round shape or migrating saved data → `holey-buckets-round-data-safety`.
  Setting up the environment, commands, routes, deploy reference → `holey-buckets-build-and-run`.
  Actually shipping any fix → `holey-buckets-change-control` (the gate for all behavior changes).
  Why the architecture is the way it is → `holey-buckets-architecture-contract`.
  The scoring rules themselves → `bucket-golf-reference`.

## Terms used below (defined once)

- **Round**: one group's game; a JSON object stored ONLY in the phone's `localStorage` (no backend, no accounts).
- **Net strokes / hole score**: `max(0, strokes − 1 if bucket chip + penalties)` — the big number on screen. Raw **strokes** is the stepper input.
- **Bucket chip**: chipping the ball INTO the bucket; a binary −1 bonus toggle.
- **Penalties**: a COUNT (+1 each: foliage/water/OB/lost ball), not a yes/no flag.
- **trackBalls**: per-course flag enabling a "Balls used" tally for per-ball billing; never affects score.
- **Founder-editable**: `src/config/branding.ts` and `src/config/courses/*.ts` are edited directly by the non-developer owner.
- **brand namespace**: Tailwind classes like `bg-brand-primary` generated from `branding.ts` via `tailwind.config.ts`.

## Master triage table

| # | Symptom | Likely cause | Discriminating check | Fix |
|---|---------|--------------|----------------------|-----|
| 1 | "We couldn't find that round on this device" | Round is on a *different* device/browser/profile, private mode, cleared storage, bad roundId in URL, corrupt JSON, or unknown `courseId` | `localStorage.getItem('holeybuckets:round:<id>')` in the console on the affected device | Usually not a bug — rounds are per-device by design. See [Case 1](#case-1) |
| 2 | Scores look wrong | Net-vs-raw confusion, seed-to-par, penalty count, floor-at-0, to-par over scored holes only | Hand-check against `src/lib/scoring.ts` canonical cases | Usually working as designed. See [Case 2](#case-2) |
| 3 | Wrong winner / tie displays badly | `winners()`/`joinNames()` in `src/lib/scoring.ts`, or caller not using them | Reproduce a deliberate 2-way tie on device | See [Case 3](#case-3) — the PR #14 worked example |
| 4 | "window is not defined" / hydration mismatch | `window`/`localStorage` touched outside `hasStorage()` or during render/SSR | Grep for unguarded `window.`/`localStorage` outside `src/lib/storage.ts` | Follow the loaded-state pattern. See [Case 4](#case-4) |
| 5 | Brand color/style change not applying | Tailwind bakes `branding.ts` at BUILD time; stale `.next`; class outside brand namespace | `rm -rf .next && npm run dev`; check `tailwind.config.ts` | See [Case 5](#case-5) |
| 6 | `npm run build` fails | Font fetch (network), type error (strict TS), lint error | Read WHICH build phase failed | See [Case 6](#case-6) |
| 7 | PDF button does nothing / errors | Dynamic `jspdf` chunk failed to load (network), or download blocked | DevTools Network tab: look for a failed chunk after the click | See [Case 7](#case-7) |
| 8 | Share button downloads a PNG instead of sharing | `navigator.canShare` unavailable (desktop / insecure context) — or user cancelled the share sheet | `navigator.canShare` in console | NOT a bug — designed fallback. See [Case 8](#case-8) |
| 9 | Netlify deploy differs from local | Netlify built with its own node/cache; local change never pushed | Read the Netlify deploy log; diff against `netlify.toml` | See [Case 9](#case-9) |

---

## Case 1: "We couldn't find that round on this device" {#case-1}

Rendered by `src/app/play/[roundId]/page.tsx` when the page has finished loading
but `!round || !course`. (The results page shows the shorter "We couldn't find
that round." — same logic, `src/app/play/[roundId]/results/page.tsx`.)

Rounds live ONLY in the device's `localStorage` under two keys (`src/lib/storage.ts`):
`holeybuckets:round:<id>` (the JSON Round) and `holeybuckets:activeRoundId`.
There is NO server copy. A round URL shared to another phone will always show this message.

**Triage, in order.** Open DevTools console *on the affected device/browser*:

```js
// 1. Is ANY Holey Buckets data here at all?
Object.keys(localStorage).filter(k => k.startsWith("holeybuckets:"))
// Expected when rounds exist: ["holeybuckets:activeRoundId", "holeybuckets:round:<uuid>", ...]

// 2. Is THIS round here? (roundId is the UUID in the /play/<roundId> URL)
localStorage.getItem("holeybuckets:round:" + location.pathname.split("/")[2])
```

| Check result | Cause | Fix |
|---|---|---|
| Step 1 returns `[]` | Wrong device/browser/profile, private/incognito mode (storage isolated or wiped on close), or "clear site data" happened | No recovery — cross-device rounds are Phase 2. Start a new round. |
| Step 1 has keys, step 2 returns `null` | Bad/foreign roundId in the URL (typo, link from another device) | Compare against `localStorage.getItem("holeybuckets:activeRoundId")` and navigate to `/play/<that id>`. |
| Step 2 returns a string, page still fails | (a) Unparseable JSON — `loadRound` returns `null` on `JSON.parse` failure, silently; or (b) round parses but its `courseId` isn't in the registry — `getCourse()` returns `undefined` and the page hits the same fallback | For (a): `JSON.parse(...)` the raw string in the console to see the error, then see `holey-buckets-round-data-safety`. For (b): `JSON.parse(localStorage.getItem("holeybuckets:round:" + location.pathname.split("/")[2])).courseId` must match an id in `src/config/courses/index.ts` (only `"osceola"` as of 2026-07-02). |

## Case 2: Scores look wrong {#case-2}

`src/lib/scoring.ts` is the single source of truth; screen, leaderboard,
scorecard grid, share card, and PDF all call it, so they cannot disagree with
each other — if one surface "disagrees", you're misreading the rules. The rules
(full domain detail: `bucket-golf-reference`):

```
net = max(0, strokes − (bucketChip ? 1 : 0) + (penalties ?? 0))
```

Five specific confusions, each with its check:

1. **Net vs raw strokes.** The big number per player is NET; the +/− stepper is
   raw strokes (min 1). When a chip or penalty is active, the scoring screen
   shows the math line ("3 strokes + 2 penalties = 5"). If someone says "the
   stepper says 3 but the score says 5", read the math line — that IS the answer.
2. **Auto-seed to par.** Landing on a hole seeds EVERY player's score for that
   hole to `{ strokes: holePar(hole) }` (useEffect in `src/app/play/[roundId]/page.tsx`).
   A player who never threw a ball on hole 7 still shows par for hole 7 if the
   group paged past it. Deliberate — "visiting a hole means it's in play" (PR #4, 2026-06-26). Not a bug.
3. **Penalties are a count.** Tapping "Penalty +1" three times = +3, not +1.
   The small corner "−" undo (visible only when penalties > 0) decrements.
4. **Floor at 0.** First-throw chip-in = `max(0, 1 − 1)` = 0. A zero is correct.
5. **To-par covers only scored holes.** `playerToPar` sums `net − par` over holes
   with a stored score, never all 18 (explicit founder P1 demand, PR #6). Mid-round
   "E" after 5 holes means even through 5, not through 18. Unscored holes render "–" (stone gray) in the scorecard grid.

**Discriminating check** — dump a player's raw stored scores and recompute by hand:

```js
const r = JSON.parse(localStorage.getItem("holeybuckets:round:" + location.pathname.split("/")[2]));
r.players.map(p => [p.name, r.scores[p.id]]);
// Each hole entry: { strokes, bucketChip?, penalties? }. Apply the net formula per hole; sum.
```

Canonical cases to check against (from PR #4, verified against `netStrokes`):
plain par-3 = 3 · chip-in on 2nd throw = 1 · 3 strokes + 1 penalty = 4 ·
chip + penalty cancel = 3 · first-throw chip-in = 0.

Latent inconsistency (code-verified 2026-07-02, currently unobservable): `updateScore`
in the play page falls back to hardcoded `{ strokes: 3 }` while the seed effect uses
`holePar(hole)` — only matters if a hole ever overrides `par` and a tap races the seed.

## Case 3: Tie / winner display issues {#case-3}

**The one real shipped bug** (PR #14, 2026-06-26): the founder's real-device round
ended Erin 54·E, Laura 54·E — and the results hero said "Erin wins!". The code
took `standings()[0]` as sole winner. Desktop preview review missed it because
nobody had produced a tie. Fix: `winners(board)` returns ALL rows sharing the best
(lowest) total; callers detect a tie via `length > 1`; `joinNames()` formats
("Erin", "Erin & Laura", "Erin, Laura & Sam"). The results hero shows "It's a tie!"
and the share card shows "TIE". Lesson baked into the QA protocol: any change to
winner/standings logic must be tested with a deliberate 2-way tie **on a device**.

Where the logic lives (all in `src/lib/scoring.ts`, consumed by
`results/page.tsx` and `src/lib/shareImage.ts`):

- `standings()` sorts lowest-total-first; equal totals SHARE a rank. Rank is
  `i + 1` unless the total matches the row above, so a 2-way tie at rank 1 puts
  the next player at rank 3. Two "1"s followed by a "3" is correct.
- `winners()` assumes its input is already standings-sorted (it reads `board[0].total`).
  If you ever call it with an unsorted array, it silently returns garbage — that
  is the regression to guard.

**Fastest tie repro** (uses seed-to-par): start a round with 2 players, tap
"Next hole →" through all 18 holes touching nothing, tap "Finish round →".
Both players are 54·E → hero must say "It's a tie!" and name both.

## Case 4: Hydration / SSR errors {#case-4}

Symptoms: `ReferenceError: window is not defined` (build or server log),
`localStorage is not defined`, or React hydration-mismatch warnings in the browser console.

The app's two defenses — any violation of them is your bug:

1. **`hasStorage()` guard**: every function in `src/lib/storage.ts` starts with
   `if (!hasStorage())` (checks `typeof window !== "undefined"`). Never touch
   `localStorage` anywhere else.
2. **The loaded-state pattern** (both `play/[roundId]/page.tsx` and its
   `results/page.tsx`): the component is `"use client"`, renders "Loading round…"
   while `loaded === false`, calls `loadRound` ONLY inside a `useEffect`, then
   `setLoaded(true)`. Server render and first client render therefore match
   (both show the loading state); storage is read only after hydration.

**Discriminating check** — find unguarded browser-global access:

```bash
grep -rn "localStorage" src/ | grep -v "src/lib/storage.ts"
# Expected as of 2026-07-02: no matches (comments aside).
grep -rn "window\." src/ | grep -v "src/lib/storage.ts"
# Expected: only window.scrollTo in play/[roundId]/page.tsx, guarded by typeof window !== "undefined".
```

If a new component reads a round during render, or a server component (no
`"use client"`) imports storage-reading code that runs at module top level, you
get this class of error. Fix = move the read into a `useEffect` behind a loaded flag.

## Case 5: Brand color / style not applying {#case-5}

`src/config/branding.ts` feeds FOUR consumers; know which one is stale:

| Consumer | Binding time | Symptom when stale |
|---|---|---|
| `tailwind.config.ts` → `brand` color namespace (`bg-brand-primary` etc.) | BUILD time (dev server usually hot-picks it up) | UI classes show old colors |
| `src/app/layout.tsx` → CSS vars (`--fairway-green`, `--penalty-clay`, …) | render of root layout | anything styled via the CSS custom properties |
| `src/lib/shareImage.ts` (canvas) | runtime, per click | share card colors |
| `src/lib/pdf.ts` | runtime, per click | PDF colors |

Triage checklist:

1. **Stale `.next`**: `rm -rf .next && npm run dev` (or `npm run build`). The dev
   server usually reflects `branding.ts` edits, but a stale build cache is the
   first suspect when it doesn't.
2. **Class outside the brand namespace**: only `brand.colors` keys become
   `*-brand-<key>` classes. `bg-brand-orange` silently produces nothing if
   `orange` isn't a key. Check the mapping: `theme.extend.colors.brand = brand.colors`
   in `tailwind.config.ts` — keys as of 2026-07-02: primary, deepPine, sunshine,
   bucketBlue, cream, card, ink, stone, line, penalty.
3. **Dynamically-built class names**: Tailwind scans source text
   (`content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"]`); a class name assembled at
   runtime (`"bg-brand-" + tone`) is never generated. Write full literal class strings.
4. **CSS-var path**: if a style uses `var(--sunshine)` etc., confirm the token is
   in the `cssTokens` object in `layout.tsx` — that list is maintained by hand.
5. **Live site unchanged**: Netlify only rebuilds on push to `main` (Case 9).

Full config-field reference: `holey-buckets-config-catalog`. Do not add colors to
`tailwind.config.ts` directly — the file's own comment says "Change colors there
[branding.ts], not here" (non-negotiable: one branding file re-skins everything).

## Case 6: Build failures {#case-6}

`npm run build` phases, in order, as printed (verified 2026-07-02, Next.js 14.2.35):

```
Creating an optimized production build ...   ← webpack compile: syntax/import errors die here
✓ Compiled successfully
Linting and checking validity of types ...   ← ESLint (next/core-web-vitals) + tsc strict: most failures die here
Collecting page data ...
Generating static pages (9/9)                ← prerender: SSR-unsafe code (Case 4) dies here
Finalizing page optimization ...
[route table: 10 routes — /, /_not-found, /course, /how-to-play, /icon.svg, /start static; /courses/[courseId] SSG; /admin/[key] and the two /play routes dynamic]
```

The three real failure classes for THIS repo:

1. **Font fetch**: `layout.tsx` loads Bricolage Grotesque + Figtree via
   `next/font/google`, which downloads them AT BUILD TIME. No network path to
   Google Fonts → the build fails during compile with a font-fetch error. Fix
   the network (or proxy); do not swap the fonts to dodge a CI hiccup — the
   two-font kit is a design non-negotiable.
2. **Type errors**: `tsconfig.json` is `strict: true` and the build type-checks
   everything. Read the file:line in the error; there is no `ignoreBuildErrors` escape configured.
3. **Lint errors**: `next lint` config is `.eslintrc.json` extending
   `next/core-web-vitals`. Run `npm run lint` alone to iterate faster than full builds.

Since 2026-07-03 there is a vitest suite (`npm test`) and a GitHub Actions CI
(`.github/workflows/ci.yml`) — run `npm test` when triaging lib-level suspicions.
Rendered surfaces are still uncovered; a green build + tests is the entire
automated gate.

## Case 7: PDF button does nothing / errors {#case-7}

Both PDF buttons ("Download scorecard (PDF)" on results; the blank-scorecard
button via `src/components/PrintBlankButton.tsx`) call `src/lib/pdf.ts`, which
imports `jspdf` and `jspdf-autotable` **dynamically on click** (deliberate
bundle-weight rule, PR #13). Two failure modes:

1. **Chunk fetch fails** (offline / flaky signal — likely at a backyard course):
   the dynamic `import()` rejects, console shows `ChunkLoadError` / "Failed to
   fetch dynamically imported module", nothing downloads.
   **Check**: DevTools → Network tab → click the button → look for a red/failed
   `.js` chunk request right after the click (it's the jspdf chunk). Retry with signal.
2. **Download blocked**: `doc.save(...)` triggers a file download; a pop-up/download
   blocker or iOS quirk can swallow it silently.
   **Check**: Network shows the chunk loaded OK and no console error → it's the
   browser's download handling, not the app.

Expected filenames on success: `Holey Buckets - <course name> - blank scorecard.pdf`
and `Holey Buckets - <group name> scorecard.pdf`.

## Case 8: Share button falls back to download — NOT a bug {#case-8}

`shareImage()` in `src/lib/shareImage.ts`: if `navigator.canShare(shareData)` is
truthy it opens the native share sheet; otherwise it downloads the PNG. Designed
fallback (PR #5). Downloads instead of sharing whenever:

- **Desktop browser** — file-sharing via Web Share is mostly mobile.
- **Insecure context** — Web Share requires HTTPS (localhost is exempt).
- **User cancelled the share sheet** — verified in code: the `catch` around
  `navigator.share` falls through to `downloadImage`, so cancelling the sheet
  ALSO produces a download. Looks odd; it is the coded behavior as of 2026-07-02.

**Check** (console on the affected device):

```js
navigator.canShare && navigator.canShare({ files: [new File([""], "t.png", { type: "image/png" })] })
// true  → share sheet should appear; a download means the user cancelled or share threw
// false/undefined → download fallback is correct behavior
```

Also: both Share and Save buttons are `disabled` until the canvas blob is built
("Making your card…" placeholder). A briefly-dead button right after page load is loading, not broken.

## Case 9: Netlify deploy differs from local {#case-9}

The contract is `netlify.toml` (repo root): build `npm run build`, publish
`.next`, plugin `@netlify/plugin-nextjs`. Every push to `main` on GitHub
triggers rebuild + publish. Live URL as of 2026-07-02: `holeybuckets.netlify.app`
(= `brand.siteUrl`; real domain not yet chosen).

Triage order:

1. **Was it pushed?** `git log origin/main -1 --oneline` vs your local commit.
   Local-only changes never deploy.
2. **Read the deploy log** (Netlify dashboard → Deploys → the deploy → log).
   You should see the same phases as Case 6. A red deploy = Case 6 remotely
   (font fetch and type errors reproduce identically there).
3. **Netlify's cache/node differ from local.** Netlify uses its own build cache
   and its own Node version (nothing in `netlify.toml` pins one — which version
   it currently selects is unverified). For stale output: "Clear cache and deploy site".
4. **Branding/course config changes** are baked at build time (Case 5) — they
   appear on the live site only after a push-triggered rebuild, never instantly.

## Traps: things that LOOK like bugs but are decisions

Check here FIRST. Each has a durable citation; do not "fix" these without going
through `holey-buckets-change-control`.

| Looks like | Actually | Basis |
|---|---|---|
| Player who skipped a hole still has par on it | Seed-to-par: visiting a hole puts everyone in play at par | PR #4 (2026-06-26), decision |
| Share card missing players 6+ | Card shows TOP 5 only, for readability; founder chose to keep it | PR #5 |
| "Balls used" doesn't change the score | Ball tally is per-ball BILLING data, never score; also not coupled to penalties (lost ball ≠ penalty) | PR #9 |
| Only Stroke Play selectable; others "coming soon" | Only `strokePlay` has `available: true` in `src/lib/formats.ts`; rest are Phase 2 | formats catalog |
| Cancelling the share sheet downloads a PNG | The share `catch` falls through to download | code, `shareImage.ts` |
| "Rounds aren't saved" banner / round gone after clearing browser | MVP is localStorage-only, no backend by design; banner nudges screenshot/share/PDF | architecture (see `holey-buckets-architecture-contract`) |
| "Book your round" button nowhere in UI | `brand.bookingCta` is configured but not yet rendered — Milestone 7 | verified by grep, 2026-07-02 |
| Hole names/distances/hazards seem made up | `osceola.ts` hole data is PLACEHOLDER until the owner's worksheet arrives; the file says so | course file comment |
| Pinch-zoom doesn't work | `maximumScale: 1` in layout viewport — locked so scoring feels like an app | `layout.tsx` comment |
| Strokes stepper won't go below 1 | Min-1 clamp in the stepper; zeros come from the chip bonus, not raw strokes | play page code |
| Two players both ranked "1", next is "3" | Ties share a rank in `standings()` | `scoring.ts` |
| Leaderboard starts at "E" on hole 1 | Seed-to-par + to-par-over-scored-holes: everyone starts even | PRs #4, #6 |

## Provenance and maintenance

Derived 2026-07-02 by direct reading of the source at commit aa4c527 (all files
named above), a passing local `npm run build` (phase output captured verbatim),
and the GitHub PR history #1–#15 (notably #4 seed-to-par, #5 share card, #9
penalties/balls, #13 PDFs, #14 tie bug). The founder confirmed there are no
unrecorded incidents: PR #14 is the only shipped bug to date.

Re-verify before trusting, if the repo has moved past aa4c527:

| Claim | One-line re-check |
|---|---|
| localStorage keys & null-on-parse-failure | `grep -n "holeybuckets" src/lib/storage.ts` |
| Net-strokes formula & floor | `grep -n -A3 "const net" src/lib/scoring.ts` |
| Seed-to-par effect | `grep -n "strokes: holePar" "src/app/play/[roundId]/page.tsx"` |
| Tie handling wired | `grep -rn "winners\|joinNames" src/app src/lib/shareImage.ts` |
| hasStorage guard intact | `grep -n "hasStorage" src/lib/storage.ts` |
| Tailwind ← branding mapping | `grep -n "brand" tailwind.config.ts` |
| Brand color keys | `grep -n -A20 "colors: {" src/config/branding.ts` |
| Fonts fetched at build | `grep -n "next/font/google" src/app/layout.tsx` |
| jspdf dynamic import | `grep -n "await import" src/lib/pdf.ts` |
| Share fallback logic | `grep -n -B2 -A8 "canShare" src/lib/shareImage.ts` |
| Netlify contract | `cat netlify.toml` |
| Route list & build phases | `npm run build` (expect 10 routes; play routes dynamic) |
| Tests + CI present (since 2026-07-03) | `ls .github/workflows; grep -c test package.json` |
| bookingCta still unused | `grep -rn "bookingCta" src/ --include="*.tsx"` (expect no matches) |
| Live URL | `grep -n "siteUrl" src/config/branding.ts` |
