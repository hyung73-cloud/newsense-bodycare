/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#2563EB',
        surface: '#F5F7FA',
        success: '#16A34A',
        warning: '#F59E0B',
        danger: '#EF4444',
        muted: '#6B7280',
        border: '#E5E7EB',
      },
      borderRadius: {
        card: '16px',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.08)',
        elevated: '0 4px 12px 0 rgb(0 0 0 / 0.08)',
      },
      fontSize: {
        caption: ['0.6875rem', { lineHeight: '1rem' }],
      },
    },
  },
  plugins: [],
};
