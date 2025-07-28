/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./routes/**/*.{ts,tsx}",
    "./islands/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./static/**/*.{html,js}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#A259FF',
          50: '#F4F0FF',
          100: '#E6D9FF',
          200: '#D1B8FF',
          300: '#BC97FF',
          400: '#A776FF',
          500: '#A259FF',
          600: '#8F47E6',
          700: '#7C35CC',
          800: '#6923B3',
          900: '#561199',
        },
        secondary: {
          DEFAULT: '#00C2FF',
          50: '#E6F9FF',
          100: '#CCF3FF',
          200: '#99E7FF',
          300: '#66DBFF',
          400: '#33CFFF',
          500: '#00C2FF',
          600: '#00A3D1',
          700: '#0084A3',
          800: '#006575',
          900: '#004647',
        },
        accent: {
          DEFAULT: '#FF6F5E',
          50: '#FFF0EE',
          100: '#FFE1DD',
          200: '#FFC3BB',
          300: '#FFA599',
          400: '#FF8777',
          500: '#FF6F5E',
          600: '#FF5A4A',
          700: '#E6413A',
          800: '#CC2B2A',
          900: '#B3151A',
        },
        dark: {
          DEFAULT: '#0D0D0D',
          lighter: '#2C2C2E',
        },
        light: {
          DEFAULT: '#E3DCD2',
          darker: '#D4CFC5',
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'bounce': 'bounce 1s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(162, 89, 255, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(162, 89, 255, 0.6)' },
        },
      },
    },
  },
  plugins: [],
};