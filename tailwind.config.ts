import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    // ─── Breakpoints ───────────────────────────────────────────────────────────
    screens: {
      xs:  "475px",
      sm:  "640px",
      md:  "768px",
      lg:  "1024px",
      xl:  "1280px",
      "2xl": "1400px",
    },

    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },

    // ─── Border radius: NONE by default — brutalist ────────────────────────────
    borderRadius: {
      none:   "0px",
      brutal: "2px", // the only curvature allowed
      DEFAULT: "0px",
    },

    // ─── Font families ─────────────────────────────────────────────────────────
    fontFamily: {
      sans:    ["var(--font-body)", "Inter", "system-ui", "sans-serif"],
      body:    ["var(--font-body)", "Inter", "system-ui", "sans-serif"],
      heading: ["var(--font-heading)", "Space Grotesk", "system-ui", "sans-serif"],
      mono:    ["var(--font-mono)", "JetBrains Mono", "Menlo", "monospace"],
    },

    extend: {
      // ─── Refined Brutal color palette ────────────────────────────────────────
      colors: {
        // Semantic tokens (CSS-variable–backed, HSL)
        background:  "hsl(var(--background))",
        foreground:  "hsl(var(--foreground))",

        border: "hsl(var(--border))",
        input:  "hsl(var(--input))",
        ring:   "hsl(var(--ring))",

        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        success: {
          DEFAULT:    "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT:              "hsl(var(--sidebar-background))",
          foreground:           "hsl(var(--sidebar-foreground))",
          primary:              "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent:               "hsl(var(--sidebar-accent))",
          "accent-foreground":  "hsl(var(--sidebar-accent-foreground))",
          border:               "hsl(var(--sidebar-border))",
          ring:                 "hsl(var(--sidebar-ring))",
        },

        // Raw palette literals — available as e.g. `text-neon`, `bg-near-black`
        "warm-white":   "#FAFAF9",  // stone warm bg, not pure white
        "near-black":   "#121214",  // soft dark, not pure black
        neon:           "#A3E635",  // lime-400, softer than #CCFF00
        "red-orange":   "#EF4444",  // red-500, replaces harsh #FF3D00
        "neon-green":   "#22C55E",  // green-500, replaces #00FF88
        "zinc-muted":   "#78716C",  // stone-500
        "border-light": "#D6D3D1",  // stone-300
        "border-dark":  "#292524",  // stone-800
        "card-light":   "#FFFFFF",
        "card-dark":    "#1C1917",  // stone-900
      },

      // ─── Keyframes ────────────────────────────────────────────────────────────
      keyframes: {
        // Existing accordion (kept for Radix UI compat)
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },

        // Brutalist slide-in from left — hard, no ease bounce
        "slide-in": {
          "0%":   { transform: "translateX(-100%)", opacity: "0" },
          "100%": { transform: "translateX(0)",     opacity: "1" },
        },

        // Fade-up — content rises from below, stark
        "fade-up": {
          "0%":   { transform: "translateY(24px)", opacity: "0" },
          "100%": { transform: "translateY(0)",    opacity: "1" },
        },

        // Neon pulse — the primary #A3E635 glows and dims
        "pulse-neon": {
          "0%, 100%": {
            boxShadow: "0 0 0px #A3E635, 0 0 0px #A3E635",
            opacity: "1",
          },
          "50%": {
            boxShadow: "0 0 12px #A3E635, 0 0 32px rgba(163,230,53,0.4)",
            opacity: "0.85",
          },
        },
      },

      // ─── Animations ───────────────────────────────────────────────────────────
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        "slide-in":       "slide-in 0.25s linear",
        "fade-up":        "fade-up 0.3s ease-out",
        "pulse-neon":     "pulse-neon 2s ease-in-out infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
