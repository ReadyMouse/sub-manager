/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Professional brand colors inspired by real estate platforms
        brand: {
          navy: '#1a3a52',
          'navy-dark': '#0f2537',
          'navy-light': '#2d5372',
          teal: '#3d8a9c',
          'teal-dark': '#2b6673',
          'teal-light': '#5ca5b4',
          sage: '#6b8e7f',
          'sage-dark': '#4d6d5f',
          'sage-light': '#8aab9d',
        },
        // Legacy PayPal colors (for compatibility)
        paypal: {
          blue: '#1a3a52',
          'blue-dark': '#0f2537',
          'blue-light': '#3d8a9c',
          yellow: '#d4a574',
          gray: '#2C2E2F',
        },
        // PYUSD colors updated to match scheme
        pyusd: {
          green: '#6b8e7f',
          'green-dark': '#4d6d5f',
          'green-light': '#8aab9d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(26, 58, 82, 0.08)',
        'medium': '0 4px 16px rgba(26, 58, 82, 0.12)',
        'strong': '0 8px 24px rgba(26, 58, 82, 0.16)',
      },
    },
  },
  plugins: [],
}

