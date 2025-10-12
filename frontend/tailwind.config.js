/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // PayPal brand colors
        paypal: {
          blue: '#0070BA',
          'blue-dark': '#003087',
          'blue-light': '#009CDE',
          yellow: '#FFC439',
          gray: '#2C2E2F',
        },
        // PYUSD colors
        pyusd: {
          green: '#00D54B',
          'green-dark': '#00A83C',
          'green-light': '#7FE5A3',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

