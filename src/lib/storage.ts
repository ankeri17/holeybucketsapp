import { SCHEMA_VERSION, type Round } from "./types";

/**
 * Round persistence (MVP).
 *
 * The whole MVP runs with NO backend and NO accounts — a round lives in the
 * phone's own `localStorage`, which is what lets an in-progress round survive a
 * refresh or a brief signal drop. Phase 2 swaps this module for a hosted
 * backend without the rest of the app needing to care.
 *
 * Saved rounds outlive app updates, so loading is defensive: anything that
 * doesn't look like a Round comes back as null instead of crashing a screen,
 * and rounds saved by older app versions get migrated up on read (see
 * `migrate`).
 */

const roundKey = (id: string) => `holeybuckets:round:${id}`;
const ACTIVE_KEY = "holeybuckets:activeRoundId";

/** Are we running in the browser (where localStorage exists)? */
function hasStorage(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

/** Does this parsed value have the shape the app relies on to render a round? */
function looksLikeRound(value: unknown): value is Round {
  if (typeof value !== "object" || value === null) return false;
  const r = value as Record<string, unknown>;
  return (
    typeof r.id === "string" &&
    typeof r.courseId === "string" &&
    typeof r.groupName === "string" &&
    typeof r.createdAt === "string" &&
    Array.isArray(r.players) &&
    r.players.every(
      (p: unknown) =>
        typeof p === "object" &&
        p !== null &&
        typeof (p as Record<string, unknown>).id === "string" &&
        typeof (p as Record<string, unknown>).name === "string",
    ) &&
    typeof r.scores === "object" &&
    r.scores !== null
  );
}

/**
 * Bring a round saved by an older app version up to today's shape. Version 1
 * is the first stamped version; rounds saved before stamping existed are
 * treated as version 1 (their shape is the same).
 */
function migrate(round: Round): Round {
  if (typeof round.schemaVersion !== "number") {
    return { ...round, schemaVersion: 1 };
  }
  // When SCHEMA_VERSION bumps past 1, per-version upgrade steps go here.
  return round;
}

/** Save (or update) a round. */
export function saveRound(round: Round): void {
  if (!hasStorage()) return;
  window.localStorage.setItem(roundKey(round.id), JSON.stringify(round));
}

/** Load a round by id, or null if it isn't stored / can't be understood. */
export function loadRound(id: string): Round | null {
  if (!hasStorage()) return null;
  const raw = window.localStorage.getItem(roundKey(id));
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!looksLikeRound(parsed)) return null;
    const round = migrate(parsed);
    // A round from a FUTURE app version may mean shapes we don't understand —
    // refuse it rather than half-render it.
    if (round.schemaVersion > SCHEMA_VERSION) return null;
    return round;
  } catch {
    return null;
  }
}

/** Remember which round is the active/in-progress one (for "resume"). */
export function setActiveRoundId(id: string): void {
  if (!hasStorage()) return;
  window.localStorage.setItem(ACTIVE_KEY, id);
}

/** The id of the active round, if any. */
export function getActiveRoundId(): string | null {
  if (!hasStorage()) return null;
  return window.localStorage.getItem(ACTIVE_KEY);
}

/** Forget the active round (when a group finishes and taps Done). */
export function clearActiveRoundId(): void {
  if (!hasStorage()) return;
  window.localStorage.removeItem(ACTIVE_KEY);
}

/** The active round itself, if its id is set and it loads cleanly. */
export function loadActiveRound(): Round | null {
  const id = getActiveRoundId();
  return id ? loadRound(id) : null;
}
