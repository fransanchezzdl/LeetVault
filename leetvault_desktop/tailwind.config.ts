import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/renderer/index.html', './src/renderer/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          0: 'rgb(var(--color-bg-0) / <alpha-value>)',
          50: 'rgb(var(--color-bg-50) / <alpha-value>)',
          100: 'rgb(var(--color-bg-100) / <alpha-value>)',
          200: 'rgb(var(--color-bg-200) / <alpha-value>)',
          300: 'rgb(var(--color-bg-300) / <alpha-value>)',
          400: 'rgb(var(--color-bg-400) / <alpha-value>)',
        },
        fg: 'rgb(var(--color-fg) / <alpha-value>)',
        fgSoft: 'rgb(var(--color-fg-soft) / <alpha-value>)',
        fgMuted: 'rgb(var(--color-fg) / <alpha-value>)',
        brand: {
          50: 'rgb(var(--color-brand-50) / <alpha-value>)',
          100: 'rgb(var(--color-brand-100) / <alpha-value>)',
          200: 'rgb(var(--color-brand-200) / <alpha-value>)',
          300: 'rgb(var(--color-brand-300) / <alpha-value>)',
          400: 'rgb(var(--color-brand-400) / <alpha-value>)',
          500: 'rgb(var(--color-brand-500) / <alpha-value>)',
          600: 'rgb(var(--color-brand-600) / <alpha-value>)',
          700: 'rgb(var(--color-brand-700) / <alpha-value>)',
          800: 'rgb(var(--color-brand-800) / <alpha-value>)',
          900: 'rgb(var(--color-brand-900) / <alpha-value>)',
        },
        diff: {
          easy: 'rgb(var(--color-diff-easy) / <alpha-value>)',
          medium: 'rgb(var(--color-diff-medium) / <alpha-value>)',
          hard: 'rgb(var(--color-diff-hard) / <alpha-value>)',
        },
        status: {
          solved: 'rgb(var(--color-status-solved) / <alpha-value>)',
          inprogress: 'rgb(var(--color-status-inprogress) / <alpha-value>)',
          toreview: 'rgb(var(--color-status-toreview) / <alpha-value>)',
        },
        glass: {
          stroke: 'rgb(var(--color-glass-stroke) / <alpha-value>)',
          fill: 'rgb(var(--color-glass-fill) / <alpha-value>)',
        },
      },
      fontFamily: {
        poppins: ['Poppins', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        glass: '18px',
      },
      boxShadow: {
        glass: '0 4px 18px rgba(0,0,0,0.12)',
      },
      backgroundImage: {
        'app-grad': 'var(--gradient-app)',
        'sidebar-grad': 'var(--gradient-sidebar)',
        'sidebar-sheen': 'var(--gradient-sidebar-sheen)',
        'primary-grad': 'var(--gradient-primary)',
        'nav-active-grad': 'var(--gradient-nav-active)',
      },
    },
  },
  plugins: [],
};

export default config;
