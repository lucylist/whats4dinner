/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'sans-serif'],
        serif: ['Georgia', '"Times New Roman"', 'serif'],
        script: ['Pinyon Script', 'cursive'],
      },
      colors: {
        forest: {
          950: '#030E03',
          900: '#081408',
          800: '#132213',
          700: '#1D2E1D',
          600: '#263826',
          500: '#334E33',
          400: '#436E43',
          300: '#648357',
          200: '#88A277',
          100: '#AEC8A0',
        },
        cream: {
          DEFAULT: '#FFF0DC',
          50: '#FFFAF5',
          100: '#FFF0DC',
          200: '#F5E6C8',
          300: '#E8D5AA',
          400: '#C8B99A',
          500: '#A89A7A',
        },
        cobalt: {
          DEFAULT: '#7DAEE0',
          light: '#A3C8EC',
          dark: '#4A7EC5',
        },
        terracotta: {
          DEFAULT: '#D4836B',
          light: '#E0A08A',
          dark: '#B86A52',
        },
        gold: {
          DEFAULT: '#C9A96E',
          light: '#DBC48F',
          dark: '#A88B4F',
        },
        primary: {
          50: '#2D422D',
          100: '#3A5A3A',
          200: '#4A7A4A',
          300: '#6B8F5E',
          400: '#8FAE7E',
          500: '#C9A96E',
          600: '#A88B4F',
          700: '#8A7040',
          800: '#6B5530',
          900: '#4D3A20',
        },
        accent: {
          50: '#FFF0DC',
          100: '#F5E6C8',
          200: '#E8D5AA',
          300: '#DBC48F',
          400: '#C9A96E',
          500: '#D4836B',
          600: '#B86A52',
          700: '#9C5340',
          800: '#803C2E',
          900: '#652B20',
        }
      }
    },
  },
  plugins: [],
}
