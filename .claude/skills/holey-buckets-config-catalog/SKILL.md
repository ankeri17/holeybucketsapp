---
name: holey-buckets-config-catalog
description: Catalog of every configuration axis in the Holey Buckets app — branding.ts fields and colors, Course/Hole data fields, per-course sponsors, FORMATS availability flags, DEFAULT_PAR — with defaults, current values, exactly which code consumes each one, production-vs-scaffolded status, and step-by-step checklists to add a course, add a field, or change a brand color. Use when editing or auditing any config value, adding a new course, flipping a format flag, rebranding, or answering "where is X configured / who reads this field / is this used yet?". Do NOT use for what the fields mean in bucket-golf terms (see bucket-golf-reference), for why config stays founder-editable or how to get a change approved (see holey-buckets-change-control), or for build/deploy commands (see holey-buckets-build-and-run).
---

# Holey Buckets — Configuration Catalog

Every knob in the app, what it currently says, who reads it, and how to change it safely.
Verified against the repo at commit `aa4c527` on 2026-07-02. All paths are relative to repo root.

**The entire config surface is 7 files:**

| File | What it configures | Founder-editable? |
|---|---|---|
| `src/config/branding.ts` | Name, tagline, umbrella brand, site URL, all colors, booking CTA | YES — designed for a non-developer |
| `src/config/courses/osceola.ts` | The flagship course ("The Gray Duck") — all hole data | YES — designed for a non-developer |
| `src/config/sponsors/osceola.ts` | The Gray Duck's sponsors (hole + digital tiers, the `lapsed` kill switch) — SAMPLE data as of 2026-07-08 | YES — designed for a non-developer |
| `src/config/courses/index.ts` | Course registry: `courses[]`, `defaultCourse`, `getCourse(id)` | Engineer only |
| `src/config/sponsors/index.ts` | Sponsor registry: `sponsorsByCourse`, `getSponsors(courseId)`, loud build/load validation | Engineer only |
| `src/lib/formats.ts` | `FORMATS` catalog (with `available` flags), `DEFAULT_FORMAT` | Engineer only, via change control |
| `src/lib/types.ts` | `DEFAULT_PAR` + the `Course`/`Hole`/`Round` type contract | Engineer only, via change control |

"Founder-editable" = the owner (Erin, a non-developer) edits the file directly; it must stay
heavily commented and plain-English (house rule — rationale in **holey-buckets-change-control**).

## When to use this skill

- You need to know where a value lives, what it's currently set to, or which code consumes it.
- You're adding a course, adding a field to `Course`/`Hole`, changing a color, or flipping a format flag.
- You're auditing which config is real (production) vs scaffolded (Phase-2 placeholder, unread by any code).

## When NOT to use (siblings own these)

- Rule semantics (what a bucket chip / penalty / net score IS) → **bucket-golf-reference**.
- Whether a change is allowed and how to prove it → **holey-buckets-change-control** (the gate for anything behavior-changing; nothing here overrides it).
- Design invariants and why the config is shaped this way → **holey-buckets-architecture-contract**.
- Round/localStorage schema changes → **holey-buckets-round-data-safety**.
- Running/deploying → **holey-buckets-build-and-run**. QA steps → **holey-buckets-validation-and-qa**.

---

## 1. branding.ts — the one-file re-skin

`src/config/branding.ts` exports `brand` (`as const`). Three consumers wire it everywhere:
`tailwind.config.ts` (exposes every color as `bg-brand-primary`, `text-brand-stone`, etc.),
`src/app/layout.tsx` (publishes colors as CSS custom properties, e.g. `--fairway-green`),
and `src/lib/shareImage.ts` + `src/lib/pdf.ts` (canvas/PDF drawing colors). Change colors in
branding.ts, never in tailwind.config.ts.

### Text fields (current values as of 2026-07-02)

