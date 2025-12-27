# Remrin.ai Visual Style Guide

**Version:** 1.0  
**Last Updated:** December 27, 2025  
**Status:** Living Document

---

## Table of Contents
1. [Color Palette](#color-palette)
2. [Typography](#typography)
3. [Spacing System](#spacing-system)
4. [Component Patterns](#component-patterns)
5. [Animation Guidelines](#animation-guidelines)
6. [Accessibility Standards](#accessibility-standards)

---

## Color Palette

### Rosé Pine Theme

#### Dark Mode (Primary)
```css
Base Colors:
--rp-base: #191724       /* Main background */
--rp-surface: #1f1d2e    /* Cards, elevated surfaces */
--rp-overlay: #26233a    /* Modals, popovers */

Text Colors:
--rp-text: #e0def4       /* Primary text */
--rp-subtle: #908caa     /* Secondary text */
--rp-muted: #6e6a86      /* Tertiary text, disabled */

Accent Colors:
--rp-love: #eb6f92       /* Error, destructive actions */
--rp-gold: #f6c177       /* Premium, currency */
--rp-rose: #ebbcba       /* Primary accent, interactive */
--rp-pine: #31748f       /* Success, nature */
--rp-foam: #9ccfd8       /* Info, water */
--rp-iris: #c4a7e7       /* Magic, mystery */

Highlight Colors:
--rp-highlight-low: #21202e
--rp-highlight-med: #403d52
--rp-highlight-high: #524f67
```

#### Light Mode (Dawn)
```css
Base Colors:
--rp-base: #faf3eb       /* Main background */
--rp-surface: #f0d7d7    /* Cards, elevated surfaces */
--rp-overlay: #f0d7d7    /* Modals, popovers */

Text Colors:
--rp-text: #201d2f       /* Primary text */
--rp-subtle: #6e6a86     /* Secondary text */
--rp-muted: #908caa      /* Tertiary text */

Accent Colors:
--rp-love: #b4637a       /* Error, destructive */
--rp-gold: #ea9d34       /* Premium, currency */
--rp-rose: #c5818e       /* Primary accent */
--rp-pine: #286983       /* Success */
--rp-foam: #56949f       /* Info */
--rp-iris: #907aa9       /* Magic */

Highlight Colors:
--rp-highlight-low: #f0d7d7
--rp-highlight-med: #c5818e
--rp-highlight-high: #a86f7c
```

---

### Extended Palette (Custom)
```css
/* Additional colors for specific use cases */
--rp-crimson: #ea2e20    /* Urgent, hot */
--rp-magenta: #de5ba7    /* Vibrant accent */
--rp-lavender: #907aa8   /* Soft purple */
--rp-dusty-rose: #be8e95 /* Muted pink */
```

---

### Color Usage Guidelines

#### Backgrounds
```typescript
// Page background
className="bg-rp-base"

// Card background
className="bg-rp-surface"

// Modal/Popover background
className="bg-rp-overlay"

// Elevated card (with glass effect)
className="bg-rp-surface/80 backdrop-blur-xl"
```

#### Text
```typescript
// Primary text (headings, body)
className="text-rp-text"

// Secondary text (descriptions, labels)
className="text-rp-subtle"

// Tertiary text (captions, disabled)
className="text-rp-muted"
```

#### Accents
```typescript
// Primary interactive (buttons, links)
className="text-rp-rose hover:text-rp-rose/80"

// Success states
className="text-rp-pine"

// Error states
className="text-rp-love"

// Premium/Currency
className="text-rp-gold"

// Magical/Special
className="text-rp-iris"

// Info/Neutral
className="text-rp-foam"
```

#### Borders
```typescript
// Subtle border
className="border border-rp-highlight-low"

// Medium border
className="border border-rp-highlight-med"

// Strong border
className="border border-rp-highlight-high"

// Accent border
className="border border-rp-rose/50"
```

---

## Typography

### Font Families

```css
/* Serif - Tiempos (Headings, Display) */
font-family: 'Tiempos Headline', Georgia, serif;
font-family: 'Tiempos Text', Georgia, serif;
font-family: 'Tiempos Fine', Georgia, serif;

/* Sans-serif - Inter (UI, Body) */
font-family: 'Inter', system-ui, sans-serif;
```

### Type Scale

#### Headings (Tiempos Headline)
```typescript
// H1 - Page Titles
className="font-tiempos-headline text-4xl md:text-5xl lg:text-6xl font-bold"
// Example: "Soul Summons", "Discover Souls"

// H2 - Section Headers
className="font-tiempos-headline text-2xl md:text-3xl lg:text-4xl font-semibold"
// Example: "Featured Souls", "Trending Now"

// H3 - Subsection Headers
className="font-tiempos-headline text-xl md:text-2xl font-semibold"
// Example: "Recent Activity", "Your Collection"

// H4 - Card Titles
className="font-tiempos-headline text-lg md:text-xl font-medium"
// Example: Character names, listing titles
```

#### Body Text (Tiempos Text / Inter)
```typescript
// Large body
className="font-tiempos-text text-lg"
// Example: Introductory paragraphs

// Normal body
className="font-tiempos-text text-base"
// Example: Standard paragraphs, descriptions

// Small body
className="font-tiempos-text text-sm"
// Example: Helper text, labels

// Tiny text (Tiempos Fine)
className="font-tiempos-fine text-xs"
// Example: Captions, timestamps, metadata
```

### Font Weights
```typescript
font-bold      // 700 - Headings
font-semibold  // 600 - Subheadings
font-medium    // 500 - Emphasis
font-normal    // 400 - Body text
```

### Line Heights
```typescript
leading-tight    // 1.25 - Headings
leading-normal   // 1.5 - Body text
leading-relaxed  // 1.625 - Long-form content
```

---

## Spacing System

### Padding Scale
```typescript
// Cards
p-3   // Small cards (< 200px)
p-4   // Medium cards (200-300px)
p-6   // Large cards (> 300px)

// Sections
px-4 py-8   // Mobile sections
px-6 py-12  // Tablet sections
px-8 py-16  // Desktop sections
```

### Margin Scale
```typescript
// Tight spacing (within components)
mt-2, mb-2, gap-2

// Normal spacing (between related elements)
mt-4, mb-4, gap-4

// Loose spacing (between sections)
mt-6, mb-6, gap-6

// Extra loose (between major sections)
mt-8, mb-8, gap-8
mt-12, mb-12, gap-12
```

### Gap Scale (Flexbox/Grid)
```typescript
gap-2   // Tight (badges, icons)
gap-3   // Normal (form fields)
gap-4   // Loose (card grids)
gap-6   // Extra loose (sections)
```

---

## Component Patterns

### Cards

#### Standard Card
```typescript
<div className="
  bg-rp-surface 
  border border-rp-highlight-med 
  rounded-2xl 
  p-4 
  shadow-lg 
  hover:shadow-2xl 
  hover:scale-[1.02] 
  transition-all duration-300
">
  {/* Content */}
</div>
```

#### Glass Card
```typescript
<div className="
  bg-rp-surface/80 
  backdrop-blur-xl 
  border border-white/10 
  dark:border-white/5 
  rounded-2xl 
  p-6 
  shadow-2xl
">
  {/* Content */}
</div>
```

#### Character Card (Portrait)
```typescript
<div className="
  bg-rp-surface 
  border-2 border-rp-muted/20 
  rounded-2xl 
  overflow-hidden 
  group 
  relative
  hover:shadow-[0_20px_40px_rgba(0,0,0,0.4),0_0_40px_rgba(196,167,231,0.6)]
  transition-all duration-300
">
  <div className="relative aspect-[3/4] w-full">
    {/* Image */}
    <div className="absolute inset-0 bg-gradient-to-t from-rp-base/90 via-rp-base/20 to-transparent" />
    {/* Content overlay */}
  </div>
</div>
```

---

### Buttons

#### Primary Button
```typescript
<button className="
  bg-gradient-to-r from-rp-iris to-rp-rose 
  hover:from-rp-iris/90 hover:to-rp-rose/90
  text-white 
  font-semibold 
  px-6 py-3 
  rounded-full 
  shadow-lg 
  hover:shadow-xl 
  hover:scale-105 
  transition-all duration-200
">
  Action
</button>
```

#### Secondary Button
```typescript
<button className="
  bg-rp-surface 
  hover:bg-rp-overlay 
  text-rp-text 
  border border-rp-highlight-med 
  font-medium 
  px-4 py-2 
  rounded-lg 
  hover:scale-105 
  transition-all duration-200
">
  Action
</button>
```

#### Ghost Button
```typescript
<button className="
  bg-transparent 
  hover:bg-rp-surface/50 
  text-rp-subtle 
  hover:text-rp-text 
  font-medium 
  px-4 py-2 
  rounded-lg 
  hover:scale-105 
  transition-all duration-200
">
  Action
</button>
```

---

### Inputs

#### Text Input
```typescript
<input className="
  bg-rp-surface 
  border border-rp-highlight-med 
  text-rp-text 
  placeholder:text-rp-muted 
  px-4 py-2 
  rounded-lg 
  w-full
  focus:outline-none 
  focus:ring-2 
  focus:ring-rp-rose/50 
  focus:border-rp-rose
  transition-all duration-200
" />
```

#### Textarea
```typescript
<textarea className="
  bg-rp-surface 
  border border-rp-highlight-med 
  text-rp-text 
  placeholder:text-rp-muted 
  px-4 py-3 
  rounded-lg 
  w-full 
  min-h-[120px]
  focus:outline-none 
  focus:ring-2 
  focus:ring-rp-rose/50 
  focus:border-rp-rose
  transition-all duration-200
  resize-vertical
" />
```

---

### Badges

#### Default Badge
```typescript
<span className="
  bg-rp-surface 
  text-rp-text 
  px-3 py-1 
  rounded-full 
  text-xs 
  font-medium
  border border-rp-highlight-med
">
  Badge
</span>
```

#### Accent Badge
```typescript
<span className="
  bg-rp-rose/20 
  text-rp-rose 
  px-3 py-1 
  rounded-full 
  text-xs 
  font-semibold
  border border-rp-rose/30
">
  Featured
</span>
```

#### Rarity Badges
```typescript
// Common
className="bg-rp-muted/20 text-rp-subtle border-rp-muted/30"

// Rare
className="bg-rp-pine/20 text-rp-pine border-rp-pine/30"

// Epic
className="bg-rp-iris/20 text-rp-iris border-rp-iris/30"

// Legendary
className="bg-rp-gold/20 text-rp-gold border-rp-gold/30"
```

---

### Modals

```typescript
<div className="
  fixed inset-0 
  bg-black/60 
  backdrop-blur-sm 
  z-50 
  flex items-center justify-center
">
  <div className="
    bg-rp-overlay 
    border border-rp-highlight-med 
    rounded-2xl 
    p-6 
    max-w-lg 
    w-full 
    mx-4
    shadow-2xl
    animate-fadeIn
  ">
    {/* Modal content */}
  </div>
</div>
```

---

## Animation Guidelines

### Timing Functions
```css
ease-out     /* Default - natural deceleration */
ease-in-out  /* Smooth both ways */
ease-in      /* Rare - use for exits */
```

### Duration Scale
```typescript
duration-100  // 100ms - Instant feedback (hover)
duration-200  // 200ms - Fast interactions (buttons)
duration-300  // 300ms - Standard (cards, modals)
duration-500  // 500ms - Slow (page transitions)
duration-700  // 700ms - Very slow (scroll reveals)
```

### Common Animations

#### Hover Scale
```typescript
className="hover:scale-105 transition-transform duration-200"
```

#### Fade In
```typescript
className="opacity-0 animate-fadeIn"

// In tailwind.config.ts
keyframes: {
  fadeIn: {
    from: { opacity: 0, transform: 'translateY(4px)' },
    to: { opacity: 1, transform: 'translateY(0)' }
  }
}
```

#### Card Entrance (Stagger)
```typescript
// In component
style={{
  animationDelay: `${index * 50}ms`,
  animationFillMode: 'both'
}}
className="animate-card-enter"

// In CSS
@keyframes card-enter {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
```

#### 3D Tilt (Mouse Move)
```typescript
// On mouse move
const { rotateX, rotateY } = calculateTilt(e, 8)
setTiltStyle({
  transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`
})

// On mouse leave
setTiltStyle({
  transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)'
})
```

---

## Accessibility Standards

### Color Contrast
```
WCAG AA Requirements:
- Normal text (< 18px): 4.5:1 minimum
- Large text (≥ 18px): 3:1 minimum
- UI components: 3:1 minimum

WCAG AAA Requirements:
- Normal text: 7:1 minimum
- Large text: 4.5:1 minimum
```

### Focus Indicators
```typescript
// All interactive elements must have visible focus
className="
  focus-visible:outline-none 
  focus-visible:ring-2 
  focus-visible:ring-rp-rose 
  focus-visible:ring-offset-2 
  focus-visible:ring-offset-rp-base
"
```

### Touch Targets
```typescript
// Minimum 44x44px for touch
className="min-h-[44px] min-w-[44px]"
```

### ARIA Labels
```typescript
// Buttons with only icons
<button aria-label="Close modal">
  <IconX />
</button>

// Links with vague text
<a href="/learn-more" aria-label="Learn more about Soul Summons">
  Learn More
</a>

// Images
<img src="..." alt="Descriptive text" />
```

### Semantic HTML
```typescript
// Use proper heading hierarchy
<h1> → <h2> → <h3> (never skip levels)

// Use semantic elements
<header>, <nav>, <main>, <section>, <article>, <aside>, <footer>

// Use buttons for actions, links for navigation
<button onClick={...}>Submit</button>
<a href="/page">Go to page</a>
```

---

## Responsive Breakpoints

```typescript
// Tailwind breakpoints
sm: 640px   // Small tablets
md: 768px   // Tablets
lg: 1024px  // Small laptops
xl: 1280px  // Laptops
2xl: 1400px // Desktops
```

### Mobile-First Approach
```typescript
// Base styles = mobile
className="text-sm"

// Add tablet styles
className="text-sm md:text-base"

// Add desktop styles
className="text-sm md:text-base lg:text-lg"
```

---

## Best Practices

### DO ✅
- Use Rosé Pine theme variables exclusively
- Apply consistent spacing from the scale
- Use Tiempos for headings, Inter for UI
- Add hover states to all interactive elements
- Include focus indicators for accessibility
- Test in both light and dark modes
- Use semantic HTML
- Optimize images (WebP, lazy loading)
- Add loading states to async actions
- Use transitions for smooth interactions

### DON'T ❌
- Hardcode color values (#hex or rgb())
- Use arbitrary spacing values
- Mix font families within components
- Forget hover/focus states
- Skip accessibility features
- Use only dark mode testing
- Use divs for buttons/links
- Load large images without optimization
- Show blank screens while loading
- Use instant state changes (add transitions)

---

## Quick Reference

### Common Class Combinations

**Card:**
```typescript
"bg-rp-surface border border-rp-highlight-med rounded-2xl p-4 shadow-lg hover:shadow-2xl transition-all duration-300"
```

**Button:**
```typescript
"bg-rp-rose hover:bg-rp-rose/90 text-white font-semibold px-6 py-3 rounded-full hover:scale-105 transition-all duration-200"
```

**Input:**
```typescript
"bg-rp-surface border border-rp-highlight-med text-rp-text px-4 py-2 rounded-lg focus:ring-2 focus:ring-rp-rose/50 transition-all duration-200"
```

**Link:**
```typescript
"text-rp-subtle hover:text-rp-rose hover:scale-105 transition-all duration-200"
```

**Section:**
```typescript
"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12"
```

---

## Version History

- **v1.0** (Dec 27, 2025) - Initial style guide
  - Rosé Pine theme documentation
  - Typography system
  - Component patterns
  - Animation guidelines
  - Accessibility standards

---

**Maintained by:** Design Team  
**Questions?** See DESIGN_AUDIT_REPORT.md for detailed analysis
