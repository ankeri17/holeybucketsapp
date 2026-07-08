# Codebase review — July 2026 (sponsor-placements PR)

A review pass done while building the sponsor placements, per the change
request. Two outright bugs were **fixed in the same PR**; everything else is
listed below, highest priority first, and deliberately **not** built — each
item is scoped small enough to pick off in its own PR.

## Fixed in this PR (outright bugs)

1. **CI never ran on `main`.** `.github/workflows/ci.yml` was pinned to push
   events on an old feature branch (`claude/holey-buckets-app-review-gcuzef`),
   so pushes to `main` — the branch Netlify deploys — ran no checks, despite
   the file's own comment saying they should. Now `branches: [main]`.
   (Pull requests were always checked; direct pushes weren't.)
2. **Scoring screen fallback hardcoded 3 strokes.** In
   `src/app/play/[roundId]/page.tsx`, an edit landing before the auto-seed
   effect ran would create the score as a literal `{ strokes: 3 }` instead of
   the hole's par. Invisible today (every hole is par 3) but a real bug the
   day a hole carries a custom `par`. Now reads the hole's par, falling back
   to `DEFAULT_PAR`.

## P1 — worth a PR soon

1. **(Mobile / tap targets)** The penalty **remove** button — the little "−"
   chip that appears on the corner of an active Penalty button — is 24×24px,
   far under the 56px `.tap-target` house baseline. Removing a mis-tapped
   penalty outdoors with a golf glove on is exactly when it'll be missed.
   Cheap fix: keep it visually small but extend its hit area (padding +
   negative margin, or a ::after overlay).
2. **(Mobile / outdoor contrast)** Several *small-text* color pairs sit near
   or below WCAG AA for body sizes, which bites hardest in direct sunlight:
   white on Fairway Green is 3.59:1 (fine for the big bold buttons, thin for
   the 12–14px "HOLE 7 OF 18 / Par 3" header labels, which also render at 80%
   opacity), Penalty Clay on cream is 3.06:1 (the small "+3" to-par strings on
   the leaderboard), Fairway Green on cream is 3.24:1 (the small "−1"
   strings). Large/bold text passes; the small labels don't. Cheapest lever:
   drop the opacity tricks on the green header and use Deep Pine (6.72:1 on
   cream) for small accent text.
3. **(Bug risk / share card)** `src/lib/shareImage.ts` draws names onto the
   1080px canvas with **no truncation or scaling** — a long group name or
   player name ("The Second Annual Osceola Invitational") walks off the card
   edge. The on-screen UI truncates; the canvas doesn't. Add a max-width
   ellipsis helper before drawing.

## P2 — real, not urgent

4. **(Data safety)** `saveRound()` in `src/lib/storage.ts` doesn't catch
   `QuotaExceededError`. If a phone's storage is full, every score tap throws
   inside a React state updater and the group silently loses edits. Wrap the
   `setItem` in try/catch and surface one "couldn't save — free up space"
   notice. (Related skill: holey-buckets-round-data-safety.)
5. **(Consistency)** `types.ts` declares the `teamAlternateShot` format but
   `src/lib/formats.ts` doesn't list it, so the start screen's "More formats
   coming soon —" line omits Team Alternate Shot while naming every other
   Phase 2 format. The architecture-contract skill records this as
   intentional/harmless — but the *visible* asymmetry in the coming-soon line
   looks like an oversight; worth either adding the `available: false` entry
   or noting in formats.ts why it's excluded.
6. **(Print/PDF, future courses)** `pdf.ts` and the `<Scorecard>` Totals table
   assume an 18-hole, two-nines course: a future 9-hole course would print a
   header with an empty back nine and an `IN 0` column. Harmless for The Gray
   Duck; gate it on `course.holes.length > 9` when course #2 shows up.
7. **(Growth / quick-ish)** No `og:image` yet — links shared in
   Messages/socials get no preview card. The layout.tsx comment already plans
   for it; needs a 1200×630 raster once real course photos land. (See
   holey-buckets-launch-campaign.)

## P3 — dead code / cruft (from the v2 polish era)

8. `.tnum` class in `globals.css` is used nowhere (every numeric block uses
   Tailwind's `tabular-nums` utility instead). Delete it, or start using it.
9. `Standing.holesScored` is computed for every leaderboard row but never
   displayed anywhere (only tests read it). Keep if Phase 2 formats want it;
   otherwise drop the field.
10. The `Brand` type export in `branding.ts` has no consumers. Harmless;
    delete when convenient.

## Quick wins (under ~30 minutes each)

- **Layout shift:** the `<img>` tags (course hero, tee photos, scoring-screen
  header photo) have no intrinsic dimensions; add `width`/`height` (or
  aspect-ratio classes) so the page doesn't jump as photos load. Add
  `loading="lazy"` to the 18 tee thumbnails on `/course`.
- **Accessibility:** `DifficultyMeter` pips carry no text alternative — a
  screen reader hears "Difficulty" and nothing else. Add
  `aria-label={"Difficulty " + level + " of 5"}` on the pip row.
- **Accessibility:** the loading states ("Loading round…", "Making your
  card…") aren't announced; wrap in `role="status"`.
- The `saveRound` try/catch from P2-4 is also a quick win if done as a
  guard-only change.

## Where sponsor analytics hooks go (future — deliberately not built)

Per the change request, no click tracking was added. When it's time:

- **Clicks:** every sponsor placement links out through ONE component —
  `SponsorLink` in `src/components/sponsors/SponsorLogo.tsx`. An `onClick`
  beacon there covers the hole band and both digital slots at once.
- **Impressions:** `DigitalSponsorSlot` picks its sponsor in one `useEffect`;
  that's the impression event. `HoleSponsorBand` renders per hole visit.
- **PDF exposure:** `drawSponsorFooters()` in `src/lib/pdf.ts` is the single
  place sponsors enter a printed card, if print exposure ever needs counting.
- Measurement strategy itself is owned by holey-buckets-growth-engine (no
  analytics of any kind exists in the app today).

## Notes from verification

- Scoring math, tie handling, and reconciliation all check out against the
  canonical cases (OUT 27 + IN 27 = 54 · E on an all-par tie round;
  "3 strokes + 1 penalty = 4" math line; ties share rank 1 and show
  "It's a tie!"). No scoring bugs found.
- Ball tracking is correctly decoupled from score (floors at 0, never enters
  totals) and only renders for `trackBalls` courses.
- Both PDFs print cleanly on landscape letter with the new sponsor rows, in
  color and grayscale; with zero active sponsors they render exactly as
  before, no empty frames.
