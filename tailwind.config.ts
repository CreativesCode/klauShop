import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "2rem",
        lg: "2rem",
        xl: "2rem",
        "2xl": "2rem",
        "3xl": "2rem",
        "4xl": "2rem",
      },
      screens: {
        "2xl": "1700px",
        "3xl": "1900px",
        "4xl": "2100px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          50: "#F5F3FF",
          100: "#EDE9FE",
          200: "#DDD6FE",
          300: "#C4B5FD",
          400: "#A78BFA",
          500: "#8B5CF6",
          600: "#6D28D9",
          700: "#5B21B6",
          800: "#4C1D95",
          900: "#4338CA", // indigo: not part of the redesign palette
          950: "#2E1065",
          DEFAULT: "#6D28D9",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          50: "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#F59E0B",
          600: "#D97706",
          700: "#B45309",
          800: "#92400E",
          900: "#78350F",
          950: "#451A03",
          DEFAULT: "#F59E0B",
          // Text on amber is always ink (white on amber fails contrast)
          foreground: "#111827",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        neutral: {
          50: "#FAFAFC",
          100: "#F5F5F7",
          200: "#E5E7EB",
          300: "#D1D5DB",
          400: "#9CA3AF",
          500: "#6B7280",
          600: "#4B5563",
          700: "#374151",
          800: "#1F2937",
          900: "#111827",
          950: "#030712",
        },
        ink: "#111827",
        cream: { DEFAULT: "#FFF8EE", border: "#F3E6CF", strong: "#E7DCC8" },
        line: { DEFAULT: "#ECEAF3", soft: "#F1EFF6", header: "#EEEAF6" },
        surface: {
          muted: "#F4F2F8",
          tint: "#F1EEF7",
          admin: "#F6F5FA",
          hover: "#FAF9FD",
          soft: "#F3F2F7",
        },
      },
      maxWidth: {
        store: "1320px",
        admin: "1400px",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "4xl": "28px",
      },
      boxShadow: {
        cta: "0 8px 24px -8px rgba(109,40,217,.55)",
        drawer: "-20px 0 60px -20px rgba(17,24,39,.35)",
        toast: "0 12px 32px -8px rgba(17,24,39,.4)",
        seg: "0 1px 3px rgba(17,24,39,.12)",
      },
      transitionTimingFunction: {
        soft: "cubic-bezier(.2,.7,.2,1)",
      },
      gridTemplateColumns: {
        // At most 4 columns, min 156px (2 columns on a 390px phone)
        products:
          "repeat(auto-fill, minmax(max(156px, calc((100% - 72px) / 4)), 1fr))",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
