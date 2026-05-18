/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        xs: '480px'
      },
      colors: {
        primary: { DEFAULT: '#10b981', dark: '#059669', light: '#34d399' },
        surface: { DEFAULT: '#0f172a', light: '#1e293b' }
      }
    }
  },
  plugins: []
}
