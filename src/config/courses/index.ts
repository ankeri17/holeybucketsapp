import type { Course } from "@/lib/types";
import { osceola } from "./osceola";

/**
 * The course registry.
 *
 * The MVP preloads just the Osceola course, but the app is built to know about
 * *many* courses — so adding one later (Phase 2: owner-created courses) is as
 * simple as importing it and dropping it in this array. No component is tied to
 * Osceola specifically; they all go through this registry.
 */
export const courses: Course[] = [osceola];

/** The course used by default when a round starts. */
export const defaultCourse: Course = osceola;

/** Look up a course by its id. Returns undefined if there's no match. */
export function getCourse(id: string): Course | undefined {
  return courses.find((course) => course.id === id);
}
