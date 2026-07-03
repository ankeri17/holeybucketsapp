import { describe, expect, it } from "vitest";
import { holePar, coursePar } from "./course";
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
});
