import { holePar, splitNines } from "@/lib/course";
import {
  getHoleScore,
  netStrokes,
  nineTotal,
  playerTotal,
  playerToPar,
  formatToPar,
  toParClass,
} from "@/lib/scoring";
import type { Course, Hole, Round } from "@/lib/types";

/**
 * The traditional scorecard grid — players down the side, holes across the top.
 *
 * Split into front (1–9) and back (10–18) so it fits a phone, each with its own
 * par row and OUT / IN subtotal, then a TOTAL + to-par summary. Built as one
 * reusable component so the printable PDF (Milestone 6) renders the very same
 * artifact — same scorecard, two outputs.
 */
export function Scorecard({ round, course }: { round: Round; course: Course }) {
  const { front, back } = splitNines(course);
  const hasAssumedPar = Object.values(round.scores).some((byHole) =>
    Object.values(byHole).some((s) => s.autoFilled),
  );

  return (
    <div className="space-y-3 tabular-nums">
      <Nine round={round} holes={front} subtotalLabel="OUT" />
      {back.length > 0 && (
        <Nine round={round} holes={back} subtotalLabel="IN" />
      )}
      <Totals round={round} course={course} />
      {hasAssumedPar && (
        <p className="px-1 text-xs text-brand-stone">
          Italic scores are assumed par — the hole was opened but nobody
          adjusted the score.
        </p>
      )}
    </div>
  );
}

/** One nine: a par row and a row per player, ending in an OUT/IN subtotal. */
function Nine({
  round,
  holes,
  subtotalLabel,
}: {
  round: Round;
  holes: Hole[];
  subtotalLabel: string;
}) {
  const parSum = holes.reduce((s, h) => s + holePar(h), 0);

  return (
    <div className="overflow-x-auto rounded-2xl border border-brand-line">
      <table className="w-full border-collapse text-center text-xs">
        <thead>
          <tr className="bg-brand-cream text-brand-stone">
            <th className="px-2 py-1.5 text-left font-semibold">Hole</th>
            {holes.map((h) => (
              <th key={h.number} className="w-7 px-0 py-1.5 font-semibold">
                {h.number}
              </th>
            ))}
            <th className="px-2 py-1.5 font-bold text-brand-ink">
              {subtotalLabel}
            </th>
          </tr>
        </thead>
        <tbody>
          {/* Par row */}
          <tr className="border-t border-brand-line text-brand-stone">
            <td className="px-2 py-1 text-left font-semibold">Par</td>
            {holes.map((h) => (
              <td key={h.number} className="px-0 py-1">
                {holePar(h)}
              </td>
            ))}
            <td className="px-2 py-1 font-bold text-brand-ink">{parSum}</td>
          </tr>

          {/* One row per player */}
          {round.players.map((p) => {
            return (
              <tr key={p.id} className="border-t border-brand-line">
                <td className="max-w-[5.5rem] truncate px-2 py-1 text-left font-bold text-brand-ink">
                  {p.name}
                </td>
                {holes.map((h) => {
                  const score = getHoleScore(round, p.id, h.number);
                  const net = score ? netStrokes(score) : null;
                  const par = holePar(h);
                  // Assumed-par (auto-filled) scores read quiet and italic so
                  // they don't pass for scores someone actually entered.
                  const style =
                    net == null
                      ? "font-bold text-brand-stone"
                      : score?.autoFilled
                        ? "font-normal italic text-brand-stone"
                        : net < par
                          ? "font-bold text-brand-primary"
                          : net > par
                            ? "font-bold text-brand-penalty"
                            : "font-bold text-brand-ink";
                  return (
                    <td key={h.number} className={`px-0 py-1 ${style}`}>
                      {net ?? "–"}
                    </td>
                  );
                })}
                <td className="px-2 py-1 font-extrabold text-brand-ink">
                  {nineTotal(round, p.id, holes)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** OUT / IN / TOTAL / to-par summary row per player. */
function Totals({ round, course }: { round: Round; course: Course }) {
  const { front, back } = splitNines(course);

  return (
    <div className="overflow-x-auto rounded-2xl border border-brand-line">
      <table className="w-full border-collapse text-center text-xs">
        <thead>
          <tr className="bg-brand-cream text-brand-stone">
            <th className="px-2 py-1.5 text-left font-semibold">Player</th>
            <th className="px-2 py-1.5 font-semibold">OUT</th>
            <th className="px-2 py-1.5 font-semibold">IN</th>
            <th className="px-2 py-1.5 font-bold text-brand-ink">TOTAL</th>
            <th className="px-2 py-1.5 font-semibold">+/−</th>
          </tr>
        </thead>
        <tbody>
          {round.players.map((p) => {
            const out = nineTotal(round, p.id, front);
            const inn = nineTotal(round, p.id, back);
            const toPar = playerToPar(round, course, p.id);
            return (
              <tr key={p.id} className="border-t border-brand-line">
                <td className="max-w-[7rem] truncate px-2 py-1.5 text-left font-bold text-brand-ink">
                  {p.name}
                </td>
                <td className="px-2 py-1.5 text-brand-stone">{out}</td>
                <td className="px-2 py-1.5 text-brand-stone">{inn}</td>
                <td className="px-2 py-1.5 text-base font-extrabold text-brand-ink">
                  {playerTotal(round, p.id)}
                </td>
                <td className={`px-2 py-1.5 font-bold ${toParClass(toPar)}`}>
                  {formatToPar(toPar)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
