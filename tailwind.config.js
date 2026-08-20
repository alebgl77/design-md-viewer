/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // Theming is driven entirely by the CSS custom properties in src/index.css,
  // which flip on [data-theme]. The `dark:` variant is therefore INTENTIONALLY
  // UNUSED — a single utility such as `bg-surface-base` is already correct in
  // both themes. This stays on 'class' rather than 'media' so the variant can
  // never fire off the OS preference and silently fork a second, unmaintained
  // colour path.
  darkMode: 'class',
  theme: {
    // Not under `extend`: this is a shape lock. Replacing the scale outright
    // removes Tailwind's `rounded` / `rounded-2xl` / `rounded-3xl` defaults so
    // there are exactly five legal corner radii in the product.
    borderRadius: {
      sm: '6px',    // chips, badges, inputs, small controls
      md: '10px',   // buttons, list items, sidebar entries
      lg: '14px',   // cards, panels, table containers
      xl: '20px',   // modals, the drop zone
      full: '9999px', // ONLY numeric count pills and status dots
    },
    extend: {
      // Every colour resolves through a CSS variable holding space-separated
      // RGB channels, so `<alpha-value>` substitution keeps opacity utilities
      // (`bg-accent/15`, `border-line/60`) working.
      colors: {
        surface: {
          base: 'rgb(var(--surface-base) / <alpha-value>)',
          raised: 'rgb(var(--surface-raised) / <alpha-value>)',
          overlay: 'rgb(var(--surface-overlay) / <alpha-value>)',
          inset: 'rgb(var(--surface-inset) / <alpha-value>)',
        },
        line: {
          DEFAULT: 'rgb(var(--line-default) / <alpha-value>)',
          subtle: 'rgb(var(--line-subtle) / <alpha-value>)',
          strong: 'rgb(var(--line-strong) / <alpha-value>)',
        },
        content: {
          primary: 'rgb(var(--content-primary) / <alpha-value>)',
          secondary: 'rgb(var(--content-secondary) / <alpha-value>)',
          muted: 'rgb(var(--content-muted) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          hover: 'rgb(var(--accent-hover) / <alpha-value>)',
          contrast: 'rgb(var(--accent-contrast) / <alpha-value>)',
        },
        status: {
          danger: 'rgb(var(--status-danger) / <alpha-value>)',
          warning: 'rgb(var(--status-warning) / <alpha-value>)',
          success: 'rgb(var(--status-success) / <alpha-value>)',
        },
      },
      fontFamily: {
        heading: ['"Bricolage Grotesque"', 'sans-serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Fira Code', 'Consolas', 'monospace'],
      },
      // Shadows are tinted, never pure black: --shadow-color and --shadow-alpha
      // flip with the theme so the same utility reads as depth on the dark
      // ground and as a soft lift (not dirt) on the light one.
      boxShadow: {
        'chromatic': '0 0 0 1px rgb(var(--accent) / 0.25), 0 10px 30px -22px rgb(var(--shadow-color) / var(--shadow-alpha))',
        'chromatic-glow': '0 0 0 4px rgb(var(--accent) / 0.15), 0 10px 30px -20px rgb(var(--shadow-color) / var(--shadow-alpha))',
        'deep': '0 10px 30px -22px rgb(var(--shadow-color) / var(--shadow-alpha))',
      }
    },
  },
  plugins: [],
}
