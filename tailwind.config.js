/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#1b3a57",
          50: "#eef3f8",
          100: "#d8e4ef",
          200: "#b2c8df",
          300: "#88a9cb",
          400: "#5b86b2",
          500: "#3c6a97",
          600: "#2f5477",
          700: "#244059",
          800: "#1b2f40",
          900: "#111e28"
        },
        accent: {
          DEFAULT: "#f4a259",
          100: "#fff1e3",
          200: "#ffd9b5",
          300: "#fbb979",
          400: "#f4a259",
          500: "#e98630",
          600: "#c96a22",
          700: "#9b4c12"
        }
      },
      fontFamily: {
        display: ["Sora", "ui-sans-serif", "system-ui"],
        body: ["Work Sans", "ui-sans-serif", "system-ui"]
      }
    }
  },
  plugins: []
};

