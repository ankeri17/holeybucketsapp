import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  saveRound,
  loadRound,
  setActiveRoundId,
  getActiveRoundId,
  clearActiveRoundId,
  loadActiveRound,
} from "./storage";
import { SCHEMA_VERSION, type Round } from "./types";

/** A minimal in-memory stand-in for the browser's localStorage. */
function makeFakeStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    _store: store,
  };
}

const round: Round = {
  schemaVersion: SCHEMA_VERSION,
  id: "r1",
  courseId: "osceola",
  groupName: "Testers",
  players: [{ id: "p1", name: "Erin" }],
  format: "strokePlay",
  scores: { p1: { 1: { strokes: 3 } } },
  createdAt: "2026-07-03T12:00:00.000Z",
};

let storage: ReturnType<typeof makeFakeStorage>;

beforeEach(() => {
  storage = makeFakeStorage();
  vi.stubGlobal("window", { localStorage: storage });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("round persistence", () => {
  it("round-trips a round", () => {
    saveRound(round);
    expect(loadRound("r1")).toEqual(round);
  });

  it("returns null for a round that was never saved", () => {
    expect(loadRound("nope")).toBeNull();
  });

  it("returns null for corrupt JSON instead of throwing", () => {
    storage.setItem("holeybuckets:round:bad", "{not json");
    expect(loadRound("bad")).toBeNull();
  });

  it("returns null for JSON that isn't shaped like a round", () => {
    storage.setItem(
      "holeybuckets:round:odd",
      JSON.stringify({ id: "odd", players: "not-an-array" }),
    );
    expect(loadRound("odd")).toBeNull();
  });

  it("migrates a pre-versioning round by stamping schemaVersion 1", () => {
    const { schemaVersion: _dropped, ...legacy } = round;
    storage.setItem("holeybuckets:round:r1", JSON.stringify(legacy));
    expect(loadRound("r1")?.schemaVersion).toBe(1);
  });

  it("refuses a round saved by a future app version", () => {
    storage.setItem(
      "holeybuckets:round:r1",
      JSON.stringify({ ...round, schemaVersion: SCHEMA_VERSION + 1 }),
    );
    expect(loadRound("r1")).toBeNull();
  });
});

describe("active round", () => {
  it("sets, reads, and clears the active round id", () => {
    expect(getActiveRoundId()).toBeNull();
    setActiveRoundId("r1");
    expect(getActiveRoundId()).toBe("r1");
    clearActiveRoundId();
    expect(getActiveRoundId()).toBeNull();
  });

  it("loadActiveRound returns the round the id points at", () => {
    saveRound(round);
    setActiveRoundId("r1");
    expect(loadActiveRound()?.id).toBe("r1");
  });

  it("loadActiveRound is null when the id points at nothing", () => {
    setActiveRoundId("ghost");
    expect(loadActiveRound()).toBeNull();
  });
});

describe("without a browser", () => {
  it("every operation is a safe no-op", () => {
    vi.unstubAllGlobals();
    vi.stubGlobal("window", undefined);
    expect(() => saveRound(round)).not.toThrow();
    expect(loadRound("r1")).toBeNull();
    expect(getActiveRoundId()).toBeNull();
    expect(() => setActiveRoundId("x")).not.toThrow();
    expect(() => clearActiveRoundId()).not.toThrow();
  });
});
