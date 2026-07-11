import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { holePar, coursePar, courseYards } from "./course";
import { osceola } from "@/config/courses/osceola";
import type { Course } from "./types";

describe("course helpers", () => {
  it("holePar defaults to 3 and respects an explicit par", () => {
    expect(holePar({ number: 1 })).toBe(3);
    expect(holePar({ number: 2, par: 4 })).toBe(4);
  });

  it("coursePar sums every hole's par", () => {
    const course: Course = {
      id: "c",
      name: "C",
      location: "L",
      holes: [{ number: 1 }, { number: 2, par: 4 }, { number: 3 }],
    };
    expect(coursePar(course)).toBe(10);
  });

  it("courseYards sums distances, treating missing ones as 0", () => {
    const course: Course = {
      id: "c",
      name: "C",
      location: "L",
      holes: [{ number: 1, distanceYards: 30 }, { number: 2 }],
    };
    expect(courseYards(course)).toBe(30);
  });
});

/**
 * Guardrails on the real flagship course data (from the owner's worksheet).
 * If someone edits osceola.ts and drops a hole or fat-fingers a par, these
 * fail before the change reaches players.
 */
describe("the Grey Duck course data", () => {
  it("has 18 holes numbered 1–18 in play order", () => {
    expect(osceola.holes.map((h) => h.number)).toEqual(
      Array.from({ length: 18 }, (_, i) => i + 1),
    );
  });

  it("gives every hole an explicit par between 2 and 4 (not all par 3!)", () => {
    for (const hole of osceola.holes) {
      expect(hole.par, `hole ${hole.number}`).toBeGreaterThanOrEqual(2);
      expect(hole.par, `hole ${hole.number}`).toBeLessThanOrEqual(4);
    }
    const pars = new Set(osceola.holes.map((h) => h.par));
    expect(pars).toEqual(new Set([2, 3, 4]));
  });

  it("totals par 54 and 529 yards, per the worksheet", () => {
    expect(coursePar(osceola)).toBe(54);
    expect(courseYards(osceola)).toBe(529);
  });

  it("every teePhoto points at a real file in public/", () => {
    for (const hole of osceola.holes) {
      if (!hole.teePhoto) continue;
      const onDisk = path.join(process.cwd(), "public", hole.teePhoto);
      expect(existsSync(onDisk), `hole ${hole.number}: ${hole.teePhoto}`).toBe(
        true,
      );
    }
  });
});
