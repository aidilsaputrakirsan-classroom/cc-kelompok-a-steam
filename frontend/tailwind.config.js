/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'inti-dark': '#060913',
        'inti-card': 'rgba(31, 41, 77, 0.94)',
        'inti-orange': {
          light: '#ffb57f',
          DEFAULT: '#ff8f48',
          dark: '#ff9c3c',
        },
        'inti-text': {
          light: '#edf2ff',
          muted: '#d9d7e5',
          deep: '#9aa0b8',
        }
      },
      backgroundImage: {
        'inti-gradient': "linear-gradient(135deg, rgba(255, 164, 82, 0.14), rgba(25, 39, 76, 0.92))",
        'inti-radial': "radial-gradient(circle at top left, rgba(136, 115, 255, 0.16), transparent 24%), radial-gradient(circle at bottom right, rgba(255, 184, 130, 0.18), transparent 24%), #060913",
      }
    },
  },
  plugins: [],
}
