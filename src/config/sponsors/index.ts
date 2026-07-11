import type { Sponsor } from "@/lib/types";
import { getCourse } from "@/config/courses";
import { validateSponsors } from "@/lib/sponsors";
import { osceolaSponsors } from "./osceola";

/**
 * The sponsor registry — sponsors are data, scoped to their course, exactly
 * like the courses themselves. A future course gets its own sponsor file
 * (src/config/sponsors/<courseId>.ts) and one line in the map below; no
 * component knows about any specific sponsor or course.
 */
const sponsorsByCourse: Record<string, Sponsor[]> = {
  osceola: osceolaSponsors,
};

// Fail LOUDLY at build/load time on bad sponsor data (two active sponsors on
// one hole, a holeId that isn't on the course, …). `npm run build` prerenders
// the pages that import this module, so a bad config breaks the build instead
// of quietly shipping a broken placement.
for (const [courseId, sponsors] of Object.entries(sponsorsByCourse)) {
  validateSponsors(courseId, sponsors, getCourse(courseId));
}

/** Every sponsor (any status) for a course. Empty for unknown courses. */
export function getSponsors(courseId: string): Sponsor[] {
  return sponsorsByCourse[courseId] ?? [];
}
