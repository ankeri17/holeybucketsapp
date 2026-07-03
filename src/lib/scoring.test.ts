import { describe, expect, it } from "vitest";
import {
  netStrokes,
  playerTotal,
  playerToPar,
  holesScored,
  standings,
  winners,
  joinNames,
  formatToPar,
  playerBalls,
  totalBalls,
} from "./scoring";
import { SCHEMA_VERSION, type Course, type Round } from "./types";

/**
 * The scoring rules are the business core of the app — every screen, the PDF,
 * and the share image all read from scoring.ts. These tests pin the house
 * rules down so a future format (match play, skins) can't quietly break
 * stroke play.
 */

const course: Course = {
  id: "test",
  name: "Test Course",
  location: "Testville",
  holes: [
    { number: 1 },
    { number: 2 },
    { number: 3 },
    { number: 4, par: 4 }, // one non-default par to prove par is read per hole
  ],
};

function makeRound(scores: Round["scores"], balls?: Round["balls"]): Round {
  const playerIds = Object.keys(scores);
  return {
    schemaVersion: SCHEMA_VERSION,
    id: "round-1",
    courseId: course.id,
    groupName: "Testers",
    players: playerIds.map((id) => ({ id, name: id.toUpperCase() })),
    format: "strokePlay",
    scores,
    balls,
    createdAt: "2026-07-03T12:00:00.000Z",
  };
}

describe("netStrokes", () => {
  it("is 0 for a hole with no score yet", () => {
    expect(netStrokes(undefined)).toBe(0);
  });

  it("is the raw strokes when there are no modifiers", () => {
    expect(netStrokes({ strokes: 4 })).toBe(4);
  });

  it("subtracts 1 for a bucket chip-in", () => {
    expect(netStrokes({ strokes: 4, bucketChip: true })).toBe(3);
  });

  it("adds 1 per penalty", () => {
    expect(netStrokes({ strokes: 3, penalties: 2 })).toBe(5);
  });

  it("applies chip-in and penalties together", () => {
    expect(netStrokes({ strokes: 4, bucketChip: true, penalties: 1 })).toBe(4);
  });

  it("allows a zero score for a first-throw chip-in", () => {
    // House rule as currently encoded: 1 stroke − 1 chip-in bonus = 0.
    expect(netStrokes({ strokes: 1, bucketChip: true })).toBe(0);
  });

  it("never goes below zero", () => {
    expect(netStrokes({ strokes: 0, bucketChip: true })).toBe(0);
  });

  it("ignores the autoFilled marker (assumed par still counts as par)", () => {
    expect(netStrokes({ strokes: 3, autoFilled: true })).toBe(3);
  });
});

describe("totals and to-par", () => {
  const round = makeRound({
    a: { 1: { strokes: 3 }, 2: { strokes: 5 }, 4: { strokes: 4 } },
    b: {},
  });

  it("playerTotal sums net strokes over scored holes", () => {
    expect(playerTotal(round, "a")).toBe(12);
  });

  it("playerTotal is 0 for a player with no scores", () => {
    expect(playerTotal(round, "b")).toBe(0);
    expect(playerTotal(round, "missing")).toBe(0);
  });

  it("holesScored counts only holes with an entry", () => {
    expect(holesScored(round, "a")).toBe(3);
    expect(holesScored(round, "b")).toBe(0);
  });

  it("playerToPar compares against each hole's own par", () => {
    // Hole 1: 3 vs par 3 (E) · hole 2: 5 vs par 3 (+2) · hole 4: 4 vs par 4 (E)
    expect(playerToPar(round, course, "a")).toBe(2);
  });

  it("playerToPar only counts holes actually scored", () => {
    expect(playerToPar(round, course, "b")).toBe(0);
  });
});

describe("standings and winners", () => {
  it("sorts lowest total first and shares ranks on ties", () => {
    const round = makeRound({
      a: { 1: { strokes: 4 } },
      b: { 1: { strokes: 3 } },
      c: { 1: { strokes: 3 } },
      d: { 1: { strokes: 6 } },
    });
    const board = standings(round, course);
    expect(board.map((r) => [r.playerId, r.rank])).toEqual([
      ["b", 1],
      ["c", 1],
      ["a", 3], // rank 2 is skipped after a shared rank 1 — golf style
      ["d", 4],
    ]);
  });

  it("winners returns everyone sharing the best total", () => {
    const round = makeRound({
      a: { 1: { strokes: 3 } },
      b: { 1: { strokes: 3 } },
      c: { 1: { strokes: 5 } },
    });
    const top = winners(standings(round, course));
    expect(top.map((w) => w.playerId).sort()).toEqual(["a", "b"]);
  });

  it("winners is empty for an empty board", () => {
    expect(winners([])).toEqual([]);
  });
});

describe("ball tracking", () => {
  const round = makeRound({ a: {}, b: {} }, { a: 3 });

  it("reads a player's tally, defaulting to 0", () => {
    expect(playerBalls(round, "a")).toBe(3);
    expect(playerBalls(round, "b")).toBe(0);
  });

  it("totals the whole group", () => {
    expect(totalBalls(round)).toBe(3);
  });
});

describe("formatting helpers", () => {
  it("joinNames handles one, two, and many names", () => {
    expect(joinNames([])).toBe("");
    expect(joinNames(["Erin"])).toBe("Erin");
    expect(joinNames(["Erin", "Laura"])).toBe("Erin & Laura");
    expect(joinNames(["Erin", "Laura", "Sam"])).toBe("Erin, Laura & Sam");
  });

  it("formatToPar prints golf-style", () => {
    expect(formatToPar(0)).toBe("E");
    expect(formatToPar(3)).toBe("+3");
    expect(formatToPar(-1)).toBe("-1");
  });
});
