import { describe, expect, it } from "vitest";
import {
  activeSponsors,
  activeHoleSponsors,
  activeDigitalSponsors,
  holeSponsor,
  sponsorHref,
  validateSponsors,
} from "./sponsors";
import type { Course, Sponsor } from "./types";

/**
 * Sponsor placement rules: only active sponsors show anywhere (the "lapsed"
 * kill switch), a hole is sold at most once, and bad references fail loudly
 * at build/load instead of quietly shipping a broken placement.
 */

const course: Course = {
  id: "test",
  name: "Test Course",
  location: "Testville",
  holes: [{ number: 1 }, { number: 2 }, { number: 3 }],
};

function sponsor(overrides: Partial<Sponsor>): Sponsor {
  return {
    id: "s1",
    name: "Sponsor One",
    tier: "digital",
    status: "active",
    ...overrides,
  };
}

describe("active-sponsor filters (the lapsed kill switch)", () => {
  const list: Sponsor[] = [
    sponsor({ id: "h1", tier: "hole", holeNumber: 2 }),
    sponsor({ id: "h2", tier: "hole", holeNumber: 1, status: "lapsed" }),
    sponsor({ id: "d1", tier: "digital" }),
    sponsor({ id: "d2", tier: "digital", status: "lapsed" }),
  ];

  it("activeSponsors drops every lapsed sponsor", () => {
    expect(activeSponsors(list).map((s) => s.id)).toEqual(["h1", "d1"]);
  });

  it("activeHoleSponsors keeps only active hole sponsors, in hole order", () => {
    const holes = activeHoleSponsors([
      sponsor({ id: "b", tier: "hole", holeNumber: 3 }),
      sponsor({ id: "a", tier: "hole", holeNumber: 1 }),
      sponsor({ id: "lapsed", tier: "hole", holeNumber: 2, status: "lapsed" }),
    ]);
    expect(holes.map((s) => s.id)).toEqual(["a", "b"]);
  });

  it("activeDigitalSponsors keeps only active digital sponsors", () => {
    expect(activeDigitalSponsors(list).map((s) => s.id)).toEqual(["d1"]);
  });

  it("holeSponsor finds the active sponsor of one hole, never a lapsed one", () => {
    expect(holeSponsor(list, 2)?.id).toBe("h1");
    expect(holeSponsor(list, 1)).toBeUndefined(); // h2 lapsed
    expect(holeSponsor(list, 3)).toBeUndefined(); // never sold
  });
});

describe("sponsorHref (absolute-URL normalization)", () => {
  it("prepends https:// to a bare hostname so it isn't treated as a relative path", () => {
    // The exact bug: "shophappens.com" as an href appended to /course.
    expect(sponsorHref("shophappens.com")).toBe("https://shophappens.com");
    expect(sponsorHref("ShopHappens.com")).toBe("https://ShopHappens.com");
    expect(sponsorHref("www.shophappens.com/shop")).toBe(
      "https://www.shophappens.com/shop",
    );
  });

  it("leaves an already-absolute URL untouched", () => {
    expect(sponsorHref("https://shophappens.com")).toBe(
      "https://shophappens.com",
    );
    expect(sponsorHref("http://shophappens.com")).toBe(
      "http://shophappens.com",
    );
    expect(sponsorHref("HTTPS://ShopHappens.com/x")).toBe(
      "HTTPS://ShopHappens.com/x",
    );
  });

  it("normalizes a protocol-relative //host to https", () => {
    expect(sponsorHref("//shophappens.com")).toBe("https://shophappens.com");
  });

  it("trims surrounding whitespace before deciding", () => {
    expect(sponsorHref("  shophappens.com  ")).toBe("https://shophappens.com");
    expect(sponsorHref("  https://shophappens.com ")).toBe(
      "https://shophappens.com",
    );
  });

  it("returns undefined when there's no usable website", () => {
    expect(sponsorHref(undefined)).toBeUndefined();
    expect(sponsorHref("")).toBeUndefined();
    expect(sponsorHref("   ")).toBeUndefined();
  });
});

describe("validateSponsors (loud failure at build/load)", () => {
  it("accepts a clean list", () => {
    expect(() =>
      validateSponsors(
        "test",
        [
          sponsor({ id: "h1", tier: "hole", holeNumber: 1 }),
          sponsor({ id: "d1", tier: "digital" }),
        ],
        course,
      ),
    ).not.toThrow();
  });

  it("throws when two ACTIVE hole sponsors share a hole", () => {
    expect(() =>
      validateSponsors(
        "test",
        [
          sponsor({ id: "h1", tier: "hole", holeNumber: 2 }),
          sponsor({ id: "h2", tier: "hole", holeNumber: 2 }),
        ],
        course,
      ),
    ).toThrow(/two active sponsors/);
  });

  it("allows an active + a lapsed sponsor on the same hole (renewals)", () => {
    expect(() =>
      validateSponsors(
        "test",
        [
          sponsor({ id: "h1", tier: "hole", holeNumber: 2 }),
          sponsor({ id: "h2", tier: "hole", holeNumber: 2, status: "lapsed" }),
        ],
        course,
      ),
    ).not.toThrow();
  });

  it("throws when a hole sponsor has no holeNumber", () => {
    expect(() =>
      validateSponsors("test", [sponsor({ id: "h1", tier: "hole" })], course),
    ).toThrow(/missing its holeNumber/);
  });

  it("throws when holeNumber points at a hole the course doesn't have", () => {
    expect(() =>
      validateSponsors(
        "test",
        [sponsor({ id: "h1", tier: "hole", holeNumber: 99 })],
        course,
      ),
    ).toThrow(/isn't on course/);
  });

  it("throws on duplicate sponsor ids", () => {
    expect(() =>
      validateSponsors(
        "test",
        [sponsor({ id: "dup" }), sponsor({ id: "dup" })],
        course,
      ),
    ).toThrow(/duplicate sponsor id/);
  });
});
