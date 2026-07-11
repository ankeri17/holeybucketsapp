import { describe, expect, it } from "vitest";
import {
  assertCsvResponse,
  courseFromSheets,
  driveImageUrl,
  parseCsv,
  sheetCsvUrl,
  sponsorsFromSheet,
} from "./sheets";
import { activeSponsors, holeSponsor } from "./sponsors";
import type { Course } from "./types";

/* ----------------------------------------------------------------------------
 * Fixtures — shaped like the REAL worksheets (banner row above the header,
 * every cell quoted, the way Google's CSV export writes them).
 * ------------------------------------------------------------------------- */

const HOLE_DETAILS_CSV = [
  '"Hole Details — one row per hole","","","","","","","",""',
  '"Hole","Hole Name (optional)","Distance (yds)","Par","Hazards / Obstacles","Difficulty Rank (1-5) (1 = hardest)","Tee & Bucket Location","Tip / Note (optional)","Photo taken? (Y/N)"',
  '"1","Big Shot","30","3","","","","",""',
  '"3","Them Apples","17","2","Apple trees, right","2","Tee by the shed","Aim low",""',
  '"5","Fire","38","4","","","","Longest carry, watch the wind",""',
].join("\r\n");

const COURSE_INFO_CSV = [
  '"","Course Info (fill in once)",""',
  '"","Course name","Grey Duck"',
  '"","Location (city, state)","Osceola, Wisconsin"',
  '"","Number of holes (confirm 18?)","18"',
  '"","Out-of-bounds / safety — what should players NOT aim at? (road, lake, neighbor\'s yard, firepit, etc.)","OB: Farmer Field, Road, Driveway, Tall Brush"',
  '"","House rules — anything specific to this course?","Tee off from black honeycomb mat"',
  '"","Best place for the starting tee / where a group begins","Start at either hole 1 or hole 10."',
].join("\n");

// Mirrors the REAL Sponsorship Tracker (July 2026): a Website column that
// sometimes holds a note instead of a link, and rows sitting at "Paid".
const SPONSOR_CSV = [
  '"Business Name","Contact Name","Email","Website","Phone","Tier","Status","Hole #","Price ($)","Billing","Notes"',
  '"Placeholder Hardware Store","Pat Smith","pat@example.com","(use black and white sample typography)","715-555-0101","Hole","Paid","1","$0","Seasonal","Placeholder for a hole placement in the app"',
  '"Hello Again Properties","Scotty Hagen","scotty@example.com","https://www.helloagainproperties.com/","","Digital","Paid","","$0","Monthly","Location Sponsor"',
  '"Sample Hardware Store","","","","","Hole","Active","9","$300","Seasonal","SAMPLE ROW — replace with real sponsor"',
  '"Corner Bar","","","www.cornerbar.example","","Hole","Verbal Yes","12","$300","Seasonal",""',
  '"Old Sponsor","","","","","Digital","Lapsed","","$50","Monthly",""',
].join("\n");

const BASE: Course = {
  id: "osceola",
  name: "Grey Duck",
  code: "grayduck",
  location: "Osceola, Wisconsin",
  host: "Hello Again Properties",
  trackBalls: true,
  heroImage: "/courses/grayduck/hero.svg",
  holes: [{ number: 1 }, { number: 2 }, { number: 3 }],
};

describe("parseCsv", () => {
  it("handles quoted cells with commas, escaped quotes, and CRLF", () => {
    const rows = parseCsv('"a,b","say ""hi""",plain\r\n"line\nbreak","x",""');
    expect(rows).toEqual([
      ['a,b', 'say "hi"', "plain"],
      ["line\nbreak", "x", ""],
    ]);
  });

  it("drops fully empty rows", () => {
    expect(parseCsv('a,b\n"",""\nc,d')).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
  });
});

describe("assertCsvResponse", () => {
  it("rejects an HTML login page with a fixable message", () => {
    expect(() => assertCsvResponse("<!DOCTYPE html><html>…")).toThrow(
      /Anyone with the link/,
    );
  });

  it("accepts CSV", () => {
    expect(() => assertCsvResponse('"Hole","Par"')).not.toThrow();
  });
});

describe("sheetCsvUrl", () => {
  it("builds the gviz CSV url with the tab name encoded", () => {
    expect(sheetCsvUrl("abc123", "Hole Details")).toBe(
      "https://docs.google.com/spreadsheets/d/abc123/gviz/tq?tqx=out:csv&sheet=Hole%20Details",
    );
  });
});

describe("driveImageUrl", () => {
  it("converts a Drive share link to a direct image URL", () => {
    expect(
      driveImageUrl("https://drive.google.com/file/d/1AbC_dEf-123456/view?usp=sharing"),
    ).toBe("https://lh3.googleusercontent.com/d/1AbC_dEf-123456");
    expect(driveImageUrl("https://drive.google.com/open?id=1AbC_dEf-123456")).toBe(
      "https://lh3.googleusercontent.com/d/1AbC_dEf-123456",
    );
  });

  it("passes non-Drive URLs through untouched", () => {
    expect(driveImageUrl("/courses/grayduck/hero.svg")).toBe(
      "/courses/grayduck/hero.svg",
    );
    expect(driveImageUrl("https://example.com/pic.jpg")).toBe(
      "https://example.com/pic.jpg",
    );
  });
});

