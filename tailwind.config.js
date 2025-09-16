/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0b1220',
        panel: '#111827',
        accent: '#2563eb',
      },
      borderRadius: {
        xl: '12px',
      }
    },
  },
  plugins: [],
};

