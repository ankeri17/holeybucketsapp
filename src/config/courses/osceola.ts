import type { Course } from "@/lib/types";

/**
 * ============================================================================
 * OSCEOLA COURSE  —  THE GREY DUCK (real data from the owner's worksheet)
 * ============================================================================
 *
 * 👉 This is the file to edit to update the Osceola course.
 *
 * The holes below come from the completed "Course Details Worksheet"
 * (July 2026): real names, distances in yards, and per-hole pars. Note the
 * course is NOT all par 3s — it mixes par 2s, 3s, and 4s (total par 54).
 *
 * How to edit a hole (you don't need to be a developer):
 *   - `number`        the hole's number, 1–18  (required)
 *   - `name`          a fun name in quotes      (optional)
 *   - `par`           par for the hole, 2–4     (optional, defaults to 3)
 *   - `distanceYards` tee→bucket in yards       (optional, a whole number)
 *   - `hazards`       what to watch out for      (optional, free text in quotes)
 *   - `difficultyRank` 1 = hardest hole          (optional, used later for handicaps)
 *   - `note`          a tip shown to players      (optional, free text in quotes)
 *
 * Still waiting on from the worksheet (blank for every hole, add when known):
 * per-hole hazards, difficulty ranks, tee/bucket locations, and tips.
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
  // /public/courses/grayduck/ and point this at it).
  heroImage: "/courses/grayduck/hero.svg",
  // From the worksheet's Course Info tab — one continuous 18.
  outOfBounds: "Farmer field, road, driveway, and tall brush",
  houseRules: "Tee off from the black honeycomb mat",
  startingTee: "Start at either hole 1 or hole 10",
  holes: [
    { number: 1, name: "Big Shot", par: 3, distanceYards: 30 },
    { number: 2, name: "In the Clear", par: 3, distanceYards: 36 },
    { number: 3, name: "Them Apples", par: 2, distanceYards: 17 },
    { number: 4, name: "Roi", par: 3, distanceYards: 34 },
    { number: 5, name: "Fire", par: 4, distanceYards: 38 },
    { number: 6, name: "Troll", par: 3, distanceYards: 30 },
    { number: 7, name: "Air", par: 3, distanceYards: 23 },
    { number: 8, name: "Sweet", par: 2, distanceYards: 16 },
    { number: 9, name: "Temple Time", par: 4, distanceYards: 41 },
    { number: 10, name: "Gunner", par: 4, distanceYards: 40 },
    { number: 11, name: "Out of the Woods", par: 3, distanceYards: 25 },
    { number: 12, name: "Short Drive", par: 2, distanceYards: 15 },
    { number: 13, name: "Shi Ter Ful", par: 3, distanceYards: 34 },
    { number: 14, name: "Shrug", par: 3, distanceYards: 33 },
    { number: 15, name: "Ooofff", par: 2, distanceYards: 15 },
    { number: 16, name: "#27", par: 3, distanceYards: 27 },
    { number: 17, name: "Deck Party", par: 4, distanceYards: 39 },
    { number: 18, name: "Hello Again", par: 3, distanceYards: 36 },
  ],
};
