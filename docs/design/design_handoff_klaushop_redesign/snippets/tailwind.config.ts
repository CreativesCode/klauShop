// tailwind.config.ts — SOLO los cambios respecto al archivo actual (fusionar dentro de theme.extend)
// Se mantienen primary/accent/neutral existentes; se corrige primary-950 y se añaden superficies.

extend: {
  fontFamily: {
    sans: ["var(--font-sans)", "system-ui", "sans-serif"],
    display: ["var(--font-display)", "Georgia", "serif"],
  },
  colors: {
    // ...border, input, ring, background, foreground, secondary, etc. sin cambios
    primary: {
      50: "#F5F3FF", 100: "#EDE9FE", 200: "#DDD6FE", 300: "#C4B5FD",
      400: "#A78BFA", 500: "#8B5CF6", 600: "#6D28D9", 700: "#5B21B6",
      800: "#4C1D95",
      900: "#4338CA", // ⚠️ es índigo; no usar en el rediseño
      950: "#2E1065", // CAMBIA (antes #312E81): barra de anuncio, bloque Encargos
      DEFAULT: "#6D28D9",
      foreground: "#FFFFFF",
    },
    // accent y neutral: sin cambios
    ink: "#111827",
    cream: { DEFAULT: "#FFF8EE", border: "#F3E6CF", strong: "#E7DCC8" },
    line: { DEFAULT: "#ECEAF3", soft: "#F1EFF6", header: "#EEEAF6" },
    surface: { muted: "#F4F2F8", tint: "#F1EEF7", admin: "#F6F5FA", hover: "#FAF9FD", soft: "#F3F2F7" },
  },
  maxWidth: {
    store: "1320px",
    admin: "1400px",
  },
  borderRadius: {
    lg: "var(--radius)",            // 18px
    md: "calc(var(--radius) - 2px)", // 16px
    sm: "calc(var(--radius) - 4px)", // 14px
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
    // máx. 4 columnas, mín. 156px (2 en móvil 390px)
    products: "repeat(auto-fill, minmax(max(156px, calc((100% - 72px) / 4)), 1fr))",
  },
},
