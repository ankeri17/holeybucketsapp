import type { Course, Hole, Sponsor, SponsorTier } from "./types";

/**
 * ============================================================================
 * GOOGLE SHEETS PARSING  —  the bridge between the owner's worksheets and
 * the app's Course / Sponsor data.
 * ============================================================================
 *
 * Everything here is a pure function (CSV text in → typed data out) so it's
 * easy to test; the actual fetching/caching lives in src/lib/liveData.ts.
 *
 * The parsers are built around the REAL worksheets the course is run from:
 *   - "holey-buckets-course-details" — Course Info tab + Hole Details tab
 *   - "gray-duck-sponsorship-tracker" — Sponsor Pipeline tab
 * but they match columns by header text, not position, so columns can be
 * added, reordered, or renamed slightly without breaking anything.
 * ----------------------------------------------------------------------------
 */

/** The CSV-export URL for one tab of a link-shared Google Sheet. */
export function sheetCsvUrl(sheetId: string, tabName: string): string {
  return (
    `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq` +
    `?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`
  );
}

/**
 * Google answers with an HTML page (a login screen or an error) instead of
 * CSV when the sheet isn't shared or isn't a native Google Sheet. Turn that
 * into a message a non-developer can act on.
 */
export function assertCsvResponse(text: string): void {
  const head = text.slice(0, 200).trim().toLowerCase();
  if (head.startsWith("<!doctype") || head.startsWith("<html")) {
    throw new Error(
      "Google returned a web page instead of data — the sheet is probably " +
        'not shared as "Anyone with the link", or is still an .xlsx file ' +
        "(use File → Save as Google Sheets).",
    );
  }
}

/**
 * Parse CSV text into rows of cells. Handles quoted cells, commas and line
 * breaks inside quotes, escaped quotes (""), and CRLF line endings — all of
 * which Google's CSV export produces.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++; // an escaped quote ("") inside a quoted cell
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }
  // The last line usually has no trailing newline.
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  // Drop rows that are entirely empty.
  return rows.filter((r) => r.some((c) => c.trim().length > 0));
}

/** Lowercase a header/label and squash punctuation, so matching is forgiving. */
function norm(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9#]+/g, " ")
    .trim();
}

