#!/usr/bin/env node
/**
 * scoring-smoke.mjs — canonical scoring-case smoke check for Holey Buckets.
 *
 * What it does:
 *   1. Compiles src/lib/{types,course,scoring}.ts with the repo's OWN
 *      TypeScript compiler (node_modules/.bin/tsc) to CommonJS in a temp dir.
 *   2. Requires the compiled scoring module and asserts the canonical cases:
 *      netStrokes (incl. floor-at-0), standings tie ranks, winners() length on
 *      a tie, playerToPar over played holes only, formatToPar strings, and the
 *      PR #10 reconciliation example (OUT 25 + IN 27 = 52, to-par −2).
 *
 * Usage (from the repo root):
 *   node .claude/skills/holey-buckets-validation-and-qa/scripts/scoring-smoke.mjs
 *
 * Requirements: `npm install` has been run (needs node_modules/.bin/tsc).
 * No dependencies beyond the repo's own devDependencies. Exit code 0 = all
 * PASS, 1 = any FAIL or setup error.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
// scripts/ -> skill dir -> skills/ -> .claude/ -> repo root
const repoRoot = path.resolve(scriptDir, "..", "..", "..", "..");

const tscBin = path.join(repoRoot, "node_modules", ".bin", "tsc");
if (!existsSync(tscBin)) {
  console.error(`ERROR: ${tscBin} not found. Run \`npm install\` in ${repoRoot} first.`);
  process.exit(1);
}

const sources = ["src/lib/types.ts", "src/lib/course.ts", "src/lib/scoring.ts"];
for (const s of sources) {
  if (!existsSync(path.join(repoRoot, s))) {
    console.error(`ERROR: ${s} not found under ${repoRoot}. Has the lib been moved/renamed?`);
    process.exit(1);
  }
}

const outDir = mkdtempSync(path.join(tmpdir(), "hb-scoring-smoke-"));
console.log(`Compiling ${sources.join(", ")} with the repo's tsc ...`);
try {
  execFileSync(
    tscBin,
    [...sources, "--module", "commonjs", "--target", "es2020", "--outDir", outDir],
    { cwd: repoRoot, stdio: "inherit" },
  );
} catch {
  console.error("ERROR: tsc compile failed (see output above). The lib no longer compiles standalone.");
  rmSync(outDir, { recursive: true, force: true });
  process.exit(1);
}

const scoring = require(path.join(outDir, "scoring.js"));
const {
  netStrokes,
  playerTotal,
  playerToPar,
  standings,
  winners,
  joinNames,
  formatToPar,
} = scoring;

// ---------------------------------------------------------------------------
// Test harness: PASS/FAIL per case, exit 1 if anything fails.
// ---------------------------------------------------------------------------
let failures = 0;
function check(name, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    console.log(`PASS  ${name}`);
  } else {
    failures++;
    console.log(`FAIL  ${name}: expected ${e}, got ${a}`);
  }
}

// A synthetic 18-hole course; par omitted everywhere so DEFAULT_PAR (3)
// applies. Course par = 54.
const course = {
  id: "smoke",
  name: "Smoke Test Course",
  location: "Nowhere, WI",
  holes: Array.from({ length: 18 }, (_, i) => ({ number: i + 1 })),
};

function makeRound(players, scores) {
  return {
    id: "smoke-round",
    courseId: course.id,
    groupName: "Smoke",
    players,
    format: "strokePlay",
    scores,
    createdAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// 1. netStrokes — the five canonical cases (PR #4) + extras
// ---------------------------------------------------------------------------
check("netStrokes: par-3 plain (3 strokes) = 3", netStrokes({ strokes: 3 }), 3);
check("netStrokes: chip-in on 2nd throw (2 strokes, chip) = 1",
  netStrokes({ strokes: 2, bucketChip: true }), 1);
check("netStrokes: 3 strokes + 1 penalty = 4",
  netStrokes({ strokes: 3, penalties: 1 }), 4);
check("netStrokes: chip + penalty cancel (3 strokes) = 3",
  netStrokes({ strokes: 3, bucketChip: true, penalties: 1 }), 3);
check("netStrokes: first-throw chip-in floors at 0 (never negative)",
  netStrokes({ strokes: 1, bucketChip: true }), 0);
check("netStrokes: penalties are a COUNT (2 strokes + 3 penalties = 5)",
  netStrokes({ strokes: 2, penalties: 3 }), 5);
check("netStrokes: unscored hole (undefined) = 0", netStrokes(undefined), 0);

// ---------------------------------------------------------------------------
// 2. playerToPar — over PLAYED holes only, never all 18
// ---------------------------------------------------------------------------
{
  const p = { id: "p1", name: "Solo" };
  // Scored only holes 1 and 2: nets 2 and 3 vs par 3 each -> toPar = -1.
  const round = makeRound([p], { p1: { 1: { strokes: 2 }, 2: { strokes: 3 } } });
  check("playerToPar: 2 played holes (nets 2,3) = -1, not -49-over-18-holes",
    playerToPar(round, course, "p1"), -1);
  check("playerTotal: same round totals 5", playerTotal(round, "p1"), 5);
}

// ---------------------------------------------------------------------------
// 3. PR #10 reconciliation example: Erin OUT 25 + IN 27 = 52, to-par −2
// ---------------------------------------------------------------------------
{
  const erin = { id: "erin", name: "Erin" };
  const byHole = {};
  // Hole 1: chip-in on the 2nd throw -> net 1. Holes 2-18: plain par 3s.
  byHole[1] = { strokes: 2, bucketChip: true };
  for (let h = 2; h <= 18; h++) byHole[h] = { strokes: 3 };
  const round = makeRound([erin], { erin: byHole });

  const out = Object.entries(byHole)
    .filter(([h]) => Number(h) <= 9)
    .reduce((s, [, sc]) => s + netStrokes(sc), 0);
  const inn = Object.entries(byHole)
    .filter(([h]) => Number(h) >= 10)
    .reduce((s, [, sc]) => s + netStrokes(sc), 0);

  check("reconcile: OUT (front nine) = 25", out, 25);
  check("reconcile: IN (back nine) = 27", inn, 27);
  check("reconcile: OUT + IN = playerTotal = 52",
    out + inn === playerTotal(round, "erin") && playerTotal(round, "erin") === 52, true);
  check("reconcile: to-par over 18 played holes = -2 (course par 54)",
    playerToPar(round, course, "erin"), -2);
  check("reconcile: formatToPar(-2) renders '-2'",
    formatToPar(playerToPar(round, course, "erin")), "-2");
}

// ---------------------------------------------------------------------------
// 4. standings + winners — tie shares a rank, winners() length > 1 on a tie
// ---------------------------------------------------------------------------
{
  const players = [
    { id: "a", name: "Erin" },
    { id: "b", name: "Laura" },
    { id: "c", name: "Sam" },
  ];
  // Two holes each. Erin & Laura both net 5; Sam nets 7.
  const round = makeRound(players, {
    a: { 1: { strokes: 2 }, 2: { strokes: 3 } },
    b: { 1: { strokes: 3 }, 2: { strokes: 2 } },
    c: { 1: { strokes: 4 }, 2: { strokes: 3 } },
  });
  const board = standings(round, course);
  check("standings: sorted lowest total first",
    board.map((r) => r.total), [5, 5, 7]);
  check("standings: tied players SHARE a rank; next rank skips (1,1,3)",
    board.map((r) => r.rank), [1, 1, 3]);
  const top = winners(board);
  check("winners: length 2 on a 2-way tie", top.length, 2);
  check("winners: tie detected via length > 1", top.length > 1, true);
  check("joinNames: two names -> 'Erin & Laura'",
    joinNames(top.map((w) => w.name)), "Erin & Laura");
  check("joinNames: three names -> 'Erin, Laura & Sam'",
    joinNames(["Erin", "Laura", "Sam"]), "Erin, Laura & Sam");
}

// ---------------------------------------------------------------------------
// 5. formatToPar strings
// ---------------------------------------------------------------------------
check("formatToPar: 0 -> 'E'", formatToPar(0), "E");
check("formatToPar: 3 -> '+3'", formatToPar(3), "+3");
check("formatToPar: -1 -> '-1'", formatToPar(-1), "-1");

// ---------------------------------------------------------------------------
rmSync(outDir, { recursive: true, force: true });
const total = failures === 0 ? "ALL CASES PASS" : `${failures} CASE(S) FAILED`;
console.log(`\n${total}`);
process.exit(failures === 0 ? 0 : 1);