describe("courseFromSheets", () => {
  it("reads holes from the real worksheet layout", () => {
    const { course } = courseFromSheets(BASE, COURSE_INFO_CSV, HOLE_DETAILS_CSV);
    expect(course.holes).toHaveLength(3);
    expect(course.holes[0]).toMatchObject({
      number: 1,
      name: "Big Shot",
      distanceYards: 30,
    });
    expect(course.holes[1]).toMatchObject({
      number: 3,
      name: "Them Apples",
      distanceYards: 17,
      par: 2,
      hazards: "Apple trees, right",
      difficultyRank: 2,
      teeLocation: "Tee by the shed",
      note: "Aim low",
    });
    expect(course.holes[2].par).toBe(4);
  });

  it("reads course info from its tab", () => {
    const { course } = courseFromSheets(BASE, COURSE_INFO_CSV, HOLE_DETAILS_CSV);
    expect(course.name).toBe("Grey Duck");
    expect(course.location).toBe("Osceola, Wisconsin");
    expect(course.outOfBounds).toBe("OB: Farmer Field, Road, Driveway, Tall Brush");
    expect(course.houseRules).toBe("Tee off from black honeycomb mat");
    expect(course.startingTee).toBe("Start at either hole 1 or hole 10.");
  });

  it("keeps app-only fields from the base course", () => {
    const { course } = courseFromSheets(BASE, COURSE_INFO_CSV, HOLE_DETAILS_CSV);
    expect(course.id).toBe("osceola");
    expect(course.code).toBe("grayduck");
    expect(course.trackBalls).toBe(true);
    expect(course.host).toBe("Hello Again Properties");
  });

  it("warns about hole-count mismatches and missing photo column", () => {
    const { warnings } = courseFromSheets(
      { ...BASE, holes: Array.from({ length: 18 }, (_, i) => ({ number: i + 1 })) },
      null,
      HOLE_DETAILS_CSV,
    );
    expect(warnings.join(" ")).toMatch(/3 holes.*expecting 18/);
    expect(warnings.join(" ")).toMatch(/Photo URL/);
  });

  it("warns when the sheet measured paces instead of yards", () => {
    const csv = ['"Hole","Distance (paces)"', '"1","12"'].join("\n");
    const { course, warnings } = courseFromSheets(BASE, null, csv);
    expect(course.holes[0].distanceYards).toBe(12);
    expect(warnings.join(" ")).toMatch(/paces/);
  });

  it("reads a Photo URL column and converts Drive links", () => {
    const csv = [
      '"Hole","Distance (yds)","Photo URL"',
      '"1","12","https://drive.google.com/file/d/1PhotoIdAbc123/view"',
    ].join("\n");
    const { course } = courseFromSheets(BASE, null, csv);
    expect(course.holes[0].teePhoto).toBe(
      "https://lh3.googleusercontent.com/d/1PhotoIdAbc123",
    );
  });

  it("throws a fixable error when no hole rows are found", () => {
    expect(() => courseFromSheets(BASE, null, '"just","junk"')).toThrow(
      /Hole Details/,
    );
  });
});

describe("sponsorsFromSheet", () => {
  it("maps rows to app sponsors (public-safe fields only) and skips samples", () => {
    const sponsors = sponsorsFromSheet(SPONSOR_CSV);
    expect(sponsors.map((s) => s.name)).toEqual([
      "Placeholder Hardware Store",
      "Hello Again Properties",
      "Corner Bar",
      "Old Sponsor",
    ]);
    // Never any contact info, even though the sheet has those columns.
    for (const sponsor of sponsors) {
      expect(JSON.stringify(sponsor)).not.toMatch(/@|715-/);
    }
    // Ids line up with src/config/sponsors/ so logos can be inherited.
    expect(sponsors[0]).toEqual({
      id: "placeholder-hardware-store",
      name: "Placeholder Hardware Store",
      tier: "hole",
      status: "active", // Paid rows render — matches the config's entries
      holeId: 1,
      pipeline: "Paid",
    });
    // Pipeline stages that aren't live map to the app's "hidden" status but
    // keep their stage label for the admin panel.
    expect(sponsors[2]).toMatchObject({ status: "lapsed", pipeline: "Verbal Yes" });
  });

  it("only accepts real links from the Website column", () => {
    const sponsors = sponsorsFromSheet(SPONSOR_CSV);
    // "(use black and white sample typography)" is a note, not a URL.
    expect(sponsors[0].url).toBeUndefined();
    expect(sponsors[1].url).toBe("https://www.helloagainproperties.com/");
    // bare www. gets a scheme so the link actually opens
    expect(sponsors[2].url).toBe("https://www.cornerbar.example");
  });

  it("plugs into the app's own sponsor helpers", () => {
    const sponsors = sponsorsFromSheet(SPONSOR_CSV);
    expect(activeSponsors(sponsors).map((s) => s.name)).toEqual([
      "Placeholder Hardware Store",
      "Hello Again Properties",
    ]);
    expect(holeSponsor(sponsors, 1)?.name).toBe("Placeholder Hardware Store");
    expect(holeSponsor(sponsors, 12)).toBeUndefined(); // verbal yes ≠ live
  });

  it("throws a fixable error when the header row is missing", () => {
    expect(() => sponsorsFromSheet('"nope","nothing"')).toThrow(/Business Name/);
  });
});
