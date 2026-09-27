
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
        canvas: "#F7F7F5",
        surface: "#FFFFFF",
        ink: "#18181B",
        muted: "#71717A",
        line: "#E8E8E5",

        accent: {
          DEFAULT: "#635BFF",
          hover: "#5148E5",
          soft: "#EEEDFF",
        },

        sidebar: "#171717",
      },

      boxShadow: {
        soft: "0 4px 24px rgba(0, 0, 0, 0.04)",
        panel: "0 12px 40px rgba(0, 0, 0, 0.06)", 
      },

      borderRadius: {
        panel: "18px",
      },
    },
  },

  plugins: [],
};