/** Parse a positive integer out of a cell ("30", "30 yds" → 30), else undefined. */
function cellInt(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const match = value.match(/\d+/);
  if (!match) return undefined;
  const n = parseInt(match[0], 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/** A cell's trimmed text, or undefined when blank/missing. */
function cellText(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * Turn a Google Drive *share* link (the kind you copy from "Share → Copy
 * link") into a direct image URL the app can put in an <img> tag. Any other
 * URL passes through untouched, so plain image links keep working.
 */
export function driveImageUrl(link: string): string {
  const trimmed = link.trim();
  const match = trimmed.match(
    /drive\.google\.com\/(?:file\/d\/([-\w]{10,})|\S*[?&]id=([-\w]{10,}))/,
  );
  const id = match?.[1] ?? match?.[2];
  return id ? `https://lh3.googleusercontent.com/d/${id}` : trimmed;
}

/* ----------------------------------------------------------------------------
 * COURSE  (Course Info tab + Hole Details tab)
 * ------------------------------------------------------------------------- */

export interface CourseSheetResult {
  course: Course;
  /** Human-readable data-quality notes, shown in the admin panel. */
  warnings: string[];
}

/**
 * Build a Course from the worksheet tabs, layered on top of `base` (the
 * built-in course) so app-only fields the sheet doesn't know about — id,
 * course code, trackBalls, host — always survive.
 */
export function courseFromSheets(
  base: Course,
  courseInfoCsv: string | null,
  holeDetailsCsv: string,
): CourseSheetResult {
  const warnings: string[] = [];
  const { holes } = parseHoleDetails(holeDetailsCsv, warnings);
  const info = courseInfoCsv ? parseCourseInfo(courseInfoCsv) : {};

  if (holes.length === 0) {
    throw new Error(
      'No hole rows found — check that the "Hole Details" tab has a header ' +
        "row with Hole and Distance columns, and one row per hole below it.",
    );
  }
  if (holes.length !== base.holes.length) {
    warnings.push(
      `The sheet has ${holes.length} holes; the app was expecting ` +
        `${base.holes.length}. Scorecards assume a front and back nine.`,
    );
  }
  const seen = new Set<number>();
  for (const hole of holes) {
    if (seen.has(hole.number)) {
      warnings.push(`Hole ${hole.number} appears more than once in the sheet.`);
    }
    seen.add(hole.number);
  }
  const missingDistance = holes.filter((h) => h.distanceYards == null).length;
  if (missingDistance > 0) {
    warnings.push(`${missingDistance} hole(s) have no distance yet.`);
  }

  return {
    course: { ...base, ...info, holes },
    warnings,
  };
}

/** Find the Hole Details header row and map its columns, then read the holes. */
function parseHoleDetails(csv: string, warnings: string[]): { holes: Hole[] } {
  const rows = parseCsv(csv);

  // The tab has a banner row above the real header — find the header by its
  // content: a row with a "Hole" cell and a "Distance…" cell.
  let headerIndex = -1;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const cells = rows[i].map(norm);
    if (cells.includes("hole") && cells.some((c) => c.startsWith("distance"))) {
      headerIndex = i;
      break;
    }
  }
  if (headerIndex === -1) return { holes: [] };

  const header = rows[headerIndex].map(norm);
  const col = (predicate: (cell: string) => boolean) =>
    header.findIndex(predicate);

  const numberCol = col((c) => c === "hole");
  const nameCol = col((c) => c.startsWith("hole name"));
  const distanceCol = col((c) => c.startsWith("distance"));
  const parCol = col((c) => c === "par");
  const hazardsCol = col((c) => c.startsWith("hazard"));
  const difficultyCol = col((c) => c.startsWith("difficulty"));
  const teeLocationCol = col((c) => c.includes("tee") && c.includes("location"));
  const noteCol = col((c) => c.startsWith("tip") || c === "note");
  const photoCol = col((c) => c.includes("photo") && (c.includes("url") || c.includes("link")));

  // The app measures distance in yards (Hole.distanceYards). The worksheet's
  // header says what was actually recorded — flag it if it isn't yards.
  const distanceHeader = distanceCol >= 0 ? header[distanceCol] : "";
  if (distanceHeader.includes("pace")) {
    warnings.push(
      'The sheet\'s distance column says "paces", but the app shows yards — ' +
        "re-measure or relabel the column when convenient.",
    );
  }

  const holes: Hole[] = [];
  for (const row of rows.slice(headerIndex + 1)) {
    const number = cellInt(row[numberCol]);
    if (number == null || number > 99) continue; // not a hole row
    const hole: Hole = { number };
    const name = cellText(row[nameCol]);
    if (name) hole.name = name;
    const distance = cellInt(row[distanceCol]);
    if (distance != null) hole.distanceYards = distance;
    const par = cellInt(row[parCol]);
    if (par != null && par >= 1 && par <= 9) hole.par = par;
    const hazards = cellText(row[hazardsCol]);
    if (hazards) hole.hazards = hazards;
    const difficulty = cellInt(row[difficultyCol]);
    if (difficulty != null) hole.difficultyRank = difficulty;
    const teeLocation = cellText(row[teeLocationCol]);
    if (teeLocation) hole.teeLocation = teeLocation;
    const note = cellText(row[noteCol]);
    if (note) hole.note = note;
    const photo = cellText(row[photoCol]);
    if (photo) hole.teePhoto = driveImageUrl(photo);
    holes.push(hole);
  }

  if (photoCol === -1 && holes.length > 0) {
    warnings.push(
      'No "Photo URL" column found — add one to the Hole Details tab to ' +
        "give holes real tee photos (see the Photos section in the admin panel).",
    );
  }

  return { holes };
}

/**
 * The Course Info tab is label/value rows ("Course name" | "Grey Duck").
 * Read the labels we understand; ignore everything else.
 */
function parseCourseInfo(csv: string): Partial<Course> {
  const info: Partial<Course> = {};
  for (const row of parseCsv(csv)) {
    const labelIndex = row.findIndex((c) => c.trim().length > 0);
    if (labelIndex === -1) continue;
    const label = norm(row[labelIndex]);
    const value = cellText(row.slice(labelIndex + 1).find((c) => c.trim()));
    if (!value) continue;

    if (label.startsWith("course name")) info.name = value;
    else if (label.startsWith("location")) info.location = value;
    else if (label.includes("out of bounds")) info.outOfBounds = value;
    else if (label.includes("house rules")) info.houseRules = value;
    else if (label.includes("starting tee") || label.startsWith("best place"))
      info.startingTee = value;
    else if (label.includes("hero")) info.heroImage = driveImageUrl(value);
  }
  return info;
}

/* ----------------------------------------------------------------------------
 * SPONSORS  (Sponsor Pipeline tab, or a slimmed-down public sheet)
 * ------------------------------------------------------------------------- */

/**
 * A sponsor row as read from the sheet: a real app Sponsor (the shape every
 * placement component and the PDF consume — see src/lib/sponsors.ts), plus
 * the raw pipeline stage for the admin panel. The app's binary
 * active/lapsed status is derived: only "Active" and "Renewed" rows show
 * to players; every other stage (Lead, Contacted, Verbal Yes, Paid, …) is
 * treated as lapsed, i.e. hidden.
 */
export interface SheetSponsor extends Sponsor {
  /** The tracker's pipeline stage as written, e.g. "Verbal Yes". */
  pipeline: string;
}

/** "Osceola Hardware!" → "osceola-hardware" (a stable Sponsor id). */
function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "sponsor"
  );
}

/**
 * Read sponsor rows from the tracker. Deliberately narrow: only the
 * public-safe columns are ever read (never email/phone), and rows marked
 * "SAMPLE ROW" anywhere are skipped.
 */
export function sponsorsFromSheet(csv: string): SheetSponsor[] {
  const rows = parseCsv(csv);

  let headerIndex = -1;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const cells = rows[i].map(norm);
    if (cells.some((c) => c.startsWith("business name")) && cells.includes("status")) {
      headerIndex = i;
      break;
    }
  }
  if (headerIndex === -1) {
    throw new Error(
      'No sponsor header row found — expected columns "Business Name" and "Status".',
    );
  }

  const header = rows[headerIndex].map(norm);
  const nameCol = header.findIndex((c) => c.startsWith("business name"));
  const tierCol = header.findIndex((c) => c === "tier");
  const statusCol = header.findIndex((c) => c === "status");
  const holeCol = header.findIndex((c) => c.startsWith("hole"));
  const websiteCol = header.findIndex((c) => c.includes("website"));
  const logoCol = header.findIndex(
    (c) => c.includes("logo") && (c.includes("url") || c.includes("link")),
  );

  const sponsors: SheetSponsor[] = [];
  for (const row of rows.slice(headerIndex + 1)) {
    const name = cellText(row[nameCol]);
    if (!name) continue;
    if (row.some((c) => c.toLowerCase().includes("sample row"))) continue;

    const holeId = cellInt(row[holeCol]);
    const tierRaw = norm(row[tierCol] ?? "");
    const tier: SponsorTier = tierRaw.includes("hole")
      ? "hole"
      : tierRaw.includes("digital")
        ? "digital"
        : holeId != null
          ? "hole"
          : "digital";
    const pipeline = cellText(row[statusCol]) ?? "unknown";
    const stage = norm(pipeline);

    const sponsor: SheetSponsor = {
      id: slugify(name),
      name,
      tier,
      // The tracker's whole pipeline maps onto the app's binary switch:
      // Active/Renewed → show; anything else → hidden (= "lapsed").
      status: stage === "active" || stage === "renewed" ? "active" : "lapsed",
      pipeline,
    };
    if (holeId != null) sponsor.holeId = holeId;
    const website = cellText(row[websiteCol]);
    if (website) sponsor.url = website;
    const logo = cellText(row[logoCol]);
    if (logo) sponsor.logoUrl = driveImageUrl(logo);
    sponsors.push(sponsor);
  }
  return sponsors;
}
