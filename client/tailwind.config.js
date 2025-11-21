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
        }
      },
      spacing: {
        'vh-header': 'var(--vh-header-height, 80px)',
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
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
  plugins: [],
}