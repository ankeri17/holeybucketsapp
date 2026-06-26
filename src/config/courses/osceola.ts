import type { Course } from "@/lib/types";

/**
 * ============================================================================
 * OSCEOLA COURSE  —  PLACEHOLDER DATA
 * ============================================================================
 *
 * 👉 This is the file to edit to set up the real Osceola course.
 *
 * The hole names, distances, and hazards below are PLACEHOLDERS, invented so
 * the app has a full 18-hole course to run against today. When the property
 * owner's worksheet comes back with the real layout, replace the holes here.
 * Nothing else in the app needs to change — that's the whole point of keeping
 * the course in this one file.
 *
 * How to edit a hole (you don't need to be a developer):
 *   - `number`        the hole's number, 1–18  (required)
 *   - `name`          a fun name in quotes      (optional)
 *   - `distancePaces` how many paces tee→bucket (optional, a whole number)
 *   - `hazards`       what to watch out for      (optional, free text in quotes)
 *   - `difficultyRank` 1 = hardest hole          (optional, used later for handicaps)
 *   - `note`          a tip shown to players      (optional, free text in quotes)
 *
 * Every hole is a par 3 automatically — you don't need to set par.
 * Keep each hole inside { curly braces } and end it with a comma.
 * ----------------------------------------------------------------------------
 */
export const osceola: Course = {
  id: "osceola",
  name: "The Gray Duck", // the real course name (shown to players, not "Holey Buckets at Osceola")
  code: "grayduck", // short code for "enter a course code" / QR join later
  location: "Osceola, WI",
  host: "Hello Again Properties", // the host of this location (per-course, not a global brand)
  isPublic: true, // the flagship is publicly listed
  trackBalls: true, // The Gray Duck charges per ball, so tally balls used/lost
  holes: [
    { number: 1, name: "The Warm-Up", distancePaces: 12, difficultyRank: 14, note: "Gentle opener — find your swing." },
    { number: 2, name: "Deck Party", distancePaces: 16, hazards: "Out of bounds left past the deck", difficultyRank: 9 },
    { number: 3, name: "The Outhouse", distancePaces: 20, hazards: "Bushes behind the bucket", difficultyRank: 4 },
    { number: 4, name: "Birch Alley", distancePaces: 15, hazards: "Tree line both sides", difficultyRank: 7 },
    { number: 5, name: "Lily Dip", distancePaces: 22, hazards: "Water short and right", difficultyRank: 2 },
    { number: 6, name: "The Slope", distancePaces: 14, difficultyRank: 12, note: "Ground falls away — don't go long." },
    { number: 7, name: "Firepit", distancePaces: 18, hazards: "Firepit ring is a no-drop zone", difficultyRank: 6 },
    { number: 8, name: "Shed Shot", distancePaces: 13, hazards: "Shed wall behind", difficultyRank: 15 },
    { number: 9, name: "The Turn", distancePaces: 19, difficultyRank: 8, note: "Halfway — grab a drink." },
    { number: 10, name: "Hammock Hang", distancePaces: 17, hazards: "Trees and the hammock", difficultyRank: 10 },
    { number: 11, name: "Garden Gauntlet", distancePaces: 21, hazards: "Veggie garden, drop no closer", difficultyRank: 3 },
    { number: 12, name: "Stump City", distancePaces: 15, hazards: "Old stumps short", difficultyRank: 13 },
    { number: 13, name: "The Long Haul", distancePaces: 25, difficultyRank: 1, note: "Longest hole on the course." },
    { number: 14, name: "Picnic Pitch", distancePaces: 16, hazards: "Picnic table is in play", difficultyRank: 11 },
    { number: 15, name: "Creek Crossing", distancePaces: 23, hazards: "Creek short of the bucket", difficultyRank: 5 },
    { number: 16, name: "The Mound", distancePaces: 14, difficultyRank: 16, note: "Bucket sits up on a mound." },
    { number: 17, name: "Fence Line", distancePaces: 18, hazards: "Property fence long", difficultyRank: 17 },
    { number: 18, name: "Holey Finish", distancePaces: 20, hazards: "Flower beds left", difficultyRank: 18, note: "Last hole — chip it in for the win!" },
  ],
};
