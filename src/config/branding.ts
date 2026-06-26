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
   * The official Holey Buckets color palette — the design tokens the whole app
   * themes from. Swap the hex values here to rebrand; every screen, the
   * leaderboard colors, and the shareable image all follow this one file.
   * (These are also published as CSS variables — see src/app/layout.tsx.)
   */
  colors: {
    // — Core brand —
    primary: "#1E9B4E", // Fairway green — primary buttons, active toggles
    deepPine: "#14622F", // pressed/hover green; green text on cream
    sunshine: "#F6B92C", // secondary CTA, highlights, celebration (ink text only)
    bucketBlue: "#2E9BD6", // playful accent, links, "chipped in" moments

    // — Neutrals —
    cream: "#F7F3E8", // app background
    card: "#FFFFFF", // card / surface backgrounds
    ink: "#1B1C18", // primary text & headings
    stone: "#6E6E66", // secondary text, labels, captions
    line: "#E6E0D2", // borders, dividers on cream

    // — Scoring semantics —
    // Under-par / chip-in bonus reuses Fairway green (primary).
    penalty: "#E0682E", // foliage (+1) and over-par — clay, not red
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
