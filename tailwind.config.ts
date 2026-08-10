import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--bg-base)",
        panel: "var(--bg-panel)",
        foreground: "var(--text-primary)",
        muted: "var(--text-muted)",
        primary: "var(--brand-blue)",
        secondary: "var(--brand-green)",
        border: "var(--border-color)",
      },
      fontFamily: {
        sans: ["var(--font-plus-jakarta)", "sans-serif"],
      },
      borderRadius: {
        card: "16px",
      },
    },
  },
  plugins: [],
};

export default config;
