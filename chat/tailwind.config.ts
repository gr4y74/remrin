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
        },
        // ═══════════════════════════════════════════════════════════
        // GACHA ANIMATION SYSTEM
        // ═══════════════════════════════════════════════════════════

        // Orb pulsing effect during summoning
        'gacha-orb-pulse': {
          '0%, 100%': {
            transform: 'scale(1)',
            boxShadow: '0 0 60px var(--gacha-glow), 0 0 120px var(--gacha-glow)'
          },
          '50%': {
            transform: 'scale(1.15)',
            boxShadow: '0 0 80px var(--gacha-glow), 0 0 160px var(--gacha-glow)'
          }
        },

        // Orb charging/intensifying before reveal
        'gacha-orb-charge': {
          '0%': { transform: 'scale(1)', filter: 'brightness(1)' },
          '70%': { transform: 'scale(1.3)', filter: 'brightness(1.5)' },
          '85%': { transform: 'scale(1.5)', filter: 'brightness(2)' },
          '100%': { transform: 'scale(2)', filter: 'brightness(3)', opacity: 0 }
        },

        // Particle burst explosion
        'gacha-particle-burst': {
          '0%': {
            transform: 'translate(-50%, -50%) scale(0)',
            opacity: 1
          },
          '50%': {
            opacity: 1
          },
          '100%': {
            transform: 'translate(calc(-50% + var(--tx, 0px)), calc(-50% + var(--ty, 0px))) scale(0)',
            opacity: 0
          }
        },

        // Sparkle burst for individual particles
        'sparkle-burst': {
          '0%': {
            transform: 'translate(-50%, -50%) scale(1)',
            opacity: 1
          },
          '100%': {
            transform: 'translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0)',
            opacity: 0
          }
        },

        // Screen shake - light (for Epic)
        'gacha-shake-light': {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' }
        },

        // Screen shake - heavy (for Legendary)
        'gacha-shake-heavy': {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '10%': { transform: 'translate(-8px, -4px)' },
          '20%': { transform: 'translate(8px, 4px)' },
          '30%': { transform: 'translate(-6px, 2px)' },
          '40%': { transform: 'translate(6px, -2px)' },
          '50%': { transform: 'translate(-4px, 4px)' },
          '60%': { transform: 'translate(4px, -4px)' },
          '70%': { transform: 'translate(-2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
          '90%': { transform: 'translate(-1px, 1px)' }
        },

        // 3D Card flip reveal
        'gacha-card-flip': {
          '0%': {
            transform: 'perspective(1000px) rotateY(180deg) scale(0.8)',
            opacity: 0
          },
          '40%': {
            transform: 'perspective(1000px) rotateY(90deg) scale(0.9)'
          },
          '100%': {
            transform: 'perspective(1000px) rotateY(0deg) scale(1)',
            opacity: 1
          }
        },

        // Card entrance with bounce
        'gacha-card-entrance': {
          '0%': {
            transform: 'translateY(100px) scale(0.5)',
            opacity: 0
          },
          '60%': {
            transform: 'translateY(-20px) scale(1.05)'
          },
          '80%': {
            transform: 'translateY(10px) scale(0.98)'
          },
          '100%': {
            transform: 'translateY(0) scale(1)',
            opacity: 1
          }
        },

        // Rainbow shimmer for legendary cards
        'gacha-shimmer': {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' }
        },

        // Animated border glow
        'gacha-border-glow': {
          '0%, 100%': {
            boxShadow: '0 0 20px var(--gacha-glow), inset 0 0 20px transparent'
          },
          '50%': {
            boxShadow: '0 0 40px var(--gacha-glow), inset 0 0 30px var(--gacha-glow-inner, transparent)'
          }
        },

        // Light rays emanating from center
        'gacha-light-rays': {
          '0%': {
            transform: 'rotate(0deg) scale(1)',
            opacity: 0.8
          },
          '100%': {
            transform: 'rotate(360deg) scale(1.5)',
            opacity: 0
          }
        },

        // Floating sparkle
        'gacha-float-sparkle': {
          '0%, 100%': {
            transform: 'translateY(0) rotate(0deg)',
            opacity: 0.8
          },
          '50%': {
            transform: 'translateY(-10px) rotate(180deg)',
            opacity: 1
          }
        },

        // Flash effect
        'gacha-flash': {
          '0%': { opacity: 0 },
          '10%': { opacity: 1 },
          '100%': { opacity: 0 }
        },

        // Gradient rotation for orb
        'gradient-rotate': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        },

        // Stars gathering towards center
        'gacha-stars-gather': {
          '0%': {
            transform: 'translate(var(--start-x, 0), var(--start-y, 0)) scale(1)',
            opacity: 0.5
          },
          '80%': {
            opacity: 1
          },
          '100%': {
            transform: 'translate(0, 0) scale(0)',
            opacity: 0
          }
        },

        // Pity counter fill
        'gacha-pity-fill': {
          '0%': { width: '0%' },
          '100%': { width: 'var(--pity-progress, 0%)' }
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
        'slide-out-right': 'slide-out-right 0.2s ease-out',
        // ═══════════════════════════════════════════════════════════
        // GACHA ANIMATIONS
        // ═══════════════════════════════════════════════════════════
        'gacha-orb-pulse': 'gacha-orb-pulse 1.5s ease-in-out infinite',
        'gacha-orb-charge': 'gacha-orb-charge 0.8s ease-out forwards',
        'gacha-particle-burst': 'gacha-particle-burst 1s ease-out forwards',
        'sparkle-burst': 'sparkle-burst 1.5s ease-out forwards',
        'gacha-shake-light': 'gacha-shake-light 0.5s ease-out',
        'gacha-shake-heavy': 'gacha-shake-heavy 0.8s ease-out',
        'gacha-card-flip': 'gacha-card-flip 0.8s ease-out forwards',
        'gacha-card-entrance': 'gacha-card-entrance 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'gacha-shimmer': 'gacha-shimmer 2s linear infinite',
        'gacha-border-glow': 'gacha-border-glow 2s ease-in-out infinite',
        'gacha-light-rays': 'gacha-light-rays 3s linear infinite',
        'gacha-float-sparkle': 'gacha-float-sparkle 2s ease-in-out infinite',
        'gacha-flash': 'gacha-flash 0.5s ease-out forwards',
        'gradient-rotate': 'gradient-rotate 8s linear infinite',
        'gacha-stars-gather': 'gacha-stars-gather 1.5s ease-in forwards',
        'gacha-pity-fill': 'gacha-pity-fill 1s ease-out forwards'
      }
    }
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/typography')]
}
