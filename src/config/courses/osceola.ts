import type { Course } from "@/lib/types";

/**
 * ============================================================================
 * OSCEOLA COURSE  —  THE GREY DUCK (real data from the owner's worksheet)
 * ============================================================================
 *
 * Real course data, from the owner's "holey-buckets-course-details" worksheet
 * (walked and filled in on the property). This file is the app's built-in
 * copy: when the Google Sheet is connected (see src/config/sheets.ts) the app
 * reads the LIVE sheet and this file is only the offline fallback — so the
 * normal way to update the course is to edit the sheet, not this file.
 *
 * The course is NOT all par 3s — it mixes par 2s, 3s, and 4s (total par 54).
 *
 * If you do edit here (you don't need to be a developer):
 *   - `number`    the hole's number, 1–18  (required)
 *   - `name`      a fun name in quotes      (optional)
 *   - `distance`  tee→bucket, in the course's distanceUnit (yards here)
 *   - `par`       only when it isn't 3 — every hole defaults to par 3
 *   - `hazards` / `note` / `teeLocation` / `difficultyRank` — optional extras
 *   - `teePhoto`  "/courses/grayduck/hole-NN.jpg" (or set a Photo URL in the sheet)
 * Keep each hole inside { curly braces } and end it with a comma.
 * ----------------------------------------------------------------------------
 */
export const osceola: Course = {
  id: "osceola",
  name: "Grey Duck", // as written on the owner's worksheet
  code: "grayduck", // short code for "enter a course code" / QR join later
  location: "Osceola, Wisconsin",
  host: "Hello Again Properties", // the host of this location (per-course, not a global brand)
  isPublic: true, // the flagship is publicly listed
  trackBalls: true, // The Grey Duck charges per ball, so tally balls used/lost
  // Course hero image. Swap this for the real course photo (drop the file in
  // /public/courses/grayduck/ and point this at it, or set a Photo URL in the sheet).
  heroImage: "/courses/grayduck/hero.svg",
  // The worksheet measured distances in yards.
  distanceUnit: "yards",
  // From the worksheet's Course Info tab — one continuous 18.
  outOfBounds: "Farmer field, road, driveway, and tall brush",
  houseRules: "Tee off from the black honeycomb mat",
  startingTee: "Start at either hole 1 or hole 10",
  // Tee photos are from Scotty's walk-through (July 10), converted for the web
  // with location metadata stripped. Holes 17–18 had no photo in the batch, so
  // they fall back to the placeholder until those are shot and confirmed.
  holes: [
    { number: 1, name: "Big Shot", distance: 30, teePhoto: "/courses/grayduck/hole-01.jpg" },
    { number: 2, name: "In the Clear", distance: 36, teePhoto: "/courses/grayduck/hole-02.jpg" },
    { number: 3, name: "Them Apples", distance: 17, par: 2, teePhoto: "/courses/grayduck/hole-03.jpg" },
    { number: 4, name: "Roi", distance: 34, teePhoto: "/courses/grayduck/hole-04.jpg" },
    { number: 5, name: "Fire", distance: 38, par: 4, teePhoto: "/courses/grayduck/hole-05.jpg" },
    { number: 6, name: "Troll", distance: 30, teePhoto: "/courses/grayduck/hole-06.jpg" },
    { number: 7, name: "Air", distance: 23, teePhoto: "/courses/grayduck/hole-07.jpg" },
    { number: 8, name: "Sweet", distance: 16, par: 2, teePhoto: "/courses/grayduck/hole-08.jpg" },
    { number: 9, name: "Temple Time", distance: 41, par: 4, teePhoto: "/courses/grayduck/hole-09.jpg" },
    { number: 10, name: "Gunner", distance: 40, par: 4, teePhoto: "/courses/grayduck/hole-10.jpg" },
    { number: 11, name: "Out of the Woods", distance: 25, teePhoto: "/courses/grayduck/hole-11.jpg" },
    { number: 12, name: "Short Drive", distance: 15, par: 2, teePhoto: "/courses/grayduck/hole-12.jpg" },
    { number: 13, name: "Shi Ter Ful", distance: 34, teePhoto: "/courses/grayduck/hole-13.jpg" },
    { number: 14, name: "Shrug", distance: 33, teePhoto: "/courses/grayduck/hole-14.jpg" },
    { number: 15, name: "Ooofff", distance: 15, par: 2, teePhoto: "/courses/grayduck/hole-15.jpg" },
    { number: 16, name: "#27", distance: 27, teePhoto: "/courses/grayduck/hole-16.jpg" },
    { number: 17, name: "Deck Party", distance: 39, par: 4 },
    { number: 18, name: "Hello Again", distance: 36 },
  ],
};
