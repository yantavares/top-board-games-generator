/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0F172A', // Slate 900
        card: 'rgba(30, 41, 59, 0.7)', // Slate 800 with opacity
        primary: '#6366F1', // Indigo 500
        secondary: '#06B6D4', // Cyan 500
      }
    },
  },
  plugins: [],
}
