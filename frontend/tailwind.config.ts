import type { Config } from 'tailwindcss'
import tailwindcssAnimate from 'tailwindcss-animate'

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Raw brand tokens (from the existing Fidelity-style demo decks) for
        // direct use in the 4-state status system + evidence panel accents.
        brand: {
          DEFAULT: '#1a7a4c',
          dark: '#0f5a37',
          soft: '#e8f5ee',
        },
        'accent-blue': {
          DEFAULT: '#1a5d8c',
          soft: '#e7f1f8',
        },
        warn: {
          DEFAULT: '#8a5a12',
          soft: '#fbf2df',
        },
        danger: {
          DEFAULT: '#8b1a2a',
          soft: '#f8e8ea',
        },
        ink: {
          DEFAULT: '#15233b',
          soft: '#45546b',
        },
        line: '#e4e9f1',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 4px)',
        sm: 'calc(var(--radius) - 8px)',
      },
      boxShadow: {
        card: '0 1px 2px rgba(21,35,59,.06), 0 10px 30px rgba(21,35,59,.06)',
        soft: '0 1px 2px rgba(21,35,59,.05), 0 4px 12px rgba(21,35,59,.05)',
      },
      fontFamily: {
        sans: [
          '"Segoe UI"',
          'Roboto',
          '-apple-system',
          'BlinkMacSystemFont',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.28s ease-out',
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config
