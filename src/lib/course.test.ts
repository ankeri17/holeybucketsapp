import { describe, expect, it } from "vitest";
import { holePar, coursePar, splitNines } from "./course";
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

  it("splitNines puts holes 1–9 in front and the rest in back", () => {
    const course: Course = {
      id: "c",
      name: "C",
      location: "L",
      holes: Array.from({ length: 18 }, (_, i) => ({ number: i + 1 })),
    };
    const { front, back } = splitNines(course);
    expect(front.map((h) => h.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(back.map((h) => h.number)).toEqual([
      10, 11, 12, 13, 14, 15, 16, 17, 18,
    ]);
  });

  it("splitNines gives a short course an empty back nine", () => {
    const course: Course = {
      id: "c",
      name: "C",
      location: "L",
      holes: [{ number: 1 }, { number: 2 }, { number: 3 }],
    };
    const { front, back } = splitNines(course);
    expect(front).toHaveLength(3);
    expect(back).toHaveLength(0);
  });
});