| Field | Current value | Consumed by (verified by grep) | Founder-safe? |
|---|---|---|---|
| `name` | `"Holey Buckets"` | `layout.tsx` (page title/description), `icons.tsx` (LogoLockup wordmark), `pdf.ts` (PDF header), `shareImage.ts` (share-card header) | Yes |
| `tagline` | `"Backyard golf for everyone."` | `layout.tsx` (page title), `page.tsx` (landing hero) | Yes |
| `umbrellaBrand` | `"Four Irons"` | **Nothing reads it directly** — only `umbrellaCredit` is rendered. Keep the two in sync manually. | Yes |
| `umbrellaCredit` | `"A Four Irons Game"` | `page.tsx` (landing footer), `shareImage.ts` (share-card footer) | Yes |
| `siteUrl` | `"holeybuckets.netlify.app"` | `shareImage.ts` only (share-card footer, bucketBlue — the acquisition hook). Shown without `https://`. Repoint when a real domain lands (launch item — see **holey-buckets-launch-campaign**). | Yes |
| `bookingCta.label` | `"Book your round"` | **NOT rendered anywhere as of 2026-07-02** — verified: zero hits for `bookingCta` in `src/` outside branding.ts. Reserved for Milestone 7. The URL (`https://helloagainproperties.com`) is itself a placeholder per the file's own comment. | Yes (harmless until M7 consumes it) |
| `bookingCta.url` | `"https://helloagainproperties.com"` (placeholder) | Same — unused. | Yes |

### Colors (all 10) — hex, semantics, consumers

Usage semantics come from the comments in branding.ts plus the design guardrails
(sunshine always pairs with ink text, never white; penalties are clay + explicit sign, never red alone —
history in **holey-buckets-change-control**).

| Token | Hex | Usage semantics | Main consumers (beyond tailwind/layout/CSS vars) |
|---|---|---|---|
| `primary` | `#1E9B4E` | Fairway green — primary buttons, active toggles, under-par scores, themeColor | Every page; `Scorecard.tsx` (under-par), `pdf.ts` (header band, table head), `shareImage.ts` (header band) |
| `deepPine` | `#14622F` | Pressed/hover green; green text on cream | landing, play page, `PrintBlankButton.tsx`, `shareImage.ts` |
| `sunshine` | `#F6B92C` | Secondary CTA, highlights, celebration — **ink text on it, never white** | landing, play (Finish button), results (winner hero), `shareImage.ts` (winner box) |
| `bucketBlue` | `#2E9BD6` | Playful accent, links, "chipped in" moments | play page (chip-in toggle), landing, `shareImage.ts` (siteUrl line) |
| `cream` | `#F7F3E8` | App background | `globals.css` body bg; sticky bars, `pdf.ts` (par-row fill), `shareImage.ts` |
| `card` | `#FFFFFF` | Card / surface backgrounds | all pages (`bg-brand-card`) |
| `ink` | `#1B1C18` | Primary text and headings; even-par scores; text on sunshine | everywhere; `pdf.ts`, `shareImage.ts` |
| `stone` | `#6E6E66` | Secondary text, labels, captions; unscored "–" | everywhere; `pdf.ts`, `shareImage.ts` |
| `line` | `#E6E0D2` | Borders/dividers on cream | all pages, `Scorecard.tsx`, `pdf.ts` (table lines) |
| `penalty` | `#E0682E` | Clay — penalties (+1), over-par scores, hazard callouts, difficulty pips. Deliberately not red. | play page (penalty button), `Scorecard.tsx` (over-par), course page (hazards + DifficultyMeter pips) |

CSS-variable names published by `layout.tsx` differ from token names: `primary`→`--fairway-green`,
`cream`→`--canvas-cream`, `card`→`--card-white`, `penalty`→`--penalty-clay`; the rest map 1:1
(`--deep-pine`, `--sunshine`, `--bucket-blue`, `--ink`, `--stone`, `--line`).

---

## 2. Course + Hole fields (src/lib/types.ts)

Data contract for every course. Current sole course: `src/config/courses/osceola.ts` — its hole
data (names, paces, hazards) is **invented placeholder** until the owner's worksheet arrives; the
file says so at the top. Registry: `src/config/courses/index.ts` (`courses = [osceola]`,
`defaultCourse = osceola`). There is NO course-selection UI — the start page hardcodes
`defaultCourse`.

### Course fields

