/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: '#0b0f0c',
        primary: {
          DEFAULT: '#10b981',
          hover: '#0c6e4e',
          accent: '#10a34a',
          light: '#34d399',
          mint: '#6ee7b7',
          soft: '#cbe9d8',
          pale: '#d1fae5',
        },
        secondary: {
          DEFAULT: '#1d4ed8',
          hover: '#1e40af',
          deep: '#0b3550',
        },
        dark: {
          950: '#0b0f0c',
          900: '#0e1611',
          850: '#111a14',
          800: '#15221a',
          750: '#1a2a20',
          700: '#22362b',
        },
        border: {
          DEFAULT: '#1b2b21',
          subtle: '#121d16',
          strong: '#284132',
        },
        text: {
          primary: '#cbd5e1',
          secondary: '#94a3b8',
          muted: '#64748b',
        }
      },
      fontFamily: {
        heading: ['"Bricolage Grotesque"', 'sans-serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Fira Code', 'Consolas', 'monospace'],
      },
      borderRadius: {
        'card': '24px',
        'card-sm': '16px',
        'card-md': '22px',
        'card-lg': '50px',
      },
      boxShadow: {
        'chromatic': '0 0 0 1px rgba(52, 211, 153, 0.25), 0 10px 30px -22px rgba(0, 0, 0, 0.8)',
        'chromatic-glow': '0 0 0 4px rgba(52, 211, 153, 0.15), 0 10px 30px -20px rgba(0, 0, 0, 0.9)',
        'deep': '0 10px 30px -22px #000000',
      }
    },
  },
  plugins: [],
}
