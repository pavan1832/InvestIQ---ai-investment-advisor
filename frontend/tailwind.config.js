/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#e0eaff',
          200: '#c7d9fe',
          300: '#a5bcfc',
          400: '#7f96f8',
          500: '#5b6ef2',
          600: '#3d4ee6',
          700: '#2f3dcc',
          800: '#2933a5',
          900: '#252f83',
          950: '#171d4f',
        },
        surface: {
          DEFAULT: '#0f1117',
          card:    '#171923',
          border:  '#232736',
        },
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
        body:    ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
