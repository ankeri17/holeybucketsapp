import type { Sponsor } from "@/lib/types";

/**
 * ============================================================================
 * THE GREY DUCK (OSCEOLA) SPONSORS  —  from the Sponsorship Tracker
 * ============================================================================
 *
 * 👉 This is the file to edit to manage The Grey Duck's sponsors.
 *
 * The three sponsors below come from the Sponsorship Tracker workbook
 * (July 2026). Two are named placeholders and one is the location sponsor —
 * none are paying yet. Replace/add entries here as real sponsors sign, and
 * keep this file in sync with the tracker (per its rules: when a sponsor
 * lapses, update BOTH the tracker and this file, until that's automated).
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
  // Hole sponsor placeholder (tracker: hole 1, no logo received yet). With no
  // logoUrl, every placement shows the name in the app's bold black display
  // type — the "black and white sample typography" the tracker asks for.
  {
    id: "placeholder-hardware-store",
    name: "Placeholder Hardware Store",
    tier: "hole",
    status: "active",
    holeId: 1,
    termStart: "2026-05-01",
    termEnd: "2026-10-31",
  },

  // Digital sponsor placeholder (tracker: rotate with Hello Again, no logo
  // received yet) — same typography-only treatment as above.
  {
    id: "placeholder-coffee-shop",
    name: "Placeholder Coffee Shop",
    tier: "digital",
    status: "active",
    termStart: "2026-05-01",
    termEnd: "2026-10-31",
  },

  // The location sponsor — Scotty's company hosts the course. Fills the
  // digital rotation until paying sponsors are acquired. The logo is a
  // black script wordmark on a transparent background.
  {
    id: "hello-again-properties",
    name: "Hello Again Properties",
    logoUrl: "/sponsors/hello-again-properties.png",
    tier: "digital",
    status: "active",
    url: "https://www.helloagainproperties.com/",
    termStart: "2026-05-01",
    termEnd: "2026-10-31",
  },
];
