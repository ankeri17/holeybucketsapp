import type { jsPDF } from "jspdf";
import type { autoTable as AutoTableFn, CellHookData } from "jspdf-autotable";
import { brand } from "@/config/branding";
import { holePar } from "@/lib/course";
import { getHoleScore, netStrokes, playerTotal } from "@/lib/scoring";
import type { Course, Round } from "@/lib/types";

/**
 * Printable PDF scorecards.
 *
 * Two outputs from one place: a blank card to print and fill in by hand before
 * a round, and a completed card from a finished round. Both are branded and
 * read off the same course/scoring data as the rest of the app, so they can't
 * disagree with the screen.
 *
 * jsPDF is imported dynamically (only when someone actually clicks Print), so
 * it never weighs down the app's normal load.
 */

const NUM_BLANK_ROWS = 6;

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/** Build the column header and the par row, shared by both card types. */
function scorecardSkeleton(course: Course) {
  const front = course.holes.slice(0, 9);
  const back = course.holes.slice(9);
  const parOut = front.reduce((s, h) => s + holePar(h), 0);
  const parIn = back.reduce((s, h) => s + holePar(h), 0);

  const head = [
    "Hole",
    ...front.map((h) => String(h.number)),
    "OUT",
    ...back.map((h) => String(h.number)),
    "IN",
    "Tot",
  ];
  const parRow = [
    "Par",
    ...front.map((h) => holePar(h)),
    parOut,
    ...back.map((h) => holePar(h)),
    parIn,
    parOut + parIn,
  ];
  return { front, back, head, parRow };
}

/** Format a date the friendly way, e.g. "June 26, 2026". */
function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Draw the branded header band; returns the Y to start the table at. */
function drawHeader(
  doc: jsPDF,
  course: Course,
  subtitle: string,
  dateStr: string,
): number {
  const pageW = doc.internal.pageSize.getWidth();
  doc.setFillColor(...hexToRgb(brand.colors.primary));
  doc.rect(0, 0, pageW, 70, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(brand.name.toUpperCase(), 40, 34);

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`${course.name} · ${course.location}`, 40, 54);

  doc.setTextColor(...hexToRgb(brand.colors.ink));
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(subtitle, 40, 96);

  // Date, right-aligned on the subtitle row.
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...hexToRgb(brand.colors.stone));
  doc.text(dateStr, pageW - 40, 96, { align: "right" });

  return 110;
}

async function newDoc(): Promise<{
  doc: jsPDF;
  autoTable: typeof AutoTableFn;
}> {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "letter" });
  return { doc, autoTable };
}

function renderTable(
  doc: jsPDF,
  autoTable: typeof AutoTableFn,
  head: string[],
  body: (string | number)[][],
  startY: number,
  /** Body cells (as "rowIndex:columnIndex") to render italic — assumed par. */
  italicCells?: Set<string>,
) {
  autoTable(doc, {
    head: [head],
    body,
    startY,
    theme: "grid",
    styles: { halign: "center", fontSize: 9, cellPadding: 4, lineColor: hexToRgb(brand.colors.line) },
    headStyles: { fillColor: hexToRgb(brand.colors.primary), textColor: [255, 255, 255], fontStyle: "bold" },
    columnStyles: { 0: { halign: "left", fontStyle: "bold", cellWidth: 80 } },
    didParseCell: (data: CellHookData) => {
      // Shade the label rows (Par) so the card reads like a real scorecard.
      const label = Array.isArray(data.row.raw) ? data.row.raw[0] : undefined;
      if (label === "Par") {
        data.cell.styles.fillColor = hexToRgb(brand.colors.cream);
        data.cell.styles.fontStyle = "bold";
      }
      if (
        data.section === "body" &&
        italicCells?.has(`${data.row.index}:${data.column.index}`)
      ) {
        data.cell.styles.fontStyle = "italic";
        data.cell.styles.textColor = hexToRgb(brand.colors.stone);
      }
    },
  });
}

/** Where the last table ended (jspdf-autotable records it on the doc). */
function tableEndY(doc: jsPDF, fallback: number): number {
  const withTable = doc as unknown as { lastAutoTable?: { finalY?: number } };
  return withTable.lastAutoTable?.finalY ?? fallback;
}

/** Blank scorecard to print and fill in by hand before a round. */
export async function downloadBlankScorecard(course: Course): Promise<void> {
  const { doc, autoTable } = await newDoc();
  const startY = drawHeader(
    doc,
    course,
    "Blank scorecard — fill in by hand",
    formatDate(new Date()),
  );
  const { head, parRow } = scorecardSkeleton(course);

  const blankRow = ["", ...head.slice(1).map(() => "")];
  const body: (string | number)[][] = [
    parRow,
    ...Array.from({ length: NUM_BLANK_ROWS }, () => [...blankRow]),
  ];
  renderTable(doc, autoTable, head, body, startY);

  doc.save(`Holey Buckets - ${course.name} - blank scorecard.pdf`);
}

/** Completed scorecard from a finished round. */
export async function downloadResultsScorecard(round: Round, course: Course): Promise<void> {
  const { doc, autoTable } = await newDoc();
  const startY = drawHeader(
    doc,
    course,
    round.groupName,
    formatDate(new Date(round.createdAt)),
  );
  const { front, back, head, parRow } = scorecardSkeleton(course);

  // Assumed-par (auto-filled) scores print italic + gray, same as on screen,
  // so a printed card can't pass them off as entered scores.
  const italicCells = new Set<string>();

  const playerRows = round.players.map((p, playerIndex) => {
    const rowIndex = playerIndex + 1; // body row 0 is the Par row
    const cellFor = (holeNumber: number, columnIndex: number) => {
      const s = getHoleScore(round, p.id, holeNumber);
      if (s?.autoFilled) italicCells.add(`${rowIndex}:${columnIndex}`);
      return s ? netStrokes(s) : "";
    };
    // Columns: 0 = name, then front nine, OUT, back nine, IN, Tot.
    const frontCells = front.map((h, i) => cellFor(h.number, 1 + i));
    const backCells = back.map((h, i) => cellFor(h.number, front.length + 2 + i));
    const out = frontCells.reduce<number>((s, v) => s + (typeof v === "number" ? v : 0), 0);
    const inn = backCells.reduce<number>((s, v) => s + (typeof v === "number" ? v : 0), 0);
    return [p.name, ...frontCells, out, ...backCells, inn, playerTotal(round, p.id)];
  });

  renderTable(doc, autoTable, head, [parRow, ...playerRows], startY, italicCells);

  if (italicCells.size > 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(...hexToRgb(brand.colors.stone));
    doc.text(
      "Italic scores are assumed par — the hole was opened but nobody adjusted the score.",
      40,
      tableEndY(doc, startY) + 18,
    );
  }

  doc.save(`Holey Buckets - ${round.groupName} scorecard.pdf`);
}
