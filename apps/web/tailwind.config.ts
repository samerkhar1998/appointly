import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',  // primary
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        background: '#F9FAFB',
        foreground: '#111827',
        muted: {
          DEFAULT: '#6B7280',
          foreground: '#9CA3AF',
        },
        border: '#E5E7EB',
        surface: {
          base: '#FFFFFF',
          elevated: '#F9FAFB',
          floating: '#F3F4F6',
        },
      },
      fontFamily: {
        sans: ['Heebo', 'system-ui', 'sans-serif'],
        display: ['Heebo', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        tighter: '-0.03em',
      },
      lineHeight: {
        relaxed: '1.7',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(124,58,237,0.06)',
        elevated: '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(124,58,237,0.08)',
        floating: '0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(124,58,237,0.10)',
      },
    },
  },
  plugins: [animate],
};

export default config;
