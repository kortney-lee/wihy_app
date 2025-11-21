/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Your existing design tokens from base.css
        'vh-accent': '#1a73e8',
        'vh-accent-2': '#34a853', 
        'vh-ink': '#202124',
        'vh-muted': '#5f6368',
        'vh-surface': '#ffffff',
        'vh-surface-2': '#f8fbff',
        
        // Additional color mappings for convenience
        primary: '#1a73e8',
        secondary: '#34a853',
        gray: {
          50: '#f9f9f9',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'sans-serif'],
      },
      spacing: {
        'vh-header': 'var(--vh-header-height, 80px)',
      },
      boxShadow: {
        'vh-ring': '0 0 0 3px rgba(26,115,232,.18)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      }
    },
  },
  plugins: [],
}