import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guards the real sponsor config: importing the registry runs the loud
 * build/load validation, and every configured logo must actually exist in
 * /public/sponsors/ (the founder's whole job is "add one object + drop one
 * file" — this catches a missed or misnamed file before it ships).
 */

describe("sponsor config", () => {
  it("loads and validates without throwing", async () => {
    const { getSponsors } = await import("./index");
    expect(Array.isArray(getSponsors("osceola"))).toBe(true);
  });

  it("returns an empty list for an unknown course", async () => {
    const { getSponsors } = await import("./index");
    expect(getSponsors("nowhere")).toEqual([]);
  });

  it("every configured logoUrl points at a real file in /public", async () => {
    const { getSponsors } = await import("./index");
    const publicDir = path.resolve(__dirname, "../../../public");
    for (const sponsor of getSponsors("osceola")) {
      if (!sponsor.logoUrl) continue;
      expect(
        existsSync(path.join(publicDir, sponsor.logoUrl)),
        `logo file for "${sponsor.id}" (${sponsor.logoUrl}) is missing from /public`,
      ).toBe(true);
    }
  });
});
