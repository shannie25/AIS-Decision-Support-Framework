/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cloud: { DEFAULT: '#378ADD', light: '#E6F1FB', dark: '#185FA5' },
        local: { DEFAULT: '#639922', light: '#EAF3DE', dark: '#3B6D11' },
        hybrid:{ DEFAULT: '#BA7517', light: '#FAEEDA', dark: '#854F0B' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
