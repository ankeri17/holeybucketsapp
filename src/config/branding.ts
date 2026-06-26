/**
 * ============================================================================
 * BRANDING CONFIG  —  Holey Buckets
 * ============================================================================
 *
 * This is the ONE file to edit to re-skin the whole app: name, tagline,
 * colors, parent brand, and the booking call-to-action link. You don't need
 * to touch any other file to change how the app looks or what the "Book again"
 * button points at.
 *
 * Colors are plain hex codes. After changing them, the whole app updates
 * because Tailwind reads this file (see tailwind.config.ts).
 * ----------------------------------------------------------------------------
 */

export const brand = {
  /** The product name shown across the app. */
  name: "Holey Buckets",

  /** A short, punny line under the name. Keep it playful. */
  tagline: "Bucket golf, officially scored.",

  /**
   * The umbrella brand / parent company behind the product. This is shown only
   * as a small credit (see `umbrellaCredit` below) — it is NOT the identity
   * players see throughout the app; that's always "Holey Buckets".
   *
   * Note: the *host* of a given location (e.g. Hello Again Properties at
   * Osceola) is NOT set here — a host belongs to its course, in the course
   * data (see src/config/courses/), because every course can have a different
   * host.
   */
  umbrellaBrand: "Four Irons",

  /** The exact small credit line shown in the footer / about. */
  umbrellaCredit: "A Four Irons Game",

  /**
   * The colors used throughout the app. These are deliberately bold, bright,
   * and summery — backyard-party energy. Swap the hex values to rebrand.
   */
  colors: {
    // Main brand color — buttons, highlights, headers.
    primary: "#0F9D58", // grass green
    // Secondary accent — sunny pop for chips, toggles, badges.
    accent: "#FFC400", // sunshine yellow
    // A warm splash for fun moments (wins, bonuses).
    pop: "#FF6F3C", // bucket orange
    // Deep text / dark surfaces.
    ink: "#13211B", // near-black green
    // App background.
    sand: "#FBF7EE", // warm off-white
  },

  /**
   * The "Book again" / "Set up your own course" call-to-action.
   * Booking and payments live OFF the app for now. Point this at whatever you
   * want — a contact email, a booking page, an Instagram DM link. Repointing it
   * later is a one-line change here.
   */
  bookingCta: {
    label: "Book your round",
    // Placeholder for now. Replace with the real booking/contact URL when ready.
    url: "https://helloagainproperties.com",
  },
} as const;

export type Brand = typeof brand;
