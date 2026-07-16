/**
 * Confetti motif — backyard-party energy, floating behind a page's content.
 *
 * Shared by the landing page and each course home so the two entry screens
 * feel like one family. Purely decorative (aria-hidden), no state, renders on
 * the server. Yellow stays a confetti accent here, never a competing button.
 * The parent must be `relative` (the dots position against it) and the page's
 * real content should sit in a `relative z-10` wrapper so it paints on top.
 */
export function ConfettiBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <span className="absolute left-9 top-24 h-3 w-3 rounded-full bg-brand-sunshine" />
      <span className="absolute right-12 top-16 h-2.5 w-2.5 rounded-full bg-brand-bucketBlue" />
      <span className="absolute left-20 top-40 h-2 w-2 rounded-full bg-brand-penalty" />
      <span className="absolute right-16 top-44 h-3 w-3 rounded-full bg-brand-sunshine/80" />
      <span className="absolute left-1/2 top-10 h-2 w-2 rounded-full bg-brand-penalty/70" />
      <span className="absolute right-24 top-1/3 h-2 w-2 rounded-full bg-brand-bucketBlue/70" />
      <span className="absolute left-12 top-1/2 h-2.5 w-2.5 rounded-full bg-brand-sunshine/70" />
    </div>
  );
}
