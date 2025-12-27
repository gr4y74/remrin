/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}'
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      'tiempos-headline': ['Tiempos Headline', 'Georgia', 'serif'],
      'tiempos-text': ['Tiempos Text', 'Georgia', 'serif'],
      'tiempos-fine': ['Tiempos Fine', 'Georgia', 'serif'],
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        // Rosé Pine Color Palette
        'rp-base': 'hsl(var(--rp-base))',
        'rp-surface': 'hsl(var(--rp-surface))',
        'rp-overlay': 'hsl(var(--rp-overlay))',
        'rp-muted': 'hsl(var(--rp-muted))',
        'rp-subtle': 'hsl(var(--rp-subtle))',
        'rp-text': 'hsl(var(--rp-text))',
        'rp-love': 'hsl(var(--rp-love))',
        'rp-gold': 'hsl(var(--rp-gold))',
        'rp-rose': 'hsl(var(--rp-rose))',
        'rp-pine': 'hsl(var(--rp-pine))',
        'rp-foam': 'hsl(var(--rp-foam))',
        'rp-iris': 'hsl(var(--rp-iris))',
        'rp-highlight-low': 'hsl(var(--rp-highlight-low))',
        'rp-highlight-med': 'hsl(var(--rp-highlight-med))',
        'rp-highlight-high': 'hsl(var(--rp-highlight-high))',
        // Keep ram-pink alias for existing components
        'ram-pink': 'hsl(var(--rp-rose))'
      },
      spacing: {
        'safe-area-inset-bottom': 'env(safe-area-inset-bottom)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 }
        },
        // Talkie-style animations
        fadeIn: {
          from: { opacity: 0, transform: 'translateY(4px)' },
          to: { opacity: 1, transform: 'translateY(0)' }
        },
        'pulse-dot': {
          '0%, 80%, 100%': { opacity: 0.3, transform: 'scale(0.8)' },
          '40%': { opacity: 1, transform: 'scale(1)' }
        },
        // Panel transition animations
        'slide-in-left': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' }
        },
        'slide-out-left': {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-100%)' }
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' }
        },
        'slide-out-right': {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(100%)' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        // Talkie-style animations
        fadeIn: 'fadeIn 0.3s ease-out forwards',
        'pulse-dot': 'pulse-dot 1.4s infinite ease-in-out',
        // Panel animations
        'slide-in-left': 'slide-in-left 0.2s ease-out',
        'slide-out-left': 'slide-out-left 0.2s ease-out',
        'slide-in-right': 'slide-in-right 0.2s ease-out',
        'slide-out-right': 'slide-out-right 0.2s ease-out'
      }
    }
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/typography')]
}
