/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "media",
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontSize: {
        xs: ["14px", { lineHeight: "1.25rem" }],
        sm: ["16px", { lineHeight: "1.5rem" }],
        base: ["18px", { lineHeight: "1.75rem" }],
        lg: ["20px", { lineHeight: "2rem" }],
        xl: ["22px", { lineHeight: "2rem" }],
        "2xl": ["26px", { lineHeight: "2.25rem" }],
        "3xl": ["32px", { lineHeight: "2.5rem" }],
        "4xl": ["38px", { lineHeight: "2.75rem" }],
        "5xl": ["50px", { lineHeight: "1" }],
        "6xl": ["62px", { lineHeight: "1" }],
        "7xl": ["74px", { lineHeight: "1" }],
        "8xl": ["98px", { lineHeight: "1" }],
        "9xl": ["130px", { lineHeight: "1" }],
      },
      fontFamily: {
        serif: ["CormorantGaramond_600SemiBold", "Georgia", "serif"],
        body: ["DMSans_400Regular", "system-ui", "sans-serif"],
        "body-light": ["DMSans_300Light", "system-ui", "sans-serif"],
      },
      colors: {
        background: "#F5F0E8",
        foreground: "#2C2E33",
        card: "#F0EBE3",
        "card-foreground": "#2C2E33",
        popover: {
          DEFAULT: "#F5F0E8",
          foreground: "#2C2E33",
        },
        primary: {
          DEFAULT: "#5A7A66",
          foreground: "#F5F0E8",
        },
        secondary: {
          DEFAULT: "#C4A86A",
          foreground: "#2C2E33",
        },
        muted: {
          DEFAULT: "#E8E3DB",
          foreground: "#6B7280",
        },
        accent: {
          DEFAULT: "#C4A86A",
          foreground: "#2C2E33",
        },
        destructive: {
          DEFAULT: "#DC2626",
          foreground: "#F9FAFB",
        },
        success: {
          DEFAULT: "#166534",
          foreground: "#166534",
        },
        border: "#DDD6CC",
        input: "#DDD6CC",
        ring: "#5A7A66",
        sidebar: {
          DEFAULT: "#F0EBE3",
          foreground: "#2C2E33",
          primary: "#5A7A66",
          "primary-foreground": "#F5F0E8",
          accent: "#E2DDD5",
          "accent-foreground": "#2C2E33",
          border: "#DDD6CC",
          ring: "#5A7A66",
        },
        /* Dark mode tokens (HSL → hex) para uso com dark: */
        "dark-bg": "#16181D",
        "dark-fg": "#E8E3DB",
        "dark-card": "#1E2229",
        "dark-popover": "#1A1E26",
        "dark-muted": "#2A2E36",
        "dark-muted-fg": "#A69B8F",
        "dark-border": "#2D3139",
        "dark-border-light": "#363B45",
        "dark-border-heavy": "#242830",
        "dark-primary": "#6B8F71",
        "dark-primary-fg": "#16181D",
        "dark-badge-info": "#0D9DD6",
        "dark-badge-warning": "#E6A800",
        "dark-badge-success": "#22A855",
        "dark-badge-error": "#E03E3E",
      },
      borderRadius: {
        lg: "1rem",
        md: "calc(1rem - 2px)",
        sm: "calc(1rem - 4px)",
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
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-up": "fade-up 0.8s ease-out",
        "fade-in": "fade-in 0.6s ease-out",
      },
      /* Espaçamentos padrão Inself (referência) */
      spacing: {
        "4.5": "1.125rem",
        "13": "3.25rem",
        "15": "3.75rem",
        "18": "4.5rem",
      },
      /* Sombras dark mode (InSelf) */
      boxShadow: {
        "dark-sm": "0 2px 8px -2px rgba(22, 24, 29, 0.3)",
        "dark-md": "0 4px 16px -4px rgba(22, 24, 29, 0.4)",
        "dark-lg": "0 8px 24px -6px rgba(22, 24, 29, 0.5)",
        "dark-elegant": "0 10px 30px -10px rgba(107, 143, 113, 0.2)",
      },
    },
  },
  plugins: [],
};
