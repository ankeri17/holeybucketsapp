import type { Course, Sponsor } from "./types";

/**
 * Sponsor helpers — the single place that decides which sponsors show.
 *
 * The rule every placement shares: only sponsors that are currently paying —
 * `status: "active"` or `"renewed"` — render anywhere. Every other pipeline
 * state (lead, contacted, paid-but-not-started, lapsed, …) is bookkeeping the
 * admin panel surfaces but players never see. Flipping a sponsor out of
 * "active"/"renewed" is the whole kill switch — no component or PDF needs a
 * second edit.
 */

/** Only the sponsors that should currently show anywhere. */
export function activeSponsors(sponsors: Sponsor[]): Sponsor[] {
  return sponsors.filter((s) => s.status === "active" || s.status === "renewed");
}

/** Active hole-tier sponsors, in hole order (for scorecard footnotes). */
export function activeHoleSponsors(sponsors: Sponsor[]): Sponsor[] {
  return activeSponsors(sponsors)
    .filter((s) => s.tier === "hole")
    .sort((a, b) => (a.holeNumber ?? 0) - (b.holeNumber ?? 0));
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
  return activeHoleSponsors(sponsors).find((s) => s.holeNumber === holeNumber);
}

/**
 * Validate a course's bundled sponsor list. Throws (build/load failure, on
 * purpose — loud beats wrong) when:
 *   - two sponsors share an id,
 *   - a hole-tier sponsor has no `holeNumber`,
 *   - a `holeNumber` doesn't match a real hole on the course,
 *   - two ACTIVE hole sponsors claim the same hole (a hole is sold once).
 * Non-active sponsors still get their shape checked, but only currently
 * showing ones can conflict over a hole.
 */
export function validateSponsors(
  courseId: string,
  sponsors: Sponsor[],
  course: Course | undefined,
): void {
  const problems: string[] = [];

  const seenIds = new Set<string>();
  for (const s of sponsors) {
    if (s.id) {
      if (seenIds.has(s.id)) problems.push(`duplicate sponsor id "${s.id}"`);
      seenIds.add(s.id);
    }

    const label = s.id ?? s.name;
    if (s.tier === "hole") {
      if (s.holeNumber == null) {
        problems.push(`hole sponsor "${label}" is missing its holeNumber`);
      } else if (course && !course.holes.some((h) => h.number === s.holeNumber)) {
        problems.push(
          `sponsor "${label}" points at hole ${s.holeNumber}, which isn't on course "${courseId}"`,
        );
      }
    }
  }

  const takenHoles = new Map<number, string>();
  for (const s of activeHoleSponsors(sponsors)) {
    if (s.holeNumber == null) continue;
    const label = s.id ?? s.name;
    const other = takenHoles.get(s.holeNumber);
    if (other) {
      problems.push(
        `hole ${s.holeNumber} has two active sponsors ("${other}" and "${label}") — a hole can only have one; mark one "lapsed"`,
      );
    } else {
      takenHoles.set(s.holeNumber, label);
    }
  }

  if (problems.length > 0) {
    throw new Error(
      `Sponsor config for course "${courseId}" is invalid:\n  - ${problems.join("\n  - ")}\nFix src/config/sponsors/ and rebuild.`,
    );
  }
}
