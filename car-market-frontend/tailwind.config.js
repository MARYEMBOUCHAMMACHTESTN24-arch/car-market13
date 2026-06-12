/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* ─── AutoMark Official Brand Palette ─── */
        am: {
          red:        '#D32F2F',   /* Primary / CTA  */
          'red-dark': '#B71C1C',   /* Hover state    */
          'red-light':'#EF5350',   /* Accent light   */
          bg:         '#111827',   /* Background Dark */
          surface:    '#1F2937',   /* Cards / Panels  */
          border:     '#374151',   /* Borders         */
          white:      '#FFFFFF',
          gray:       '#D1D5DB',
          muted:      '#9CA3AF',
        },
        /* Legacy aliases kept for backward compat */
        brand: {
          red:   '#D32F2F',
          dark:  '#111827',
          black: '#000000',
        },
        primary: {
          50:  '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#D32F2F',
          700: '#B71C1C',
          800: '#991b1b',
          900: '#7f1d1d',
        },
      },
      fontFamily: {
        heading: ['Montserrat', 'sans-serif'],
        body:    ['Inter', 'sans-serif'],
      },
      animation: {
        'spin-slow':     'spin 8s linear infinite',
        'fade-in-up':    'fadeInUp 0.8s ease-out',
        'fade-in':       'fadeIn 0.6s ease-out',
        'slide-in-left': 'slideInLeft 0.4s ease-out',
      },
      keyframes: {
        fadeInUp: {
          '0%':   { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInLeft: {
          '0%':   { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      boxShadow: {
        'am-red':     '0 4px 24px rgba(211,47,47,0.35)',
        'am-surface': '0 4px 20px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