| Field | Required? | Osceola value | Status (verified 2026-07-02) |
|---|---|---|---|
| `id` | required | `"osceola"` | USED — links `Round.courseId` back to the course via `getCourse()` (play + results pages) |
| `name` | required | `"The Gray Duck"` | USED — every page, PDFs, share card |
| `location` | required | `"Osceola, WI"` | USED — course/start pages, PDFs, share card |
| `host` | optional | `"Hello Again Properties"` | USED — course-page hero overlay. Per-course, not a global brand |
| `code` | optional | `"grayduck"` | **Phase-2 scaffold, unread by any code** — reserved for "enter a course code" / QR join. Also the conventional asset folder name (see checklist below) |
| `isPublic` | optional | `true` | **Phase-2 scaffold, unread by any code** — public listing for owner-created courses later |
| `trackBalls` | optional (off when omitted) | `true` | **USED** — gates the "Balls used" stepper on the play page and the Balls-used section on results. Round-level per-player tally for per-ball billing; never affects score (see **bucket-golf-reference**) |
| `heroImage` | optional | `"/courses/grayduck/hero.svg"` | USED — course-page hero. Current file is a branded SVG placeholder (PR #12, 2026-06-26: real photos were view-only). Real photo is a drop-in |
| `holes` | required | 18 holes | USED everywhere |

### Hole fields

| Field | Required? | Default | Status |
|---|---|---|---|
| `number` | required | — | USED — the only required hole field |
| `name` | optional | omitted → not rendered | USED — course page, play-page hole header |
| `par` | optional | `DEFAULT_PAR` (3) via `holePar()` | USED — **no Osceola hole sets it today**; see §4 |
| `distancePaces` | optional | omitted → not rendered | USED — "N paces" on course + play pages |
| `hazards` | optional | omitted → not rendered | USED — "Heads up: …" (penalty clay on course page; white-on-green on play page) |
| `difficultyRank` | optional | omitted → no pips | **Pips-only today** — drives the 5-pip DifficultyMeter on the course page (`level = clamp(ceil(((total−rank+1)/total)·5), 1, 5)`; 1 = hardest). Reserved for the Phase-2 handicap system |
| `teeLocation` | optional | — | **Phase-2 scaffold, unread by any code** |
| `note` | optional | omitted → not rendered | USED — italic tip on course + play pages |
| `teePhoto` | optional | falls back to `/placeholder-tee.svg` | USED — thumbnail (course page) and banner (play page), both via `hole.teePhoto ?? TEE_PLACEHOLDER`. No Osceola hole sets it today, so every hole shows the SVG placeholder |

The scaffold fields (`code`, `isPublic`, `teeLocation`) were added deliberately in PR #8
(2026-06-26): "cheap now, painful to retrofit". Do not delete them as dead code.

---

## 3. FORMATS and DEFAULT_FORMAT (src/lib/formats.ts)

`FORMATS: FormatOption[]` — each entry: `id` (a `ScoringFormat`), `label`, `blurb`,
`available: boolean`. As of 2026-07-02 only `strokePlay` has `available: true`; `matchPlay`,
`skins`, `fiveThreeOne`, `teamBestBall`, `pigAndWolf` are `false`.
`DEFAULT_FORMAT = "strokePlay"`.

Known quirk: `teamAlternateShot` exists in the `ScoringFormat` type union (`src/lib/types.ts`)
but has NO entry in the `FORMATS` list, so it can never be picked in the UI.

**How the start page renders it** (`src/app/start/page.tsx`): available formats become selectable
cards (`FORMATS.filter((opt) => opt.available)`); the rest are joined into one quiet line —
"More formats coming soon — Match Play, Skins, 5-3-1, Team Best Ball, Pig & Wolf."

**How to flip a format on:** set its `available: true`. That is the whole mechanism — and that is
the trap:

> **WARNING — flipping `available: true` does NOT implement the format's scoring.**
> `src/lib/scoring.ts` never reads `round.format` (verified: zero references), and neither does the
> play page. A round started as "Skins" would be scored with stroke-play math, silently, with a
> "Skins" label on it. Flipping a flag is therefore a behavior change: build the format's scoring
> first, then flip, and route the whole thing through **holey-buckets-change-control**. Never flip
> a flag as a "quick win". Format rule semantics live in **bucket-golf-reference**.

---

## 4. DEFAULT_PAR and per-hole par override

- `DEFAULT_PAR = 3` in `src/lib/types.ts` — bucket golf's "every hole is a par 3" rule.
- Resolution is centralized in `src/lib/course.ts`: `holePar(hole) = hole.par ?? DEFAULT_PAR`;
  `coursePar(course)` sums `holePar` over all holes. Every consumer (course page, play page
  auto-seed-to-par, `Scorecard.tsx`, `pdf.ts`, `scoring.ts` to-par math) goes through `holePar` —
  never read `hole.par` directly.
- To override one hole: add `par: 4` (or any number) to that hole's object in the course file.
  No Osceola hole overrides par today, so course par is 54.
- Changing `DEFAULT_PAR` itself changes scoring behavior app-wide (auto-seed values, to-par) —
  change-control territory, not a config tweak.

---

## 5. Checklists

### 5a. Add a new course

1. Create `src/config/courses/<id>.ts` copying `osceola.ts`'s shape AND its comment style — the
   file must stay editable by a non-developer (house rule; templates in
   **holey-buckets-docs-and-writing**). Set `id`, `name`, `location`, and optionally `host`,
   `code`, `isPublic`, `trackBalls` (only if the venue bills per ball), `heroImage`, and 1–18 holes.
2. Register it in `src/config/courses/index.ts`: import it and add to the `courses` array.
   Decide whether it should become `defaultCourse` — remember the start page has no course picker
   and uses `defaultCourse` for every new round, so swapping the default swaps what everyone plays.
3. Assets: create `/public/courses/<code>/` and drop the hero image there; point `heroImage` at
   `/courses/<code>/<file>`. Per-hole `teePhoto` paths likewise; omit them to get
   `/placeholder-tee.svg` automatically. (Convention set by `/public/courses/grayduck/hero.svg`.)
4. Verify: `npm run build` passes (it type-checks the course object against `Course`); then view
   `/course` and start a round at 390px width and check hero, per-hole cards, par totals, and —
   if `trackBalls: true` — the Balls-used stepper on `/play/...`. Full protocol:
   **holey-buckets-validation-and-qa**.

### 5b. Add a field to Course or Hole

1. Add it to the interface in `src/lib/types.ts` with a doc comment stating what it is, whether
   optional, and its default. Prefer optional — every existing course file must keep compiling.
2. Populate it in `src/config/courses/osceola.ts` **and update that file's founder-facing "How to
   edit a hole" comment block** — the comment discipline is a house rule, not a nicety.
3. Wire consumers (or none — scaffold fields like `code` are legitimate, but label them Phase-2 in
   the comment so the next reader knows they're intentionally unread).
4. This touches the data contract → route through **holey-buckets-change-control**; if the field
   ends up inside `Round`/`HoleScore` (localStorage shape) also read
   **holey-buckets-round-data-safety** first.
5. `npm run build` must pass; render the touched screens at 390px.

### 5c. Add, lapse, or replace a sponsor (added 2026-07-08)

1. Everything the founder needs is in `src/config/sponsors/osceola.ts` (or the future course's
   own sponsor file) — the file's comment block is the manual. Adding a sponsor = one object in
   that file + one logo dropped in `/public/sponsors/`. Nothing else.
2. Kill switch: set `status: "lapsed"` — that ONE edit removes the sponsor from every placement
   (hole band, rotating slots, scorecard footnote, both PDFs). No other change needed or allowed.
3. Guardrails enforced at build/load (`src/config/sponsors/index.ts` throws): one active hole
   sponsor per hole, `holeId` must exist on the course, unique sponsor ids. A bad config FAILS
   `npm run build` on purpose.
4. A missing/broken logo never breaks a screen — the sponsor's name renders as styled text.
5. Full field reference + consumers: section 6 below. Placement components live in
   `src/components/sponsors/`; PDF placements in `drawSponsorFooters()` (`src/lib/pdf.ts`).

### 5d. Change a brand color

1. Edit the hex in `src/config/branding.ts` — the ONLY file to touch (`tailwind.config.ts` reads
   it; do not edit colors there).
2. Then LOOK, because the token fans out four ways:
   - **Tailwind classes** (`bg-brand-*` / `text-brand-*` / `border-brand-*`) — every page.
   - **CSS variables** from `layout.tsx` (used by `icons.tsx` logo and any inline styles).
   - **Share card** — generate a share image on `/play/<id>/results` (canvas colors come from
     `brand.colors` at draw time).
   - **PDFs** — download both the blank and results scorecards (`pdf.ts` converts the hex via
     `hexToRgb`).
3. Respect the guardrails: sunshine backgrounds keep ink text; penalty stays a non-red hue with
   an explicit +/− sign (colorblind-safe). Contrast-check any darkened/lightened neutral.
4. `npm run build`; eyeball landing, course, start, play, results at 390px.

---

## 6. Sponsors (src/config/sponsors/) — added 2026-07-08

Sponsors follow the courses-as-data pattern exactly: per-course data files + a registry, no
component knows a specific sponsor. Types live in `src/lib/types.ts` (`Sponsor`, `SponsorTier`,
`SponsorStatus`); pure helpers in `src/lib/sponsors.ts` (`activeSponsors`, `activeHoleSponsors`,
`activeDigitalSponsors`, `holeSponsor`, `validateSponsors`).

### Sponsor fields

| Field | Required? | Notes |
|---|---|---|
| `id` | required | unique slug; duplicates fail the build |
| `name` | required | also the styled-text fallback when the logo is missing/broken |
| `logoUrl` | optional | `/sponsors/<file>.png` in `/public/sponsors/` |
| `tier` | required | `"hole"` or `"digital"` |
| `status` | required | `"active"` shows everywhere; `"lapsed"` is the kill switch (hides everywhere) |
| `holeId` | required for `tier: "hole"` | the hole's `number`; must exist on the course; one ACTIVE sponsor per hole |
| `url` | optional | placements link out (`target="_blank" rel="noopener"`), app only |
| `termStart` / `termEnd` | optional | informational only in the MVP (no date logic reads them) |

### Placements (who consumes sponsor data)

| Placement | Component / function | Where it shows |
|---|---|---|
| Hole band ("Hole presented by …") | `src/components/sponsors/HoleSponsorBand.tsx` | scoring screen, under the hole header, sponsored hole only |
| Rotating digital slot | `src/components/sponsors/DigitalSponsorSlot.tsx` | home + results; one random active digital sponsor per page load |
| Scorecard footnote ("Hole 7 presented by …") | `src/components/sponsors/ScorecardSponsorRow.tsx` | results page, under the scorecard grid |
| PDF footnote + "THANKS TO OUR SPONSORS" strip | `drawSponsorFooters()` in `src/lib/pdf.ts` | both PDFs (blank + results), under the table |

Zero active sponsors → all four render nothing (no placeholders). Sample data (4 made-up
sponsors, one lapsed) ships as of 2026-07-08 and is labeled SAMPLE in the config file.
Not built (deliberate, 2026-07-08 change request): Stripe/webhooks, admin UI, self-serve
signup, click tracking (hook locations documented in `REVIEW.md`).

---

## Provenance and maintenance

Derived 2026-07-02 by the retiring principal engineer from direct inspection of the repo at commit
`aa4c527` (every "consumed by" claim re-verified by grep on that date) plus the PR history
(PRs #1–#15, GitHub, 2026-06-26 onward). Nothing here is speculative except items explicitly
labeled Phase-2/placeholder — which mirror the repo's own comments.

Flags and "unused" claims drift. Re-verify before relying on them:

| Claim | One-liner (run at repo root) | Expected as of 2026-07-02 |
|---|---|---|
| bookingCta still unrendered | `grep -rn "bookingCta" src \| grep -v config/branding.ts` | no output |
| umbrellaBrand still unread | `grep -rn "umbrellaBrand" src \| grep -v config/branding.ts` | no output |
| code/isPublic/teeLocation still scaffold | `grep -rn "\.code\b\|isPublic\|teeLocation" src \| grep -v types.ts \| grep -v config/courses` | no output |
| Only strokePlay available | `grep -n "available: true" src/lib/formats.ts` | 1 line (strokePlay) |
| scoring still ignores round.format | `grep -n "format" src/lib/scoring.ts` | only `formatToPar` hits |
| DEFAULT_PAR still 3 | `grep -n "DEFAULT_PAR = " src/lib/types.ts` | `export const DEFAULT_PAR = 3;` |
| No hole overrides par yet | `grep -n "par:" src/config/courses/*.ts` | no output |
| Course registry contents | `grep -n "courses: Course\[\]\|defaultCourse" src/config/courses/index.ts` | `[osceola]`, default = osceola |
| Placeholder assets still in place | `ls public/placeholder-tee.svg public/courses/grayduck/` | both exist (hero.svg) |
| Current siteUrl | `grep -n "siteUrl" src/config/branding.ts` | `holeybuckets.netlify.app` (until the real domain) |
| Sponsor data still SAMPLE | `grep -n "SAMPLE" src/config/sponsors/osceola.ts` | banner + per-sponsor labels present (delete when real sponsors land) |
| Sponsor registry contents | `grep -n "sponsorsByCourse" src/config/sponsors/index.ts` | `{ osceola: osceolaSponsors }` |
| termStart/termEnd still informational | `grep -rn "termStart\|termEnd" src \| grep -v config/sponsors \| grep -v types.ts` | no output (no date logic) |
