import type { Course, Round } from "./types";
import type { Standing } from "./scoring";
import { formatToPar } from "./scoring";
import { brand } from "@/config/branding";

/**
 * Builds the shareable, branded results image — the "we played Holey Buckets!"
 * card for word of mouth. It's drawn on a canvas (no extra library) so we have
 * full control of the brand, and it exports as a square PNG that's ideal for
 * Instagram/Messages.
 *
 * Runs in the browser only (it needs a <canvas>).
 */
export function buildShareImage(
  round: Round,
  course: Course,
  board: Standing[],
): Promise<Blob | null> {
  const SIZE = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve(null);

  const c = brand.colors;
  const center = SIZE / 2;

  const text = (
    str: string,
    y: number,
    font: string,
    color: string,
    align: CanvasTextAlign = "center",
    x: number = center,
  ) => {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.fillText(str, x, y);
  };

  // Background
  ctx.fillStyle = c.cream;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Header band
  ctx.fillStyle = c.primary;
  ctx.fillRect(0, 0, SIZE, 300);
  drawBucketMark(ctx, center, 110);
  text(brand.name.toUpperCase(), 250, "bold 72px system-ui, sans-serif", "#ffffff");

  // Headline. The brand is already huge above, so the subline is just the
  // place — avoids doubling up when a course name contains the brand.
  text("We played Holey Buckets!", 420, "bold 52px system-ui, sans-serif", c.ink);
  text(`at ${course.location}`, 478, "34px system-ui, sans-serif", c.stone);

  // Winner
  const winner = board[0];
  if (winner) {
    ctx.fillStyle = c.sunshine;
    roundedRect(ctx, 140, 540, SIZE - 280, 130, 28);
    ctx.fill();
    text("WINNER", 590, "bold 30px system-ui, sans-serif", c.ink);
    text(
      `${winner.name} · ${winner.total} (${formatToPar(winner.toPar)})`,
      640,
      "bold 46px system-ui, sans-serif",
      c.ink,
    );
  }

  // Standings (top 5)
  let y = 760;
  board.slice(0, 5).forEach((row) => {
    text(`${row.rank}.  ${row.name}`, y, "40px system-ui, sans-serif", c.ink, "left", 160);
    text(
      `${row.total}  ${formatToPar(row.toPar)}`,
      y,
      "bold 40px system-ui, sans-serif",
      c.ink,
      "right",
      SIZE - 160,
    );
    y += 58;
  });

  // Footer credit
  text(round.groupName, SIZE - 70, "30px system-ui, sans-serif", c.ink, "center");
  text(
    brand.umbrellaCredit,
    SIZE - 30,
    "bold 26px system-ui, sans-serif",
    c.primary,
    "center",
  );

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
}

/** The Holey Buckets logo mark drawn on canvas (white, for the green header). */
function drawBucketMark(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
): void {
  const c = brand.colors;

  // Ball trajectory arc
  ctx.strokeStyle = c.sunshine;
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.setLineDash([2, 18]);
  ctx.beginPath();
  ctx.moveTo(cx - 78, cy + 20);
  ctx.quadraticCurveTo(cx - 10, cy - 80, cx + 56, cy - 56);
  ctx.stroke();
  ctx.setLineDash([]);

  // Ball
  ctx.fillStyle = c.sunshine;
  ctx.beginPath();
  ctx.arc(cx + 60, cy - 56, 14, 0, Math.PI * 2);
  ctx.fill();

  // Bucket body
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(cx - 56, cy - 22);
  ctx.lineTo(cx + 56, cy - 22);
  ctx.lineTo(cx + 40, cy + 70);
  ctx.quadraticCurveTo(cx, cy + 84, cx - 40, cy + 70);
  ctx.closePath();
  ctx.fill();

  // Bucket rim
  ctx.fillStyle = c.deepPine;
  ctx.beginPath();
  ctx.ellipse(cx, cy - 22, 56, 14, 0, 0, Math.PI * 2);
  ctx.fill();
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Share the image via the device's native share sheet if available
 * (phones), otherwise fall back to downloading the PNG.
 */
export async function shareImage(blob: Blob, round: Round): Promise<void> {
  const file = new File([blob], "holey-buckets-result.png", {
    type: "image/png",
  });
  const shareData = {
    files: [file],
    title: "Holey Buckets",
    text: `${round.groupName} played Holey Buckets!`,
  };

  if (
    typeof navigator !== "undefined" &&
    navigator.canShare &&
    navigator.canShare(shareData)
  ) {
    try {
      await navigator.share(shareData);
      return;
    } catch {
      // User cancelled, or share failed — fall through to download.
    }
  }
  downloadImage(blob);
}

/** Save the PNG to the device. */
export function downloadImage(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "holey-buckets-result.png";
  a.click();
  URL.revokeObjectURL(url);
}
