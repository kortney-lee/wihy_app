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
        
        // WIHY AboutPage specific colors
        'wihy-green': '#4cbb17',
        'wihy-blue-light': '#f8faff',
        'wihy-blue-soft': '#e8f4f8',
        'wihy-orange': '#fa5f06',
        
        // Green variants for consistent theming
        green: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#4cbb17', // Main WIHY green
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        
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
        'sf-pro': ['SF Pro Display', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #f8faff 0%, #e8f4f8 100%)',
        'section-gradient': 'linear-gradient(135deg, #f8faff 0%, #e8f4f8 100%)',
        'wihy-gradient': 'linear-gradient(135deg, #4cbb17, #34a853)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.6s ease-out forwards',
        'typing': 'typing 1.4s ease-in-out infinite',
        'spin': 'spin 1s linear infinite',
        'border-sweep': 'wiH-border-sweep 2.2s linear infinite',
      },
      transitionDelay: {
        '0': '0ms',
        '75': '75ms',
        '100': '100ms',
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '500': '500ms',
        '700': '700ms',
        '1000': '1000ms',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        typing: {
          '0%, 60%, 100%': {
            transform: 'translateY(0)',
            opacity: '0.4',
          },
          '30%': {
            transform: 'translateY(-6px)',
            opacity: '1',
          }
        },
        spin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'wiH-border-sweep': {
          '0%': { backgroundPosition: '0 0, 0% 0' },
          '100%': { backgroundPosition: '0 0, 200% 0' },
        },
        modalSlideIn: {
          '0%': { opacity: '0', transform: 'translate(-50%, -50%) scale(0.95)' },
          '100%': { opacity: '1', transform: 'translate(-50%, -50%) scale(1)' },
        }
      },
      spacing: {
        'vh-header': 'var(--vh-header-height, 80px)',
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
        '70': '17.5rem', // 280px for sidebar width
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
      boxShadow: {
        'vh-ring': '0 0 0 3px rgba(26,115,232,.18)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'wihy': '0 25px 50px rgba(0, 0, 0, 0.4)',
        'wihy-hover': '0 32px 64px rgba(0, 0, 0, 0.5)',
        'green': '0 10px 25px rgba(76, 187, 23, 0.45)',
      },
      borderRadius: {
        '4xl': '2rem',
      }
    },
  },
  plugins: [
    function({ addUtilities }) {
      addUtilities({
        '.scrollbar-thin': {
          'scrollbar-width': 'thin',
        },
        '.scrollbar-thumb-gray-300': {
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#d1d5db',
            borderRadius: '3px',
          },
        },
        '.scrollbar-track-transparent': {
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
          },
        },
        '.scrollbar-hide': {
          'scrollbar-width': 'none',
          '-ms-overflow-style': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
      });
    },
  ],
}