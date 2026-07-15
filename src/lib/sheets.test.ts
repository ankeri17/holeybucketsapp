import { describe, expect, it } from "vitest";
import {
  activeSponsors,
  assertCsvResponse,
  courseFromSheets,
  driveImageUrl,
  drivePhotoUrl,
  holeSponsors,
  parseCsv,
  sheetCsvUrl,
  sponsorsFromSheet,
} from "./sheets";
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

const SPONSOR_CSV = [
  '"Business Name","Contact Name","Email","Phone","Tier","Status","Hole #","Price ($)","Billing","Notes"',
  '"Osceola Hardware","Pat Smith","pat@example.com","715-555-0101","Hole","Active","7","$300","Seasonal",""',
  '"River Coffee","Lee Jones","lee@example.com","715-555-0102","Digital","Active","","$50","Monthly",""',
  '"Sample Hardware Store","","","","Hole","Active","9","$300","Seasonal","SAMPLE ROW — replace with real sponsor"',
  '"Corner Bar","","","","Hole","Verbal Yes","12","$300","Seasonal",""',
  '"Old Sponsor","","","","Digital","Lapsed","","$50","Monthly",""',
].join("\n");

const BASE: Course = {
  id: "osceola",
  name: "The Gray Duck",
  code: "grayduck",
  location: "Osceola, WI",
  host: "Hello Again Properties",
  trackBalls: true,
  heroImage: "/courses/grayduck/hero.svg",
  distanceUnit: "yards",
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
  it("builds the gviz CSV url with headers=0 and the tab name encoded", () => {
    expect(sheetCsvUrl("abc123", "Hole Details")).toBe(
      "https://docs.google.com/spreadsheets/d/abc123/gviz/tq?tqx=out:csv&headers=0&sheet=Hole%20Details",
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

describe("drivePhotoUrl", () => {
  it("routes a Drive photo through the thumbnail endpoint (transcodes .heic, sizes down)", () => {
    expect(
      drivePhotoUrl("https://drive.google.com/file/d/1AbC_dEf-123456/view?usp=sharing"),
    ).toBe("https://drive.google.com/thumbnail?id=1AbC_dEf-123456&sz=w1600");
    expect(drivePhotoUrl("https://drive.google.com/open?id=1AbC_dEf-123456")).toBe(
      "https://drive.google.com/thumbnail?id=1AbC_dEf-123456&sz=w1600",
    );
  });

  it("passes non-Drive URLs through untouched", () => {
    expect(drivePhotoUrl("/courses/grayduck/hole-01.jpg")).toBe(
      "/courses/grayduck/hole-01.jpg",
    );
  });
});

describe("courseFromSheets", () => {
  it("reads holes from the real worksheet layout", () => {
    const { course } = courseFromSheets(BASE, COURSE_INFO_CSV, HOLE_DETAILS_CSV);
    expect(course.holes).toHaveLength(3);
    expect(course.holes[0]).toMatchObject({ number: 1, name: "Big Shot", distance: 30 });
    expect(course.holes[1]).toMatchObject({
      number: 3,
      name: "Them Apples",
      distance: 17,
      par: 2,
      hazards: "Apple trees, right",
      difficultyRank: 2,
      teeLocation: "Tee by the shed",
      note: "Aim low",
    });
    expect(course.holes[2].par).toBe(4);
  });

  it("takes the distance unit from the header and course info from its tab", () => {
    const paceBase = { ...BASE, distanceUnit: "paces" as const };
    const { course } = courseFromSheets(paceBase, COURSE_INFO_CSV, HOLE_DETAILS_CSV);
    expect(course.distanceUnit).toBe("yards"); // "Distance (yds)" wins over the base
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

  it("reads a Photo URL column and converts Drive links", () => {
    const csv = [
      '"Hole","Distance (paces)","Photo URL"',
      '"1","12","https://drive.google.com/file/d/1PhotoIdAbc123/view"',
    ].join("\n");
    const { course } = courseFromSheets(BASE, null, csv);
    expect(course.holes[0].teePhoto).toBe(
      "https://drive.google.com/thumbnail?id=1PhotoIdAbc123&sz=w1600",
    );
    expect(course.distanceUnit).toBe("paces");
  });

  it("finds the header when it sits on row 3, below a title and a blank row", () => {
    // Mirrors the owner's real Hole Details tab: a title, a spacer, then the
    // header on row 3, with a Photo URL column and photos on holes 17 & 18.
    const csv = [
      '"The Gray Duck — Hole Details","","",""',
      '"","","",""',
      '"Hole","Distance (yds)","Photo taken? (Y/N)","Photo URL"',
      '"17","39","Y","https://drive.google.com/file/d/17photoId000/view"',
      '"18","36","Y","https://drive.google.com/file/d/18photoId000/view"',
    ].join("\r\n");
    const { course } = courseFromSheets(BASE, null, csv);
    expect(course.holes.map((h) => h.number)).toEqual([17, 18]);
    expect(course.holes[0].teePhoto).toBe(
      "https://drive.google.com/thumbnail?id=17photoId000&sz=w1600",
    );
    expect(course.holes[1].teePhoto).toBe(
      "https://drive.google.com/thumbnail?id=18photoId000&sz=w1600",
    );
  });

  it("throws a fixable error when no hole rows are found", () => {
    expect(() => courseFromSheets(BASE, null, '"just","junk"')).toThrow(
      /Hole Details/,
    );
  });
});

describe("sponsorsFromSheet", () => {
  it("reads only public-safe fields and skips sample rows", () => {
    const sponsors = sponsorsFromSheet(SPONSOR_CSV);
    expect(sponsors.map((s) => s.name)).toEqual([
      "Osceola Hardware",
      "River Coffee",
      "Corner Bar",
      "Old Sponsor",
    ]);
    // Never any contact info, even though the sheet has those columns.
    for (const sponsor of sponsors) {
      expect(JSON.stringify(sponsor)).not.toMatch(/@|715-/);
    }
    expect(sponsors[0]).toEqual({
      name: "Osceola Hardware",
      tier: "hole",
      status: "active",
      holeNumber: 7,
    });
    expect(sponsors[2].status).toBe("verbalYes");
  });

  it("filters to what players should see and maps hole sponsors", () => {
    const sponsors = sponsorsFromSheet(SPONSOR_CSV);
    expect(activeSponsors(sponsors).map((s) => s.name)).toEqual([
      "Osceola Hardware",
      "River Coffee",
    ]);
    const byHole = holeSponsors(sponsors);
    expect(byHole.get(7)?.name).toBe("Osceola Hardware");
    expect(byHole.has(12)).toBe(false); // verbal yes ≠ live in the app
  });

  it("throws a fixable error when the header row is missing", () => {
    expect(() => sponsorsFromSheet('"nope","nothing"')).toThrow(/Business Name/);
  });
});
