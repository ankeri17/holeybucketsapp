import type { Round } from "./types";

/**
 * Round persistence (MVP).
 *
 * The whole MVP runs with NO backend and NO accounts — a round lives in the
 * phone's own `localStorage`, which is what lets an in-progress round survive a
 * refresh or a brief signal drop. Phase 2 swaps this module for a hosted
 * backend without the rest of the app needing to care.
 */

const roundKey = (id: string) => `holeybuckets:round:${id}`;
const ACTIVE_KEY = "holeybuckets:activeRoundId";

/** Are we running in the browser (where localStorage exists)? */
function hasStorage(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

/** Save (or update) a round. */
export function saveRound(round: Round): void {
  if (!hasStorage()) return;
  window.localStorage.setItem(roundKey(round.id), JSON.stringify(round));
}

/** Load a round by id, or null if it isn't stored / can't be parsed. */
export function loadRound(id: string): Round | null {
  if (!hasStorage()) return null;
  const raw = window.localStorage.getItem(roundKey(id));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Round;
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
