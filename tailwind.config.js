/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        civic: {
          DEFAULT: "#0B6E4F",
          dark: "#0a5540",
        },
      },
    },
  },
  plugins: [],
};
