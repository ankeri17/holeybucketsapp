/**
 * ============================================================================
 * DATA MODEL  —  Holey Buckets
 * ============================================================================
 *
 * These types are the contract the whole app is built on. The single most
 * important architectural rule for this project: a **course is data**, never
 * hardcoded. The MVP ships the Osceola course, but the exact same types and
 * code paths work for any future course on any property.
 *
 * Most people will never touch this file — to edit the actual course, see
 * src/config/courses/. This file just describes the *shape* of that data.
 * ----------------------------------------------------------------------------
 */

/**
 * The par used when a hole doesn't set its own. Most bucket golf holes are
 * par 3, but a hole's real par comes from the course worksheet — the Grey Duck
 * mixes par 2s, 3s, and 4s — so always read par via holePar() in
 * src/lib/course.ts, never assume 3.
 */
export const DEFAULT_PAR = 3;

/**
 * Version of the stored Round shape. Bump this (and add a migration in
 * src/lib/storage.ts) whenever a saved round from an older app version would
 * no longer parse into today's Round. Rounds live in players' phones long
 * after the app updates, so the data has to say which shape it's in.
 */
export const SCHEMA_VERSION = 1;

/**
 * Scoring formats. The MVP only plays "strokePlay" (lowest total wins), but
 * `format` is a real field from day one so the Phase 2 formats slot in later
 * without reworking the data model.
 */
export type ScoringFormat =
  | "strokePlay" // MVP
  | "matchPlay" // Phase 2
  | "skins" // Phase 2
  | "fiveThreeOne" // Phase 2 (5-3-1)
  | "teamAlternateShot" // Phase 2
  | "teamBestBall" // Phase 2
  | "pigAndWolf"; // Phase 2

/** A single hole on a course. Only `number` is required; the rest are optional. */
export interface Hole {
  /** Hole number, 1–18. */
  number: number;
  /** Optional fun name, e.g. "The Outhouse". */
  name?: string;
  /** Par for this hole (the worksheet has 2s, 3s, and 4s). Defaults to DEFAULT_PAR (3) when omitted. */
  par?: number;
  /** Optional distance from tee to bucket, in yards (per the owner worksheet). */
  distanceYards?: number;
  /** Optional free-text description of hazards (bushes, water, the deck...). */
  hazards?: string;
  /** Optional difficulty ranking, 1 = hardest. Used by the Phase 2 handicap. */
  difficultyRank?: number;
  /** Optional free-text description of where to tee off from. */
  teeLocation?: string;
  /** Optional tip or note shown to players. */
  note?: string;
  /** Optional tee photo URL for this hole (from the owner worksheet). */
  teePhoto?: string;
}

/** A playable course: just a name, a location, and an ordered list of holes. */
export interface Course {
  /** Stable unique id, e.g. "osceola". Used to link rounds back to a course. */
  id: string;
  /** Display name, e.g. "Holey Buckets at Osceola". */
  name: string;
  /** Where it is, e.g. "Osceola, WI". */
  location: string;
  /**
   * Optional name of whoever hosts this course's location, e.g. "Hello Again
   * Properties" for Osceola. This is per-course data, not a global brand —
   * every course can carry its own host.
   */
  host?: string;
  /**
   * Short, human-enterable code / slug for this course, e.g. "grayduck".
   * Lowercase, no spaces. Used for "enter a course code" and QR join later.
   * Cheap to add now; painful to retrofit once courses exist.
   */
  code?: string;
  /**
   * Whether this course is publicly listed / searchable. The flagship is
   * public; owner-created courses default to private (Phase 2).
   */
  isPublic?: boolean;
  /**
   * Whether this venue tracks balls used/lost (for per-ball billing). A
   * course-level setting, multi-tenant like everything else: on for the
   * flagship, off by default for other courses. Kept out of the score.
   */
  trackBalls?: boolean;
  /** Optional hero image URL for the course page (from the owner worksheet). */
  heroImage?: string;
  /**
   * Optional out-of-bounds / safety notes for the whole course — what players
   * should NOT aim at (from the worksheet's Course Info tab).
   */
  outOfBounds?: string;
  /** Optional course-specific house rules, e.g. "Tee off from the mat". */
  houseRules?: string;
  /** Optional note on where a group starts, e.g. "Start at hole 1 or 10". */
  startingTee?: string;
  /** The holes, in play order. */
  holes: Hole[];
}

/** A player in a round. MVP: a name only — no accounts, no logins. */
export interface Player {
  /** A stable id generated when the player is added (so scores key off it). */
  id: string;
  /** The player's display name. */
  name: string;
}

/**
 * One player's result on one hole.
 *
 * Net strokes = strokes − (bucketChip ? 1 : 0) + penalties.
 * (See src/lib/scoring.ts for the single source of truth on this math.)
 */
export interface HoleScore {
  /** Raw strokes taken to complete the hole. */
  strokes: number;
  /** Chipped the ball *into* the bucket → subtract one stroke (the bonus). */
  bucketChip?: boolean;
  /**
   * Number of penalty strokes on this hole. A penalty (foliage, water, OB, or
   * a lost ball) is +1 each and can happen more than once, so it's a count,
   * not a flag. Defaults to 0.
   */
  penalties?: number;
  /**
   * True when the app seeded this score (par, when the group lands on a hole)
   * and nobody has touched it yet. Cleared on the first real edit. Lets the
   * scorecard show "assumed par" differently from a score someone entered.
   */
  autoFilled?: boolean;
}

/** A round being played (or finished) by a group. */
export interface Round {
  /** Which version of this shape the round was saved with. See SCHEMA_VERSION. */
  schemaVersion: number;
  /** Stable unique id for this round. */
  id: string;
  /** Which course this round was played on. */
  courseId: string;
  /** The group's name, e.g. "Bachelor party". */
  groupName: string;
  /** Everyone playing. */
  players: Player[];
  /** Scoring format. MVP: "strokePlay". */
  format: ScoringFormat;
  /**
   * Scores, keyed by player id, then by hole number:
   *   scores[playerId][holeNumber] = HoleScore
   * A missing entry means that hole hasn't been scored yet.
   */
  scores: Record<string, Record<number, HoleScore>>;
  /**
   * Balls used/lost per player, keyed by player id. Only tracked when the
   * course has `trackBalls` on (for per-ball billing). Kept entirely OUT of
   * the score and NOT coupled to penalties — you can lose a ball without a
   * penalty, or take a penalty without losing a ball.
   */
  balls?: Record<string, number>;
  /**
   * Index (0-based) into the course's holes of the hole the group is on, so
   * a refresh or a reopened phone resumes where play left off. Optional —
   * older saved rounds don't have it and simply resume at the first hole.
   */
  currentHole?: number;
  /** ISO timestamp of when the round was started. */
  createdAt: string;
}
