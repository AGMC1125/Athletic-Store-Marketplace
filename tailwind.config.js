/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Marca Athletic Store ─────────────────────────────
        brand: {
          black:        "#0A0A0A",
          "black-soft": "#1C1C1C",
          "black-card": "#242424",
          gold:         "#D4AF37",
          "gold-light": "#F5C518",
          "gold-pale":  "#FDF3C0",
        },
        // ── Texto ────────────────────────────────────────────
        content: {
          primary:   "#FFFFFF",
          secondary: "#9CA3AF",
          muted:     "#6B7280",
          inverse:   "#0A0A0A",
        },
        // ── Estados / feedback ───────────────────────────────
        state: {
          success: "#22C55E",
          error:   "#EF4444",
          warning: "#F59E0B",
          info:    "#3B82F6",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "hero-gradient": "linear-gradient(135deg, #0A0A0A 0%, #1C1C1C 50%, #0A0A0A 100%)",
        "gold-gradient": "linear-gradient(135deg, #D4AF37 0%, #F5C518 100%)",
        "card-gradient": "linear-gradient(180deg, #1C1C1C 0%, #242424 100%)",
      },
      boxShadow: {
        "gold-sm": "0 0 12px rgba(212, 175, 55, 0.2)",
        "gold-md": "0 0 24px rgba(212, 175, 55, 0.35)",
        "gold-lg": "0 0 40px rgba(212, 175, 55, 0.5)",
        "card":    "0 4px 24px rgba(0, 0, 0, 0.6)",
      },
      animation: {
        "fade-in":  "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.4s ease-out",
      },
      keyframes: {
        fadeIn:  { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: { "0%": { opacity: "0", transform: "translateY(16px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
      },
    },
  },
  plugins: [],
}
