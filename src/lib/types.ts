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

/** Bucket golf rule: every hole is a par 3 (3 shots to hit the bucket). */
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
  /** Par for this hole. Defaults to DEFAULT_PAR (3) when omitted. */
  par?: number;
  /** Optional distance from tee to bucket, measured in paces. */
  distancePaces?: number;
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
  /** The holes, in play order. */
  holes: Hole[];
}

/** The two sponsorship placements sold today. */
export type SponsorTier =
  | "hole" // "Hole presented by …" on one hole (app + scorecard)
  | "digital"; // rotating app slot + the printed "Thanks to our sponsors" row

/**
 * Whether a sponsorship is currently running. Flipping a sponsor to "lapsed"
 * is the manual kill switch: it removes them from EVERY placement (app and
 * PDF) with no other edits — the stand-in for payment webhooks until Phase 2.
 */
export type SponsorStatus = "active" | "lapsed";

/**
 * A sponsor of a course. Like a course, a sponsor is **data**, never
 * hardcoded — sponsors live in src/config/sponsors/, scoped per course, and
 * every placement renders from these objects.
 */
export interface Sponsor {
  /** Stable unique slug, e.g. "osceola-hardware". */
  id: string;
  /** Display name, e.g. "Osceola Hardware". */
  name: string;
  /**
   * Path to the logo, e.g. "/sponsors/osceola-hardware.png" (files live in
   * /public/sponsors/). Optional — a sponsor with no logo (or a broken file)
   * renders as their styled name instead; a missing image never breaks a page.
   */
  logoUrl?: string;
  /** Which placement this sponsor bought. */
  tier: SponsorTier;
  /** "active" shows everywhere; "lapsed" removes them everywhere. */
  status: SponsorStatus;
  /**
   * The `number` of the hole they sponsor. Required when tier is "hole" and
   * must match a real hole in the course data; at most ONE active hole sponsor
   * per hole (validated loudly at build/load in src/config/sponsors/).
   */
  holeId?: number;
  /** Optional website — sponsor placements in the app link out to it. */
  url?: string;
  /** Term dates (ISO, e.g. "2026-05-01"). Informational only in the MVP. */
  termStart?: string;
  termEnd?: string;
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
