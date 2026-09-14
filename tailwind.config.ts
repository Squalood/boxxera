import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0A0A0B",
          900: "#121214",
          800: "#1B1B1F",
          700: "#26262B",
          600: "#38383F",
          500: "#57575F",
          400: "#7A7A82",
          300: "#A3A3AA",
          200: "#D0D0D4",
          100: "#EDEDEF",
          50: "#F7F7F8"
        },
        accent: {
          600: "#B3121A",
          500: "#D3181F",
          400: "#E8433C"
        },
        verified: {
          600: "#0F6E56",
          500: "#1D9E75"
        },
        // --- Public-facing "arena" identity (paper + official seal) ----------
        paper: {
          50: "#FAF8F3",
          100: "#F0EEE9",
          200: "#E3DDCF",
          300: "#D9D2C2",
          400: "#C7BFAC",
          500: "#A69E8C",
          600: "#8A8272",
          700: "#6B6355",
          800: "#4A4438",
          900: "#1C1912"
        },
        oxblood: {
          500: "#8A2632",
          600: "#7A1F2B",
          700: "#5C1721"
        },
        brass: {
          500: "#C9A227",
          600: "#8A6A15"
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "sans-serif"]
      },
      borderRadius: {
        card: "12px"
      }
    }
  },
  plugins: []
};

export default config;
