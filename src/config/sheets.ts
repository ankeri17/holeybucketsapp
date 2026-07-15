/**
 * ============================================================================
 * GOOGLE SHEETS + ADMIN CONFIG  —  Holey Buckets
 * ============================================================================
 *
 * This file connects the app to the Google Sheets the course is run from, and
 * holds the secret admin URL. It's the ONE file to edit to hook up (or move)
 * the sheets.
 *
 * HOW THE INTEGRATION WORKS
 * The app reads the sheets directly from the player's browser — no server, no
 * API keys, no Google login inside the app. That works when a spreadsheet is
 * a *native Google Sheet* shared as "Anyone with the link (Viewer)". Editing
 * still happens in Google Sheets itself, protected by the owner's normal
 * Google account — which is why the app needs no credential management.
 *
 * CONNECTING A SHEET (one-time, ~2 minutes — also shown in the admin panel):
 *   1. In Google Drive, open the worksheet. If it's an .xlsx file, use
 *      File → Save as Google Sheets (the app can only read native Sheets).
 *   2. Share → General access → "Anyone with the link" → Viewer.
 *   3. Copy the long ID from the sheet's address bar — the part between
 *      /d/ and /edit — and paste it below.
 *
 * If an ID below is empty the app simply uses the course data built into
 * src/config/courses/ — nothing breaks.
 * ----------------------------------------------------------------------------
 */

export const sheetsConfig = {
  /**
   * The secret part of the admin URL. The admin panel lives at
   *   https://<the-site>/admin/<adminKey>
   * Anyone with the full URL is "logged in" — so treat the URL like a key,
   * share it only with staff, and change this string to lock everyone out
   * and re-share a new link. (Real accounts can come in Phase 2.)
   */
  adminKey: "grayduck-19th-hole",

  /**
   * The course details worksheet ("holey-buckets-course-details") — the one
   * with the Course Info and Hole Details tabs. Paste its sheet ID here.
   */
  courseSheetId: "1KTEQXxZChQ2W8dcBhAdgCNyoD-Lz-X24HQaYJWR0KzY",
  courseInfoTab: "Course Info",
  holeDetailsTab: "Hole Details",

  /**
   * The sponsor sheet. ⚠️ The full sponsorship tracker contains sponsor
   * emails and phone numbers — sharing it "anyone with the link" would make
   * those readable by anyone who finds the ID. RECOMMENDED: make a small,
   * separate Google Sheet with only the public columns
   *   Business Name | Tier | Status | Hole # | Website | Logo URL
   * (copy rows over, or use IMPORTRANGE), share THAT one, and paste its ID
   * here. The app never reads contact columns either way, but the safe-sheet
   * route means they're never exposed at all.
   */
  sponsorSheetId: "1j9VDZbnt81uKEDWW2CDRYW7xl34W8WvL5Y-kgvELcWE",
  sponsorTab: "Sponsor Pipeline",

  /**
   * Handy links shown as buttons in the admin panel. These just open Google
   * Drive — Google's own permissions decide who can actually see them.
   */
  links: {
    courseWorksheet:
      "https://docs.google.com/spreadsheets/d/1KTEQXxZChQ2W8dcBhAdgCNyoD-Lz-X24HQaYJWR0KzY/edit",
    sponsorTracker:
      "https://docs.google.com/spreadsheets/d/1j9VDZbnt81uKEDWW2CDRYW7xl34W8WvL5Y-kgvELcWE/edit",
    photosFolder:
      "https://drive.google.com/drive/folders/1GyrLeSKzHN6oGiWHHqyqWGwAg0oNd4Pg",
  },
} as const;
