import type { Course } from "@/lib/types";

/**
 * ============================================================================
 * OSCEOLA COURSE  —  THE GRAY DUCK
 * ============================================================================
 *
 * Real course data, from the owner's "holey-buckets-course-details" worksheet
 * (walked and filled in on the property). This file is the app's built-in
 * copy: when the Google Sheet is connected (see src/config/sheets.ts) the app
 * reads the LIVE sheet and this file is only the offline fallback — so the
 * normal way to update the course is to edit the sheet, not this file.
 *
 * If you do edit here, the fields are:
 *   - `number`    the hole's number, 1–18  (required)
 *   - `name`      a fun name in quotes      (optional)
 *   - `distance`  tee→bucket, in the course's distanceUnit (yards here)
 *   - `par`       only when it isn't 3 — every hole defaults to par 3
 *   - `hazards` / `note` / `teeLocation` / `difficultyRank` — optional extras
 * Keep each hole inside { curly braces } and end it with a comma.
 * ----------------------------------------------------------------------------
 */
export const osceola: Course = {
  id: "osceola",
  name: "The Gray Duck", // shown to players
  code: "grayduck", // short code for "enter a course code" / QR join later
  location: "Osceola, WI",
  host: "Hello Again Properties", // the host of this location (per-course, not a global brand)
  isPublic: true, // the flagship is publicly listed
  trackBalls: true, // The Gray Duck charges per ball, so tally balls used/lost
  // Course hero image. Swap this for the real course photo (drop the file in
  // /public/courses/grayduck/ and point this at it, or set a Photo URL in the sheet).
  heroImage: "/courses/grayduck/hero.svg",
  // The worksheet measured distances in yards.
  distanceUnit: "yards",
  outOfBounds: "OB: farmer field, road, driveway, tall brush",
  houseRules: "Tee off from the black honeycomb mat.",
  startingTee: "Start at either hole 1 or hole 10.",
  holes: [
    { number: 1, name: "Big Shot", distance: 30 },
    { number: 2, name: "In the Clear", distance: 36 },
    { number: 3, name: "Them Apples", distance: 17, par: 2 },
    { number: 4, name: "Roi", distance: 34 },
    { number: 5, name: "Fire", distance: 38, par: 4 },
    { number: 6, name: "Troll", distance: 30 },
    { number: 7, name: "Air", distance: 23 },
    { number: 8, name: "Sweet", distance: 16, par: 2 },
    { number: 9, name: "Temple Time", distance: 41, par: 4 },
    { number: 10, name: "Gunner", distance: 40, par: 4 },
    { number: 11, name: "Out of the Woods", distance: 25 },
    { number: 12, name: "Short Drive", distance: 15, par: 2 },
    { number: 13, name: "Shi Ter Ful", distance: 34 },
    { number: 14, name: "Shrug", distance: 33 },
    { number: 15, name: "Ooofff", distance: 15, par: 2 },
    { number: 16, name: "#27", distance: 27 },
    { number: 17, name: "Deck Party", distance: 39, par: 4 },
    { number: 18, name: "Hello Again", distance: 36 },
  ],
};
