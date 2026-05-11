import type { Config } from 'tailwindcss';

/**
 * Genspark-aligned design tokens.
 *
 * Rules:
 *  - No saturated brand colors. Neutral grayscale only.
 *  - Borders are 1px hairline (`border-line`) at very low contrast.
 *  - Surfaces are layered with translucency + backdrop-blur.
 *  - Motion uses `ease-spring` curve, durations 150–400ms.
 */
const config: Config = {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Helvetica Neue',
          'sans-serif',
        ],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        // Semantic tokens — values driven by CSS variables in globals.css
        bg: 'hsl(var(--bg) / <alpha-value>)',
        surface: 'hsl(var(--surface) / <alpha-value>)',
        'surface-2': 'hsl(var(--surface-2) / <alpha-value>)',
        fg: 'hsl(var(--fg) / <alpha-value>)',
        muted: 'hsl(var(--muted) / <alpha-value>)',
        'muted-fg': 'hsl(var(--muted-fg) / <alpha-value>)',
        line: 'hsl(var(--line) / <alpha-value>)',
        accent: 'hsl(var(--accent) / <alpha-value>)',
        danger: 'hsl(var(--danger) / <alpha-value>)',
      },
      borderColor: {
        DEFAULT: 'hsl(var(--line))',
      },
      borderRadius: {
        xl: '14px',
        '2xl': '20px',
        '3xl': '28px',
      },
      boxShadow: {
        glass:
          '0 1px 0 0 hsl(var(--line) / 0.6) inset, 0 8px 24px -12px rgb(0 0 0 / 0.18)',
        soft: '0 1px 2px 0 rgb(0 0 0 / 0.04), 0 4px 16px -8px rgb(0 0 0 / 0.08)',
        glow: '0 0 0 1px hsl(var(--line)), 0 0 24px -4px hsl(var(--fg) / 0.18)',
      },
      backdropBlur: {
        xs: '4px',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        breathe: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(0.96)' },
          '50%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        'caret-blink': {
          '0%,70%,100%': { opacity: '1' },
          '20%,50%': { opacity: '0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 240ms cubic-bezier(0.22,1,0.36,1) both',
        breathe: 'breathe 1.6s ease-in-out infinite',
        shimmer: 'shimmer 2.4s linear infinite',
        'caret-blink': 'caret-blink 1.1s steps(1) infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
