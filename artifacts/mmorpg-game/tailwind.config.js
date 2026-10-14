/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Cinzel Decorative"', '"Russo One"', 'sans-serif'],
        sans: ['Orbitron', 'Inter', 'Outfit', 'sans-serif'],
        mono: ['"Share Tech Mono"', 'Space Mono', 'monospace'],
      },
      letterSpacing: {
        tighter: '-0.05em',
        tight: '-0.025em',
        normal: '0em',
        wide: '0.025em',
        wider: '0.05em',
        widest: '0.1em',
        epic: '0.18em',
      },
    },
  },
  plugins: [],
};
