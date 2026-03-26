import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FAFAF7",
        foreground: "#1A1A1A",
        muted: "#6B6B6B",
        "board-red": "#D4645C",
        "board-green": "#5B9F6E",
        "board-cream": "#F5E6C8",
        "board-dark": "#2C2C2C",
        wire: "#888888",
        "accent-blue": "#4A7C9B",
        "accent-gold": "#D4A853",
        "accent-coral": "#D4756A",
      },
      fontFamily: {
        serif: ["var(--font-source-serif)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      maxWidth: {
        article: "720px",
        wide: "1080px",
      },
    },
  },
  plugins: [],
};
export default config;
