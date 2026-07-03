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
        // Raw brand tokens — refreshed to the Fidelity green + gold palette.
        brand: {
          DEFAULT: '#0b7a4e',
          dark: '#0a5c3b',
          soft: '#e7f3ec',
        },
        // Gold "spark" accent (retargets the former blue secondary/accent).
        gold: {
          DEFAULT: '#b58a34',
          dark: '#8c6a20',
          soft: '#f7efda',
        },
        'accent-blue': {
          // legacy alias kept pointing at gold so any stragglers stay on-brand
          DEFAULT: '#b58a34',
          soft: '#f7efda',
        },
        warn: {
          DEFAULT: '#c2760b',
          soft: '#fbeeda',
        },
        danger: {
          DEFAULT: '#b4231e',
          soft: '#fbebe9',
        },
        ink: {
          DEFAULT: '#16241c',
          soft: '#51605a',
        },
        line: '#e5e8e1',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 4px)',
        sm: 'calc(var(--radius) - 8px)',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,36,28,.05), 0 10px 30px rgba(16,36,28,.06)',
        soft: '0 1px 2px rgba(16,36,28,.04), 0 4px 12px rgba(16,36,28,.05)',
      },
      fontFamily: {
        sans: [
          'Inter',
          '"Segoe UI"',
          '-apple-system',
          'BlinkMacSystemFont',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        serif: ['Fraunces', 'Georgia', '"Times New Roman"', 'serif'],
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
