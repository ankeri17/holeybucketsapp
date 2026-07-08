import type { Course, Sponsor } from "./types";

/**
 * Sponsor helpers — the single place that decides which sponsors show.
 *
 * The rule every placement shares: only `status: "active"` sponsors render,
 * anywhere. Flipping a sponsor to "lapsed" in src/config/sponsors/ is the
 * whole kill switch — no component or PDF needs a second edit.
 */

/** Only the sponsors that should currently show anywhere. */
export function activeSponsors(sponsors: Sponsor[]): Sponsor[] {
  return sponsors.filter((s) => s.status === "active");
}

/** Active hole-tier sponsors, in hole order (for scorecard footnotes). */
export function activeHoleSponsors(sponsors: Sponsor[]): Sponsor[] {
  return activeSponsors(sponsors)
    .filter((s) => s.tier === "hole")
    .sort((a, b) => (a.holeId ?? 0) - (b.holeId ?? 0));
}

/** Active digital-tier sponsors (the rotating slot + printed sponsors row). */
export function activeDigitalSponsors(sponsors: Sponsor[]): Sponsor[] {
  return activeSponsors(sponsors).filter((s) => s.tier === "digital");
}

/** The active sponsor of one hole, if it has one. */
export function holeSponsor(
  sponsors: Sponsor[],
  holeNumber: number,
): Sponsor | undefined {
  return activeHoleSponsors(sponsors).find((s) => s.holeId === holeNumber);
}

/**
 * Validate a course's sponsor list. Throws (build/load failure, on purpose —
 * loud beats wrong) when:
 *   - two sponsors share an id,
 *   - a hole-tier sponsor has no `holeId`,
 *   - a `holeId` doesn't match a real hole on the course,
 *   - two ACTIVE hole sponsors claim the same hole (a hole is sold once).
 * Lapsed sponsors still get their shape checked, but only active ones can
 * conflict over a hole.
 */
export function validateSponsors(
  courseId: string,
  sponsors: Sponsor[],
  course: Course | undefined,
): void {
  const problems: string[] = [];

  const seenIds = new Set<string>();
  for (const s of sponsors) {
    if (seenIds.has(s.id)) problems.push(`duplicate sponsor id "${s.id}"`);
    seenIds.add(s.id);

    if (s.tier === "hole") {
      if (s.holeId == null) {
        problems.push(`hole sponsor "${s.id}" is missing its holeId`);
      } else if (course && !course.holes.some((h) => h.number === s.holeId)) {
        problems.push(
          `sponsor "${s.id}" points at hole ${s.holeId}, which isn't on course "${courseId}"`,
        );
      }
    }
  }

  const takenHoles = new Map<number, string>();
  for (const s of activeHoleSponsors(sponsors)) {
    if (s.holeId == null) continue;
    const other = takenHoles.get(s.holeId);
    if (other) {
      problems.push(
        `hole ${s.holeId} has two ACTIVE sponsors ("${other}" and "${s.id}") — a hole can only have one; mark one "lapsed"`,
      );
    } else {
      takenHoles.set(s.holeId, s.id);
    }
  }

  if (problems.length > 0) {
    throw new Error(
      `Sponsor config for course "${courseId}" is invalid:\n  - ${problems.join("\n  - ")}\nFix src/config/sponsors/ and rebuild.`,
    );
  }
}
