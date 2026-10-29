/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F7F5EF",
        ink: "#23261F",
        workshop: {
          50: "#EAF2F1",
          100: "#CDE0DE",
          400: "#2E6664",
          500: "#1F4B4A",
          600: "#173937",
          700: "#102725",
        },
        turmeric: {
          100: "#FBEACB",
          400: "#EFB030",
          500: "#E3A324",
          600: "#B87F14",
        },
        sprout: {
          100: "#DCEADD",
          400: "#5C8F6A",
          500: "#4C7A5B",
          600: "#3A5F46",
        },
        clay: {
          100: "#F1E4D9",
          400: "#C97A4A",
          500: "#B5602F",
        },
        line: "#DDD6C4",
      },
      fontFamily: {
        sans: [
          "Work Sans",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },
      fontSize: {
        base: ["1.0625rem", "1.6rem"],
        lg: ["1.1875rem", "1.7rem"],
      },
      borderRadius: {
        card: "0.875rem",
      },
      boxShadow: {
        card: "0 1px 0 rgba(35,38,31,0.04)",
      },
    },
  },
  plugins: [],
};
