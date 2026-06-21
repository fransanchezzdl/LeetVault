import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/renderer/index.html', './src/renderer/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          0: '#211711',
          50: '#2A1B12',
          100: '#382414',
          200: '#1E1510',
          300: '#1A120D',
          400: '#22150F',
        },
        fg: '#F7EEE4',
        fgSoft: '#F8F1E8',
        fgMuted: 'rgba(247,238,228,0.68)',
        brand: {
          50: '#FFF4E4',
          100: '#FFE2AB',
          200: '#FFD79B',
          300: '#FFCF7A',
          400: '#FFB133',
          500: '#FFA116',
          600: '#E6A817',
          700: '#D97B10',
          800: '#B85C00',
          900: '#2E1B0C',
        },
        diff: {
          easy: '#00A896',
          medium: '#E6A817',
          hard: '#D94F3D',
        },
        status: {
          solved: '#2E8B6A',
          inprogress: '#FFA116',
          toreview: '#8B5CF6',
        },
        glass: {
          stroke: 'rgba(255,232,194,0.10)',
          fill: 'rgba(255,255,255,0.08)',
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
        'app-grad': 'linear-gradient(135deg,#211711 0%,#2A1B12 48%,#382414 100%)',
        'sidebar-grad':
          'linear-gradient(165deg,rgba(255,225,167,0.14) 0%,rgba(255,177,51,0.06) 35%,rgba(255,255,255,0.04) 100%)',
        'sidebar-sheen':
          'linear-gradient(180deg,rgba(255,255,255,0.10) 0%,rgba(255,255,255,0.02) 30%,rgba(255,255,255,0) 100%)',
        'primary-grad':
          'linear-gradient(135deg,rgba(255,239,208,0.88),rgba(255,191,94,0.78))',
        'nav-active-grad':
          'linear-gradient(135deg,rgba(255,225,167,0.30),rgba(255,255,255,0.12))',
      },
    },
  },
  plugins: [],
};

export default config;
