/** Generate a stable unique id (for rounds and players). */
export function newId(): string {
  // crypto.randomUUID is available in modern browsers; fall back just in case.
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
