---
name: holey-buckets-growth-engine
description: Research frontier and experiment methodology for the Holey Buckets growth machine — the share-card → site-visit → booking acquisition loop. Use when asked to measure, grow, or instrument the app (analytics, attribution, share rate, conversion, "how many people…", UTM, visit counting, growth experiments), or when proposing/evaluating any product experiment. Do NOT use for executing the launch itself (see holey-buckets-launch-campaign), for change-gating mechanics (see holey-buckets-change-control), or for build/deploy commands (see holey-buckets-build-and-run).
---

# Holey Buckets — Growth Engine (research frontier + methodology)

The founder-confirmed long-term ambition for this app is a **growth machine**: every
finished round produces a branded share card; the card carries the site URL; a recipient
visits, plays, books a paid round at the venue, and produces more share cards. This skill
is the honest map of that loop — what exists, what is broken, what is unmeasured — plus
the methodology any successor must follow before shipping a growth experiment.

**Brutal starting truth (as of 2026-07-02): the app measures NOTHING.** No analytics
library, no tracking pixel, no UTM parameter, no event capture, no server (a round lives
only in the phone's `localStorage`). Verify it yourself before trusting any growth claim:

```bash
# From the repo root:
grep -rniE "utm_|gtag|analytics|plausible|posthog|fathom|umami|matomo|mixpanel|segment" src/ netlify.toml package.json
# Expected: no output, exit code 1. If this ever matches, this skill is stale — re-read the code.
```

The only runtime dependencies are `jspdf`, `jspdf-autotable`, `next`, `react`,
`react-dom` (check `package.json`). The research frontier therefore starts at
**instrumentation**, not optimization. You cannot grow what you cannot count.

## When to use this skill / when NOT to

**Use when:**
- Asked anything measurement-shaped: "how many people share / visit / book?", "add
  analytics", "track the share card", "is the loop working?".
- Proposing, evaluating, or reviewing ANY product experiment (growth or otherwise) —
  section "Methodology" is the house discipline for all of them.
- Deciding whether a previously proposed growth idea was already considered/retired.

**Do NOT use — go to the sibling instead:**

| Task | Sibling skill |
|---|---|
| Executing launch (worksheet intake, M7 email+booking build, domain repoint) | `holey-buckets-launch-campaign` |
| How to classify/gate/review a change; dependency policy mechanics | `holey-buckets-change-control` |
| Build/dev/deploy commands, routes, Netlify pipeline details | `holey-buckets-build-and-run` |
| localStorage schema and safe-change rules for `Round` data | `holey-buckets-round-data-safety` |
| What counts as verification evidence; manual QA protocol | `holey-buckets-validation-and-qa` |
| Past decisions and PR chronicle | `holey-buckets-history-and-decisions` |
| Scoring rules, formats, ball-billing domain facts | `bucket-golf-reference` |
| Config field meanings (`siteUrl`, `bookingCta`, `trackBalls`, …) | `holey-buckets-config-catalog` |
| Architecture invariants ("course is data", branding single-source) | `holey-buckets-architecture-contract` |
| README/PR writing style for the non-developer founder | `holey-buckets-docs-and-writing` |
| Symptom→triage debugging | `holey-buckets-debugging-playbook` |

Jargon used below, defined once: **share card** = the 1080×1080 branded PNG built on a
`<canvas>` in `src/lib/shareImage.ts` at round end. **`siteUrl`** = the config field
`brand.siteUrl` in `src/config/branding.ts` (currently `"holeybuckets.netlify.app"`, a
placeholder Netlify subdomain — no real domain yet). **`bookingCta`** = the config object
`brand.bookingCta` (`label: "Book your round"`, `url: "https://helloagainproperties.com"`
— itself a placeholder). **Founder-editable** = `branding.ts` and
`src/config/courses/*.ts` must stay editable by the non-developer owner. **M7** =
README roadmap item 7 ("Email capture + booking link + brand polish"), unbuilt.

## 1. The loop as designed today (as of 2026-07-02, commit aa4c527)

Play → results → share card → recipient visits `siteUrl` → booking CTA → paid booking.
Walk the chain link by link; the loop is designed end-to-end but **no link past "share
tap" is closed or observable**:

| # | Link | Where in code | Status |
|---|---|---|---|
| 1 | Round played and finished | `/play/[roundId]` → "Finish round →" → `/play/[roundId]/results` | **Built.** Data is localStorage-only, invisible to us (no server). |
| 2 | Share card generated | `buildShareImage()` in `src/lib/shareImage.ts`; auto-built on results-page load; carries course name·location, month/year, winner/TIE box, top-5 standings, group name, umbrella credit, and `brand.siteUrl` in bucketBlue (line ~104). PR #5 (2026-06-26) built the card; PR #11 added course name + `siteUrl` (text URL — a QR library was declined, dependency discipline). | **Built.** |
| 3 | Share tap | Results page "Share" button → `shareImage()` → `navigator.canShare` → native share sheet; on cancel/failure or unsupported browsers, falls back to PNG download. "Save image" is a separate `downloadImage()` button. | **Built, unmeasured.** Success IS distinguishable in code: `await navigator.share(...)` resolving = shared; the `catch` = cancelled/failed → download fallback. Nothing records either outcome. |
| 4 | Recipient sees the URL | `siteUrl` is **pixels on a PNG** — not a clickable link. The share sheet's `text` field (`"<group> played Holey Buckets!"`, `shareImage.ts` ~line 179) contains **no URL**, so even Messages/WhatsApp linkification has nothing to linkify. A recipient must read the image and type the URL. | **Weakest link.** High friction; zero observability. |
| 5 | Recipient visits the site | `holeybuckets.netlify.app` (placeholder; real domain is a launch-campaign task). | **No visit counting of any kind.** Cannot distinguish a card-driven visit from the founder refreshing her own deploy. |
| 6 | "Book your round" CTA | `brand.bookingCta` in `branding.ts` — **defined but rendered NOWHERE** (verify: `grep -rn bookingCta src/` → only `branding.ts`). Wiring it into the UI is M7, owned by `holey-buckets-launch-campaign`. | **Missing.** The loop's last hop does not exist in the UI. |
| 7 | Booking happens | Off-app entirely (bookingCta URL is a placeholder pointing at helloagainproperties.com). | **Out of the app; unmeasurable from this repo alone.** |

Read the actual sources before touching anything: `src/lib/shareImage.ts`,
`src/app/play/[roundId]/results/page.tsx`, `src/config/branding.ts`.

## 2. Open problems, ranked (all are OPEN — nothing below is built)

Rank order = what unblocks the most downstream knowledge first. Each entry:
why the current state fails → this project's specific asset → first three concrete steps
in this repo → the falsifiable "you have a result when…" milestone. Every step that
changes shipped behavior or adds a dependency is **gated by
`holey-buckets-change-control`** — nothing here authorizes skipping the gate.

### Problem A — Attribution zero (the #1 problem)

- **Why current state fails:** We cannot tell whether a single site visit has EVER come
  from a share card. The URL on the card is un-annotated text on an image; the site has
  no visit counting. "The share card drives acquisition" is, today, an untested belief.
- **This project's asset:** We control the rendered URL — `brand.siteUrl` is one config
  field consumed by exactly one render site (`shareImage.ts` footer). Changing what the
  card shows is a one-line edit.
- **First three steps in this repo:**
  1. Choose a visit-measurement option and get it approved through change control's
     dependency policy. Two candidates: **Netlify Analytics** (server-side, zero code
     in this repo, no player-facing change; enabled in the Netlify dashboard — a paid
     add-on; pricing/availability unverified, check the dashboard) vs. **a client-side
     analytics lib** (new runtime dependency + a script in `layout.tsx`; heavier gate —
     precedent says deps get declined when a no-dep option exists, e.g. the QR library
     in PR #11 and canvas-over-library in PR #5). Default recommendation: the zero-code
     server-side option first.
  2. Make card-driven visits distinguishable: render a suffix on the card, e.g. change
     the drawn string to `holeybuckets.netlify.app/card` (a short typed path beats a
     `?utm_source=sharecard` query string — recipients TYPE this URL by hand, so every
     character is friction). Note this is NOT a `branding.ts`-only edit as designed:
     `siteUrl` is also the canonical site address, so a card-only suffix belongs in
     `shareImage.ts` (or a new optional branding field — founder-editable rules apply).
     Either way it changes player-visible pixels → gated, needs the 390px render check
     and a share-card collision check per `holey-buckets-validation-and-qa`. `/card`
     must actually resolve (a redirect to `/` or a real route) — verify before shipping.
  3. Define the metric in writing BEFORE looking at data: "shares→visits" =
     (visits landing on the card path in a calendar week) ÷ (share events that week —
     see Problem B; until B ships, the denominator is unknown and you may only report
     the numerator).
- **You have a result when:** you can state, for one real (post-launch) week, "N visits
  arrived via the card path, out of M total visits" — with M and N from the same
  measurement source, and the founder's own test visits excluded or bounded.

### Problem B — Share rate unmeasured

- **Why current state fails:** We don't know how many finished rounds end in a share
  tap. If share-rate is ~0, optimizing steps 4–7 of the loop is pointless; if it's high,
  the URL friction (Problem A) is the bottleneck. Can't rank without the number.
- **This project's asset:** The success/cancel distinction already exists in code
  (`shareImage.ts`: the `try { await navigator.share(...); return; } catch {…}` block).
  A share-success event has a precise, existing hook point; so do "Save image" and the
  download fallback.
- **First three steps in this repo:**
  1. Decide the capture mechanism (candidate options, all dep/change-gated): a
     client-analytics event if a client lib was approved in A; OR a no-dep beacon
     (`navigator.sendBeacon` / `fetch` to a Netlify Function — note a Function is a
     server-side component and needs explicit sign-off against the no-backend posture);
     OR (weakest) proxy share-intent by counting results-page views only.
  2. Write the event taxonomy first (candidate names: `share_success`,
     `share_fallback_download`, `image_saved`, `results_viewed`) — counts only, no
     player identity, no round content (privacy posture, §5).
  3. Instrument the two functions in `shareImage.ts` + a results-page view event, behind
     one tiny wrapper module so removal is one file.
- **You have a result when:** you can state "X% of results-page views produced a
  successful native share (and Y% a save/download)" for one real week, from recorded
  events — not from recollection.

### Problem C — Booking conversion (blocked on M7)

- **Why current state fails:** `bookingCta` is configured but rendered nowhere; there
  is no booking link to click, so booking conversion is not just unmeasured — the hop
  doesn't exist. Building the CTA (and email capture) is **M7, owned by
  `holey-buckets-launch-campaign`** — do not duplicate that work from here.
- **This project's asset:** Because booking starts as one outbound link from a page we
  control, click-through is countable the moment it exists (same mechanism family as B).
- **First three steps in this repo:** (1) Wait for / coordinate with the M7 build in
  the launch campaign; (2) when the CTA lands, ensure its render site emits a
  `booking_cta_click` event using whatever mechanism A/B established; (3) agree with
  the founder how a completed booking is confirmed on the venue side (off-app —
  probably "Erin tells us"), since the app can only see the click, not the booking.
- **You have a result when:** you can state clicks→(founder-confirmed bookings) for one
  real month. Anything less is click-through, and must be reported as click-through.

### Problem D — Round-volume baseline

- **Why current state fails:** Rounds exist only in players' `localStorage`
  (keys `holeybuckets:round:<id>`, `holeybuckets:activeRoundId` — see
  `holey-buckets-round-data-safety`). We don't know if 3 or 300 rounds are played per
  week, so no rate (share rate, visit rate) has a trustworthy denominator at the
  round level.
- **This project's asset:** Round creation is a single choke point
  (`createRound` → `saveRound` in `src/app/start/page.tsx`), and the dynamic routes
  `/play/[roundId]` are served per-round — server-side pageview counting might
  approximate round starts with zero client code. Might: client-side router
  navigation may not register as a countable pageview — that itself is an experiment
  (predict, then check; see §3).
- **First three steps in this repo:** (1) If server-side analytics shipped in A, check
  whether `/play/*` and `/start` requests are countable and how client navigation
  distorts them; (2) if not sufficient, spec a privacy-light counter: one anonymous
  `round_started` count event at the `createRound` call site — a count, no round
  content, no IDs kept beyond the event; (3) reconcile the counter against a known
  ground truth (the founder plays K deliberate rounds in a week; the counter must read
  ≥K and plausibly close to K).
- **You have a result when:** you can state rounds-started-per-week for one real week
  and it reconciles with the founder's deliberate test rounds.

**Additional candidate (unranked, cheap, unbuilt):** add `brand.siteUrl` to the share
sheet's `text` field in `shareImage.ts` so messaging apps linkify it — turns the typed
URL into a tappable one for step 4. Player-visible change → gated; combine with the
Problem-A suffix so those taps are attributable. Labeled **candidate** only.

## 3. Methodology — the discipline for ANY product experiment here

This is the house method, not optional garnish. It exists because this repo's history
shows speculation loses to observation (§4), and because with zero analytics it is very
easy to ship a "growth" change and then narrate success with no evidence.

1. **Hypothesis with predicted numbers, written BEFORE shipping.** Not "adding the URL
   should help" but "adding the `/card` path to the share card will produce ≥N visits
   per week on that path within 4 weeks of launch." Pick N before you can see the data;
   record it in the PR body (the PR "Verified" discipline — see
   `holey-buckets-change-control`). A prediction you write after seeing data is a
   caption, not a hypothesis.
2. **One mechanism must explain ALL observations — including the negatives.** If `/card`
   visits are zero but shares (B) are frequent, "recipients don't type URLs off images"
   must also explain why any visits you DO see exist. A story that explains only the
   flattering data points is rejected.
3. **Assigned adversarial refutation.** Before declaring a result, a second session (or
   a second engineer) is explicitly assigned to argue the null: e.g. "all `/card`
   visits are the founder testing her own shares", "the visit spike is the Netlify
   deploy preview bot", "share_success fired on cancels because platform X resolves the
   promise anyway" (browser share-sheet semantics vary — verify per platform, don't
   assume the spec). The result stands only if it survives the assigned attack. Record
   the attack and its outcome in the PR or decision log.
4. **The idea lifecycle.** Every growth idea is in exactly one state:
   - **candidate** — labeled as such, listed in this skill (§2 and the unranked
     candidate above are ALL in this state as of 2026-07-02);
   - **gated experiment** — a PR through `holey-buckets-change-control`, carrying the
     written prediction;
   - **measured** — compared against the predicted number, adversarially refuted;
   - **adopted** — update THIS skill (move it out of §2) AND
     `holey-buckets-history-and-decisions`; or
   - **retired** — documented here with the evidence, so a fresh session doesn't
     re-propose it. As of 2026-07-02 the retired list is empty; the closest precedents
     are declined-not-retired decisions (QR code declined in PR #11; top-5-only
     standings kept in PR #5).

## 4. Where good ideas historically came from in this repo

Not from growth theory — from **real-usage observation by the founder on her actual
phone**. The evidence:

- The entire v2 visual/UX pass (PRs #6–#12, 2026-06-26) came from the founder's written
  feedback note after using the app — including the P1 scoring-clarity demand and the
  to-par-over-played-holes fix.
- The tie bug (PR #14): `winners()` logic shipped showing "Erin wins!" when Erin & Laura
  were tied at 54·E — caught only when a real round was played on a real device. Desktop
  preview review missed it.
- The scroll-to-top fix (PR #15): device feedback that hole changes left you mid-page.

**Implication for growth work:** the founder's device testing and her observations of
real groups playing are the richest idea source available. Before inventing a growth
experiment, ask what she has actually seen people do with the share card. Speculation
is allowed only as a hypothesis feeding §3 — never as a shipped conclusion.

## 5. Constraints that bound the frontier

Any candidate violating these is dead on arrival; don't spend effort polishing it.

| Constraint | Consequence for growth work |
|---|---|
| **No-backend MVP** (README: "no backend / no database / no logins for now") | No server-side event store of our own without explicit sign-off. Netlify Functions/edge counters are server-side components — flag them as such, don't smuggle them in as "just a counter". Phase 2's backend swap boundary is `src/lib/storage.ts` (see `holey-buckets-round-data-safety`). |
| **Dependency discipline** | Every new runtime dep is pre-flagged and gated (`holey-buckets-change-control`). History: canvas instead of an image lib (PR #5), text URL instead of a QR lib (PR #11), jsPDF pre-flagged before adoption (PR #13). A zero-dep option must be argued against before a lib is added. |
| **Founder-editability** | Anything a growth change puts in `branding.ts` or `src/config/courses/*.ts` must stay plain-English, heavily commented, editable by a non-developer. No env-var-only magic knobs in those files. |
| **Privacy posture — no accounts, don't track individuals** | Players have no identity in this app (a `Player` is `{id, name}` scoped to one localStorage round). Do NOT propose per-person tracking, fingerprinting, cross-device IDs, or shipping round contents (names, scores) to any server. Counts and aggregates only. Email capture (M7) is the founder's explicit opt-in channel and belongs to `holey-buckets-launch-campaign`. |
| **Player-visible pixels are gated** | The share card is the product's public face; even a one-line URL suffix changes it. Gate + 390px render + full-5-player card collision check (`holey-buckets-validation-and-qa`). |

## Provenance and maintenance

Derived 2026-07-02 by the retiring principal engineer from direct inspection of the repo
at commit aa4c527 (`src/lib/shareImage.ts`, `src/config/branding.ts`,
`src/app/play/[roundId]/results/page.tsx`, `package.json`, `netlify.toml`, `README.md`),
the GitHub PR history #1–#15 (all 2026-06-26, cited inline), and the founder's confirmed
answers (growth-machine ambition; house rules). Everything in §2 is a **candidate** —
none of it is built. When an experiment is adopted or retired, update §2 and §3.4 here
and log the decision in `holey-buckets-history-and-decisions`.

Re-verify before relying on volatile facts:

| Claim | Command | Expected as of 2026-07-02 |
|---|---|---|
| Still zero analytics/UTM anywhere | Run the fenced `grep` command at the top of this skill (copy it from there — table cells can't hold the pipes) | No output (exit 1) |
| `bookingCta` still unrendered | `grep -rn bookingCta src/` | Only `src/config/branding.ts` |
| `siteUrl` value + render sites | `grep -rn siteUrl src/` | `branding.ts` (`holeybuckets.netlify.app`) + one draw call in `shareImage.ts` |
| Share text still has no URL | `grep -n "text:" src/lib/shareImage.ts` | `` `${round.groupName} played Holey Buckets!` `` — no URL |
| Runtime deps unchanged | `grep -A7 '"dependencies"' package.json` | jspdf, jspdf-autotable, next, react, react-dom only |
| M7 still open | `grep -n "Email capture" README.md` | Roadmap item 7 with ⬜ |
| Share success hook point intact | `grep -n "navigator.share" src/lib/shareImage.ts` | The awaited call inside try/catch |
| Live URL still the Netlify placeholder | check `brand.siteUrl` in `src/config/branding.ts`, then open it | `holeybuckets.netlify.app` serves the app (unverified from this offline session) |
