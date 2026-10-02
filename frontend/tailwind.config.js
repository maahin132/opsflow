/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  darkMode: "class",

  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Manrope", "sans-serif"],
      },

      colors: {
        // Main application surfaces
        canvas: "#F4F1EC",
        surface: "#FBFAF7",
        ink: "#25221F",
        muted: "#77716A",
        line: "#DED8CF",

        // Warm neutral brand system
        accent: {
          DEFAULT: "#9A8170",
          hover: "#806858",
          soft: "#EDE5DD",
          strong: "#665346",
        },

        // Dark navigation
        sidebar: "#24211E",

        // Additional neutral tones
        stone: {
          50: "#FAF9F6",
          100: "#F4F1EC",
          200: "#E8E2DA",
          300: "#D8CFC5",
          400: "#B8ADA2",
          500: "#95897D",
          600: "#766B61",
          700: "#5B5149",
          800: "#403A35",
          900: "#2B2825",
        },

        success: {
          DEFAULT: "#657A68",
          soft: "#E8EEE8",
        },

        warning: {
          DEFAULT: "#A17B4F",
          soft: "#F3EADF",
        },

        danger: {
          DEFAULT: "#A4655D",
          soft: "#F2E5E2",
        },
      },

      boxShadow: {
        soft: "0 4px 24px rgba(57, 48, 40, 0.05)",
        panel: "0 12px 40px rgba(57, 48, 40, 0.08)",
        elevated: "0 20px 60px rgba(57, 48, 40, 0.12)",
      },

      borderRadius: {
        panel: "18px",
      },
    },
  },

  plugins: [],
};