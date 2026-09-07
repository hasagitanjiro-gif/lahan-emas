/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#070604',
        surface: '#100D08',
        surface2: '#191509',
        line: '#2A2416',
        primary: '#D4AF37',
        'primary-dim': '#9C7C22',
        champagne: '#F2DC8F',
        accent: '#F4E4C1',
        ink: '#F4EFE1',
        muted: '#9B9280',
        danger: '#E0654F',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
