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
  // Tee photos are from Scotty's walk-through (July 10), converted for the web
  // with location metadata stripped. Holes 17–18 had no photo in the batch, so
  // they fall back to the placeholder until those are shot and confirmed.
  holes: [
    { number: 1, name: "Big Shot", par: 3, distanceYards: 30, teePhoto: "/courses/grayduck/hole-01.jpg" },
    { number: 2, name: "In the Clear", par: 3, distanceYards: 36, teePhoto: "/courses/grayduck/hole-02.jpg" },
    { number: 3, name: "Them Apples", par: 2, distanceYards: 17, teePhoto: "/courses/grayduck/hole-03.jpg" },
    { number: 4, name: "Roi", par: 3, distanceYards: 34, teePhoto: "/courses/grayduck/hole-04.jpg" },
    { number: 5, name: "Fire", par: 4, distanceYards: 38, teePhoto: "/courses/grayduck/hole-05.jpg" },
    { number: 6, name: "Troll", par: 3, distanceYards: 30, teePhoto: "/courses/grayduck/hole-06.jpg" },
    { number: 7, name: "Air", par: 3, distanceYards: 23, teePhoto: "/courses/grayduck/hole-07.jpg" },
    { number: 8, name: "Sweet", par: 2, distanceYards: 16, teePhoto: "/courses/grayduck/hole-08.jpg" },
    { number: 9, name: "Temple Time", par: 4, distanceYards: 41, teePhoto: "/courses/grayduck/hole-09.jpg" },
    { number: 10, name: "Gunner", par: 4, distanceYards: 40, teePhoto: "/courses/grayduck/hole-10.jpg" },
    { number: 11, name: "Out of the Woods", par: 3, distanceYards: 25, teePhoto: "/courses/grayduck/hole-11.jpg" },
    { number: 12, name: "Short Drive", par: 2, distanceYards: 15, teePhoto: "/courses/grayduck/hole-12.jpg" },
    { number: 13, name: "Shi Ter Ful", par: 3, distanceYards: 34, teePhoto: "/courses/grayduck/hole-13.jpg" },
    { number: 14, name: "Shrug", par: 3, distanceYards: 33, teePhoto: "/courses/grayduck/hole-14.jpg" },
    { number: 15, name: "Ooofff", par: 2, distanceYards: 15, teePhoto: "/courses/grayduck/hole-15.jpg" },
    { number: 16, name: "#27", par: 3, distanceYards: 27, teePhoto: "/courses/grayduck/hole-16.jpg" },
    { number: 17, name: "Deck Party", par: 4, distanceYards: 39 },
    { number: 18, name: "Hello Again", par: 3, distanceYards: 36 },
  ],
};
