import type { Config } from "tailwindcss";

const config: Config = {
  // Manual theme via class — toggled by ThemeToggle on <html>.
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand palette — the same in both modes
        primary: {
          DEFAULT: "#006FBA",
          hover: "#005A98",
        },
        secondary: {
          DEFAULT: "#00AE5E",
          hover: "#008F4D",
        },
        support: {
          DEFAULT: "#00BDCD",
          hover: "#009BAA",
        },
        cream: {
          DEFAULT: "#FAF7EE",
          deep: "#F4F0E2",
        },
        ink: {
          DEFAULT: "#0E0F12",
          soft: "#3A3B40",
          deep: "#0A1020",
          panel: "#141A2A",
        },
        champagne: {
          DEFAULT: "#E8D9B5",
          soft: "#C7B894",
        },

        // ----- Semantic theme tokens (CSS-var-driven) -----
        // Switch automatically when html.dark toggles. Use these in
        // components instead of hardcoding cream / navy values.
        page: "rgb(var(--page) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-alt": "rgb(var(--surface-alt) / <alpha-value>)",
        "surface-glass": "rgb(var(--surface-glass) / <alpha-value>)",
        "ink-on-page": "rgb(var(--ink-on-page) / <alpha-value>)",
        "ink-muted": "rgb(var(--ink-muted) / <alpha-value>)",
        "ink-faint": "rgb(var(--ink-faint) / <alpha-value>)",
        "eyebrow-tone": "rgb(var(--eyebrow-tone) / <alpha-value>)",
        "italic-tone": "rgb(var(--italic-tone) / <alpha-value>)",
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "Inter",
          "Helvetica Neue",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Arial",
          "sans-serif",
        ],
        display: [
          "var(--font-display)",
          "Playfair Display",
          "ui-serif",
          "Georgia",
          "serif",
        ],
      },
      letterSpacing: {
        tightest: "-0.04em",
      },
      borderRadius: {
        card: "14px",
        hero: "20px",
      },
      boxShadow: {
        // These adapt visually to either bg via subtle alphas.
        soft: "0 1px 2px rgba(0,0,0,0.10), 0 12px 32px -10px rgba(0,0,0,0.30)",
        elevated:
          "0 1px 2px rgba(0,0,0,0.12), 0 24px 56px -12px rgba(0,0,0,0.40)",
        hairline: "inset 0 0 0 1px rgba(15,17,21,0.06)",
        "glow-primary":
          "0 0 0 1px rgba(0,111,186,0.40), 0 8px 28px -4px rgba(0,111,186,0.45)",
        "glow-support":
          "0 0 0 1px rgba(0,189,205,0.35), 0 8px 28px -4px rgba(0,189,205,0.40)",
      },
      backgroundImage: {
        "primary-glow":
          "radial-gradient(120% 80% at 0% 0%, rgba(0,111,186,0.10), transparent 60%)",
        "brand-line":
          "linear-gradient(90deg, rgba(0,111,186,0) 0%, rgba(0,111,186,0.6) 30%, rgba(0,189,205,0.6) 60%, rgba(0,174,94,0.6) 90%, rgba(0,174,94,0) 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
