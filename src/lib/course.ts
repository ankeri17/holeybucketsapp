import { DEFAULT_PAR, type Course, type Hole } from "./types";

/**
 * Small helpers for reading course data. Keeping the "par defaults to 3" rule
 * in one place means no component has to remember it.
 */

/** The par for a hole — its own value, or the default (3) if unset. */
export function holePar(hole: Hole): number {
  return hole.par ?? DEFAULT_PAR;
}

/** The total par for a whole course (sum of every hole's par). */
export function coursePar(course: Course): number {
  return course.holes.reduce((total, hole) => total + holePar(hole), 0);
}

/**
 * Split a course into its front and back nine — the ONE place that encodes
 * the "18 holes = two nines" scorecard assumption. The on-screen grid and the
 * PDF both split through here. A course with 9 or fewer holes gets everything
 * in `front` and an empty `back` (callers already skip an empty back nine).
 */
export function splitNines(course: Course): { front: Hole[]; back: Hole[] } {
  return {
    front: course.holes.slice(0, 9),
    back: course.holes.slice(9),
  };
}
