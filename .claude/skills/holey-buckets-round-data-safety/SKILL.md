---
name: holey-buckets-round-data-safety
description: >-
  Use when changing anything that touches the persisted Round/HoleScore data in
  the Holey Buckets app — adding/renaming/removing a field on Round, HoleScore,
  or the localStorage keys; editing src/lib/storage.ts, src/lib/types.ts, or
  src/lib/round.ts; planning the Phase 2 backend storage swap; or when you need
  to inspect, back up, or hand-craft a saved round in the browser. Enforces the
  founder house rule "never lose a live round". Do NOT use for general PR/change
  gating (see holey-buckets-change-control) or for diagnosing why a round went
  missing at runtime (see holey-buckets-debugging-playbook).
---

# Round data safety — "never lose a live round"

Holey Buckets has **no backend, no accounts, no database**. A round of bucket
golf (backyard golf: chip a ball into a bucket) lives entirely in the player's
phone `localStorage`. There is exactly ONE copy. If a code change makes that
copy unreadable, the group's in-progress round is gone forever.

**Founder house rule (non-negotiable #5): changes to the Round/HoleScore
localStorage shape must not corrupt or drop an in-progress round without an
explicit, documented decision.** This skill is the discipline for honoring it.

## When to use this skill / when NOT to

| Situation | Use |
|---|---|
| Adding, renaming, removing, or retyping any field on `Round`, `HoleScore`, `Player`, or the `scores`/`balls` records | THIS skill |
| Editing `src/lib/storage.ts`, or the parts of `types.ts` / `round.ts` that define persisted data | THIS skill |
| Inspecting / backing up / restoring / hand-crafting a saved round in the browser console | THIS skill (toolkit below) |
| Designing the Phase 2 backend storage swap | THIS skill (swap-boundary section) |
| How to classify/gate/review the change, PR body discipline | `holey-buckets-change-control` |
| "A player says their round disappeared" — runtime triage | `holey-buckets-debugging-playbook` |
| What the score fields *mean* (rules, worked cases) | `bucket-golf-reference` |
| Why the architecture is shaped this way | `holey-buckets-architecture-contract` |
| Manual QA protocol / what counts as "verified" | `holey-buckets-validation-and-qa` |

## 1. The exact storage contract (src/lib/storage.ts, verified 2026-07-02)

Two localStorage key patterns. That is the entire persistence layer:

| Key | Value | Written by |
|---|---|---|
| `holeybuckets:round:<id>` | One `Round`, `JSON.stringify`'d. `<id>` is the round's `id` (a `crypto.randomUUID()` from `src/lib/ids.ts`, fallback `id-<timestamp>-<random>`) | `saveRound(round)` |
| `holeybuckets:activeRoundId` | The bare id string of the in-progress round (for "resume") | `setActiveRoundId(id)` |

The four exported functions and their load-bearing semantics:

- `saveRound(round)` — `setItem(JSON.stringify(round))`. Called on **every
  score mutation** (every stepper tap, chip toggle, penalty tap, ball tap) by
  the scoring screen, and once by the start screen. No debounce, no error
  handling — a thrown `setItem` (quota) would surface as an uncaught error.
- `loadRound(id)` — returns `Round | null`. Returns **null** if the key is
  missing **OR if `JSON.parse` throws**. The catch is silent: **a corrupt
  round is indistinguishable from a missing one.** The player just sees
  "We couldn't find that round on this device." with a "Start a new round"
  link (`src/app/play/[roundId]/page.tsx`). This is why a bad schema change
  can *silently* eat a live round — nothing logs, nothing warns.
- `setActiveRoundId(id)` / `getActiveRoundId()` — the active-round pointer.
  As of 2026-07-02 `getActiveRoundId` has **no callers** in `src/app` (no
  resume UI yet); the pointer is written but never read. Verify before
  relying on that: `grep -rn getActiveRoundId src/`.
- `hasStorage()` (private) — `typeof window !== "undefined" && !!window.localStorage`.
  Every function checks it first so the module is safe to import in SSR/server
  code: on the server, saves are no-ops and loads return null. **Keep this
  guard in any change** — the play pages are `"use client"` but still render
  once on the server.

`loadRound` does `JSON.parse(raw) as Round` — a **blind cast**. There is no
runtime validation. Whatever shape was saved is what the app gets, and every
consumer must survive it.

Callers of storage (the complete list, verified by grep):
`src/app/start/page.tsx` (save + set active), `src/app/play/[roundId]/page.tsx`
(load + save), `src/app/play/[roundId]/results/page.tsx` (load only).

## 2. The serialized Round shape (from src/lib/types.ts)

Jargon, once: **net strokes** = `max(0, strokes − (bucketChip ? 1 : 0) + (penalties ?? 0))`
(`src/lib/scoring.ts`). **bucketChip** = chipped the ball *into* the bucket,
a binary −1 bonus. **penalties** = count of +1 penalty strokes (foliage,
water, OB, lost ball — can happen multiple times per hole). **balls** =
per-player tally of balls used/lost, for per-ball billing at courses with
`trackBalls`; it NEVER affects the score.

What `localStorage.getItem("holeybuckets:round:<id>")` actually holds
(field-faithful example; two players, holes 1–2 scored, hole 2 for p2 not yet):

```json
{
  "id": "b3e1f0a2-6c4d-4e8f-9a1b-2c3d4e5f6a7b",
  "courseId": "osceola",
  "groupName": "Bachelor party",
  "players": [
    { "id": "7f8e9d0c-1b2a-4c3d-8e9f-0a1b2c3d4e5f", "name": "Erin" },
    { "id": "0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d", "name": "Laura" }
  ],
  "format": "strokePlay",
  "scores": {
    "7f8e9d0c-1b2a-4c3d-8e9f-0a1b2c3d4e5f": {
      "1": { "strokes": 3 },
      "2": { "strokes": 2, "bucketChip": true, "penalties": 1 }
    },
    "0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d": {
      "1": { "strokes": 4, "penalties": 2 }
    }
  },
  "balls": {
    "7f8e9d0c-1b2a-4c3d-8e9f-0a1b2c3d4e5f": 1
  },
  "createdAt": "2026-07-02T14:03:11.000Z"
}
```

Shape rules that matter for safety:

| Field | Type in types.ts | Persistence gotchas |
|---|---|---|
| `id`, `courseId`, `groupName`, `createdAt` | required strings | `courseId` must resolve via `getCourse()` — an unknown courseId makes the play page show the SAME "couldn't find that round" fallback as a missing round |
| `players[]` | `{id, name}` required | scores key off `id`, never `name` (two "Mike"s are fine) |
| `format` | `ScoringFormat` union, MVP always `"strokePlay"` | unknown strings load fine (blind cast) — nothing branches on format yet |
| `scores` | `Record<playerId, Record<holeNumber, HoleScore>>` | TS says `Record<number, …>` but **JSON object keys are strings** (`"1"`, `"2"`). Existing code handles this (`Object.entries` + `Number(holeNumber)` in `playerToPar`). Any validator or migration you write must expect string keys. A **missing entry = hole not scored** — absence is meaningful; never write placeholder zeros |
| `HoleScore` | `strokes` required; `bucketChip?`, `penalties?` optional | old rounds legitimately lack the optional fields — see §3 |
| `balls` | `Record<playerId, number>`, whole field optional | absent until the first ball tap; only shown when `course.trackBalls` |

Also know: the scoring screen **auto-seeds** every player's score to par
(`{ strokes: holePar(hole) }`) for whichever hole is on screen ("visiting a
hole means it's in play") and calls `saveRound` immediately — so merely
*opening* a round under new code rewrites it in the new shape. A migration bug
therefore destroys the old data on first view; there is no second chance.

## 3. The precedent: PR #9 (2026-06-26) — foliage → penalties, no migration

PR #9 renamed `HoleScore.foliage` (boolean) to `penalties` (number). **No
read-time migration was written.** Any round saved mid-play before the change
still had `"foliage": true` on some holes; new code reads `penalties ?? 0`, so
those holes silently became **penalty-free** — the player's score quietly
improved. The PR body stated this explicitly:

> "In-progress rounds saved before this change (using the old `foliage` flag)
> will read that hole as penalty-free — acceptable since rounds are
> ephemeral/local in the MVP."

This was ACCEPTED — not because migrations don't matter, but because (a) rounds
are ephemeral (played and shared same day), (b) the blast radius was one
optional field on possibly zero in-flight rounds, and (c) **the tradeoff was
written down in the PR and the founder signed off**. The precedent it sets:

**The rule going forward: every PR that changes the persisted Round/HoleScore
shape must state its migration story explicitly in the PR body — either a
read-time migration, or a documented data-loss acceptance — and get sign-off
through `holey-buckets-change-control`.** "I didn't think about old data" is
never an acceptable state. Note the calculus changes completely once Phase 2
saved rounds exist: "ephemeral" stops being true, and the PR #9 escape hatch
closes.

## 4. Safe-change patterns, ranked safest → most dangerous

1. **Additive optional field with a `??` / `?.` default (SAFEST — the house
   style).** Old rounds simply lack the field; every read supplies the default.
   The codebase already reads defensively everywhere — copy these patterns:
   - `score.penalties ?? 0` (`src/lib/scoring.ts:22`, `play/[roundId]/page.tsx:206`)
   - `round.balls?.[playerId] ?? 0` (`src/lib/scoring.ts:101`, `play/[roundId]/page.tsx:103`)
   - `round.scores[playerId]?.[holeNumber]` (`src/lib/scoring.ts:33`)
   Declare the field optional (`?`) in `types.ts`, default at EVERY read site,
   and (usually) don't backfill in `createRound` — absence-with-default is the
   contract. No migration needed; still state that in the PR ("additive
   optional field, old rounds unaffected").
2. **Widening a type** (e.g. boolean → boolean-or-number, adding a union
   member to `ScoringFormat`). Safe only if every read site handles BOTH the
   old and new value space — old rounds keep old-shaped values forever (until
   the auto-seed/save rewrite). Enumerate read sites (checklist below) and
   prove each one.
3. **Renames and removals (DANGEROUS — requires an explicit decision).** Old
   data has the old key; new code ignores it; the information is silently
   dropped (exactly PR #9). You must pick one, in the PR body:
   - **Read-time migration in `loadRound`**: after `JSON.parse`, detect the
     old key and rewrite (e.g. `if ("foliage" in s) s.penalties = s.foliage ? 1 : 0`).
     Keep it inside `storage.ts` — it is the one choke point every load goes
     through, and it keeps the migration out of UI code. Delete-the-old-key,
     idempotent, tolerant of already-new data.
   - **Documented data-loss acceptance**: state precisely what old in-flight
     rounds will read as, why that's acceptable *today*, and get sign-off
     (the PR #9 pattern).
4. **Changing a required field's meaning or the key scheme itself**
   (`holeybuckets:round:<id>`, `scores` keying) — effectively a new storage
   format. Requires a real migration plus a fallback read of the old keys.
   Nothing like this has ever been done here; treat it as a design review,
   not a PR.

## 5. Schema-change checklist (run every item, in order)

1. **Enumerate every read site of the field you're touching.** The app is
   small enough to be exhaustive:
   ```bash
   grep -rn "penalties" src/          # swap in your field name
   grep -rn "bucketChip" src/
   grep -rn "\.balls" src/
   grep -rn "loadRound\|saveRound" src/   # the full persistence surface
   ```
   Expected persistence surface today: definitions in `storage.ts`, callers in
   `start/page.tsx`, `play/[roundId]/page.tsx`, `play/[roundId]/results/page.tsx`.
   Direct `HoleScore`-field readers today: `scoring.ts` (source of truth),
   `play/[roundId]/page.tsx`, `Scorecard.tsx`, `pdf.ts`. The results page and
   `shareImage.ts` consume rounds only through `scoring.ts` helpers
   (`standings`, `playerBalls`, …) — they inherit whatever `scoring.ts`
   decides, so fixing the default there usually fixes them, but eyeball all
   six when a `HoleScore`/`Round` field changes.
2. **Decide: migration or acceptance** (§4). Write the decision down before
   writing code.
3. **Test with a round saved under the OLD shape.** Before applying your
   change (or by hand-crafting old-shape JSON), plant an old round, then run
   the NEW code against it. Console snippet — paste in DevTools on
   `localhost:3000` (adapt the `scores` object to the OLD shape you're
   migrating from; this example uses PR #9's pre-change `foliage` flag):
   ```js
   const id = "old-shape-test";
   const round = {
     id, courseId: "osceola", groupName: "Migration test",
     players: [{ id: "p1", name: "Erin" }, { id: "p2", name: "Laura" }],
     format: "strokePlay",
     scores: { p1: { "1": { strokes: 4, foliage: true } },   // OLD shape here
               p2: { "1": { strokes: 3 } } },
     createdAt: new Date().toISOString(),
   };
   localStorage.setItem("holeybuckets:round:" + id, JSON.stringify(round));
   location.href = "/play/" + id;
   ```
   Then verify: the round LOADS (no "couldn't find that round" fallback), the
   old hole's score is what your decision says it should be, the leaderboard
   and results page agree, and navigating a hole (which triggers the
   auto-seed + save rewrite) doesn't corrupt anything on a second reload.
4. **Also test a fresh round end-to-end** (start → score → results) under the
   new shape.
5. **Document in the PR**: the migration story (§4 option chosen), the
   old-shape test you ran and what you observed, plus the standard "Verified"
   evidence — then route through `holey-buckets-change-control` for sign-off.
   `npm run build` must pass (it type-checks; it will catch read sites the
   compiler can see, but NOT stale data shapes — that's what step 3 is for).

## 6. Inspection toolkit (browser console, copy-paste)

All snippets run in DevTools on the app's origin (localhost:3000 in dev, the
Netlify site in prod). `copy()` is a DevTools-console builtin.

```js
// List every saved round (key, group, created, players, holes scored)
Object.keys(localStorage)
  .filter(k => k.startsWith("holeybuckets:round:"))
  .map(k => { const r = JSON.parse(localStorage.getItem(k));
    return { key: k, group: r.groupName, created: r.createdAt,
      players: r.players.map(p => p.name).join(", "),
      holesScored: Math.max(0, ...r.players.map(p => Object.keys(r.scores[p.id] ?? {}).length)) }; });

// Which round is active?
localStorage.getItem("holeybuckets:activeRoundId");

// Dump one round, pretty-printed (paste the id)
JSON.parse(localStorage.getItem("holeybuckets:round:PASTE-ID-HERE"));

// Back one up (puts the raw JSON string on your clipboard)
copy(localStorage.getItem("holeybuckets:round:PASTE-ID-HERE"));

// Back up ALL rounds as one JSON blob
copy(JSON.stringify(Object.fromEntries(
  Object.keys(localStorage).filter(k => k.startsWith("holeybuckets:"))
    .map(k => [k, localStorage.getItem(k)]))));

// Restore one round (paste the backed-up string as the second arg)
localStorage.setItem("holeybuckets:round:PASTE-ID-HERE", `PASTE-BACKUP-JSON-HERE`);

// Restore an all-rounds blob (paste the blob as `backup`)
const backup = /* paste object here */;
Object.entries(backup).forEach(([k, v]) => localStorage.setItem(k, v));
```

Before ANY risky manual poking at a live round: back it up first. Remember
`loadRound` is silent on corruption — if a restore has a typo, the app will
just say the round doesn't exist. Round URLs are `/play/<id>` and
`/play/<id>/results`, so you can always re-open a round whose key you can see.

## 7. Phase 2: storage.ts is the swap boundary

The MVP's own comment in `storage.ts` states the plan: "Phase 2 swaps this
module for a hosted backend without the rest of the app needing to care."
Everything here is **plan/candidate, not built** (as of 2026-07-02). What the
swap must preserve:

- **The module's public surface**: `saveRound`, `loadRound`,
  `setActiveRoundId`, `getActiveRoundId` — the only three importers are the
  start, play, and results pages. Nothing else in the app may ever touch
  localStorage or a round-persistence API directly; keep it that way so the
  boundary stays swappable.
- **Semantics callers depend on**: `loadRound` returns null for
  missing-or-unreadable (the play page's fallback UI depends on it);
  `saveRound` is called on every single tap (a network backend needs
  batching/debouncing or offline queueing — design work, not a drop-in);
  everything is currently **synchronous** — going async changes the callers'
  signatures, so the swap is "storage.ts plus its three caller files", not
  literally one file.
- **The data itself**: the serialized `Round` in §2 becomes a wire/DB format.
  The moment rounds are saved server-side, they are no longer ephemeral, the
  PR #9 "acceptable loss" escape hatch is gone, and every schema change needs
  a real versioned migration. If you are designing Phase 2, add an explicit
  schema-version field as part of the swap.
- **Local-first survival**: the whole reason for localStorage is that a round
  survives a refresh or signal drop mid-backyard. A backend swap must not
  regress that (keep a local write-through copy).

## Provenance and maintenance

Derived 2026-07-02 (repo commit `aa4c527`) by direct reading of
`src/lib/storage.ts`, `src/lib/types.ts`, `src/lib/round.ts`,
`src/lib/scoring.ts`, `src/lib/ids.ts`, `src/app/play/[roundId]/page.tsx`,
plus `git show 15e2be7` (the code change) and the PR #9 body on GitHub (merged
2026-06-26; the migration-acceptance wording lives only in the PR body),
as part of the retiring principal engineer's 12-skill handoff library.

Re-verify before trusting, if time has passed:

| Claim | Command |
|---|---|
| Storage keys + null-on-corrupt + SSR guard | `cat src/lib/storage.ts` |
| Round/HoleScore field list | `sed -n '100,150p' src/lib/types.ts` |
| Complete persistence surface (callers) | `grep -rn "loadRound\|saveRound\|ActiveRoundId" src/` |
| `getActiveRoundId` still unread by UI | `grep -rn getActiveRoundId src/app/` |
| Defensive-read patterns still in place | `grep -rn "penalties ?? 0\|balls?.\[" src/` |
| Score-field read-site file list (§5.1) | `grep -rln "netStrokes\|HoleScore" src/` |
| PR #9 precedent wording | github.com/ankeri17/holeybucketsapp/pull/9 (the wording is in the PR body only; `git show 15e2be7` shows just the code) |
| Phase 2 swap comment still current | `sed -n '1,12p' src/lib/storage.ts` |
| Build (type-check) passes | `npm run build` |
