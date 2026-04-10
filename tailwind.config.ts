import type { Config } from "tailwindcss";
import { theme } from "./styles/theme";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: theme.colors.background,
        backgroundCard: theme.colors.backgroundCard,
        backgroundHover: theme.colors.backgroundHover,
        accentBlue: theme.colors.accentBlue,
        accentCyan: theme.colors.accentCyan,
        accentRed: theme.colors.accentRed,
        accentGreen: theme.colors.accentGreen,
        textPrimary: theme.colors.textPrimary,
        textSecondary: theme.colors.textSecondary,
        border: theme.colors.border,
        borderHover: theme.colors.borderHover,
        // Aliases used by existing classes
        card: theme.colors.backgroundCard,
        hover: theme.colors.backgroundHover,
        blue: theme.colors.accentBlue,
        cyan: theme.colors.accentCyan,
        red: theme.colors.accentRed,
        green: theme.colors.accentGreen,
        primary: theme.colors.textPrimary,
        secondary: theme.colors.textSecondary,
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      borderRadius: {
        DEFAULT: theme.borderRadius,
      },
      boxShadow: {
        card: theme.shadow,
        blue: "0 0 20px rgba(45, 111, 255, 0.3)",
      },
    },
  },
  plugins: [],
};

export default config;
