import type { Config } from "tailwindcss";
import { brand } from "./src/config/branding";

// Tailwind reads brand colors from src/config/branding.ts so the whole app
// re-skins from that one file. Change colors there, not here.
const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Exposes every brand token as e.g. `bg-brand-primary`, `text-brand-stone`.
        brand: brand.colors,
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
