import type { Sponsor } from "@/lib/types";

/**
 * ============================================================================
 * THE GRAY DUCK (OSCEOLA) SPONSORS  —  SAMPLE DATA
 * ============================================================================
 *
 * 👉 This is the file to edit to manage The Gray Duck's sponsors.
 *
 * The four sponsors below are MADE-UP SAMPLES with placeholder logos, here so
 * every placement is visible and testable today. Replace them with real
 * sponsors as they sign.
 *
 * How to add a sponsor (you don't need to be a developer):
 *   1. Drop their logo file into  /public/sponsors/  (a wide PNG works best).
 *   2. Copy one of the blocks below and fill it in:
 *      - `id`        a short unique slug in quotes, e.g. "osceola-hardware"
 *      - `name`      their business name in quotes
 *      - `logoUrl`   "/sponsors/<their-file>.png" (optional — no logo means
 *                    their name shows as text instead, which is fine)
 *      - `tier`      "hole" (one hole is theirs) or "digital" (app slots +
 *                    the printed "Thanks to our sponsors" row)
 *      - `status`    "active" to show them, "lapsed" to hide them
 *      - `holeId`    ONLY for "hole" sponsors: the hole number they bought.
 *                    One active sponsor per hole — the build fails loudly if
 *                    two active sponsors claim the same hole.
 *      - `url`       their website in quotes (optional — logo links to it)
 *      - `termStart` / `termEnd`  the deal dates (just notes for now)
 *   That's it. Nothing else to edit anywhere.
 *
 * When a sponsor stops paying: change their `status` to "lapsed". That one
 * edit removes them from the app AND the printed scorecards.
 * Keep each sponsor inside { curly braces } and end it with a comma.
 * ----------------------------------------------------------------------------
 */
export const osceolaSponsors: Sponsor[] = [
  // SAMPLE — hole sponsor, active: shows on hole 7's scoring screen and on
  // the scorecard (screen + PDF).
  {
    id: "osceola-hardware",
    name: "Osceola Hardware",
    logoUrl: "/sponsors/osceola-hardware.png",
    tier: "hole",
    status: "active",
    holeId: 7,
    url: "https://example.com/osceola-hardware",
    termStart: "2026-05-01",
    termEnd: "2026-10-31",
  },

  // SAMPLE — hole sponsor, LAPSED: proves the kill switch. This one shows
  // nowhere; flip `status` to "active" to see it on hole 13.
  {
    id: "cascade-falls-coffee",
    name: "Cascade Falls Coffee",
    logoUrl: "/sponsors/cascade-falls-coffee.png",
    tier: "hole",
    status: "lapsed",
    holeId: 13,
    url: "https://example.com/cascade-falls-coffee",
    termStart: "2026-04-01",
    termEnd: "2026-06-30",
  },

  // SAMPLE — digital sponsor, active: rotates in the home + results slots and
  // appears in the printed "Thanks to our sponsors" row.
  {
    id: "river-valley-realty",
    name: "River Valley Realty",
    logoUrl: "/sponsors/river-valley-realty.png",
    tier: "digital",
    status: "active",
    url: "https://example.com/river-valley-realty",
    termStart: "2026-05-01",
    termEnd: "2026-10-31",
  },

  // SAMPLE — second active digital sponsor, so the rotating slot actually
  // rotates (a different sponsor can come up on each visit).
  {
    id: "ducks-deck-grill",
    name: "Duck's Deck Bar & Grill",
    logoUrl: "/sponsors/ducks-deck-grill.png",
    tier: "digital",
    status: "active",
    url: "https://example.com/ducks-deck-grill",
    termStart: "2026-06-01",
    termEnd: "2026-09-30",
  },
];
