---
name: Design System
description: Enforce Remrin's design system including Rose Pine colors, glassmorphism, card specifications, and visual standards
---

# Remrin Design System Skill

Use this skill when creating or modifying UI components to ensure consistency with Remrin's established design aesthetic.

## Color Palette - Rose Pine Theme

All components must use the Rose Pine color scheme:

### Primary Colors
- `rp-base`: #191724 (Background)
- `rp-surface`: #1f1d2e (Surface/cards)
- `rp-overlay`: #26233a (Overlays)
- `rp-muted`: #6e6a86 (Muted text)
- `rp-subtle`: #908caa (Subtle elements)
- `rp-text`: #e0def4 (Primary text)
- `rp-love`: #eb6f92 (Accent - pink/red)
- `rp-gold`: #f6c177 (Accent - gold)
- `rp-rose`: #ebbcba (Accent - rose)
- `rp-pine`: #31748f (Accent - blue)
- `rp-foam`: #9ccfd8 (Accent - cyan)
- `rp-iris`: #c4a7e7 (Accent - purple)
- `rp-highlight-low`: #21202e
- `rp-highlight-med`: #403d52
- `rp-highlight-high`: #524f67

### Gradient Backgrounds (Geode Series)
- **Amethyst**: `linear-gradient(135deg, #191724 0%, #26233a 50%, #31748f 100%)`
- **Citrine**: `linear-gradient(135deg, #191724 0%, #26233a 50%, #f6c177 100%)`
- **Amazonite**: `linear-gradient(135deg, #191724 0%, #26233a 50%, #9ccfd8 100%)`
- **Rose Quartz**: `linear-gradient(135deg, #191724 0%, #26233a 50%, #ebbcba 100%)`

## Card Standards

### Character Cards (FlipCard)
- **Fixed Dimensions**: 258px × 398px
- **Border Radius**: 16px
- **Border**: 1px solid rgba(255, 255, 255, 0.15)
- **Shadow**: `0 10px 40px rgba(0, 0, 0, 0.6)`
- **Flip Animation**: 0.8s cubic-bezier(0.4, 0, 0.2, 1)

### Card Back Design (Blurred Background)
```tsx
{/* Blurred Background */}
<div className="absolute inset-0 z-0">
    <div className="absolute inset-0">
        <Image src={imageUrl} alt="" fill className="object-cover" />
    </div>
    <div className="absolute inset-0 backdrop-blur-2xl bg-black/40" />
</div>

{/* Glassmorphism Content */}
<div className="relative z-10 flex h-full flex-col p-5 bg-black/20 backdrop-blur-sm">
    {/* Content */}
</div>
```

## Glassmorphism Standards

When creating glassmorphism effects:
- **Background**: `bg-black/20` or `bg-white/10`
- **Backdrop Blur**: `backdrop-blur-sm` (8px) to `backdrop-blur-2xl` (24px)
- **Border**: `border border-white/20` or similar low-opacity border
- **Text Shadow**: `drop-shadow-md` for text over blurred backgrounds

## Typography

### Font Families
- **Headlines**: `font-tiempos-headline` (Tiempos Headline)
- **Display**: `font-outfit` (Outfit)
- **Body**: System sans-serif stack
- **Monospace**: `font-mono` for stats/metrics

### Text Hierarchy
- **Hero Text**: `text-4xl` to `text-6xl`, `font-bold`
- **Section Headers**: `text-2xl` to `text-3xl`, `font-bold`
- **Card Titles**: `text-2xl`, `font-extrabold`, `uppercase`, `tracking-widest`
- **Body**: `text-sm` to `text-base`
- **Captions**: `text-xs`, `text-rp-muted`

## Animation Standards

### Hover Effects
```tsx
className="transition-all hover:-translate-y-1 active:scale-95 hover:shadow-2xl"
```

### Common Transitions
- **Quick**: `transition-all duration-200`
- **Standard**: `transition-all duration-300`
- **Smooth**: `transition-all duration-500`
- **Card Flip**: `transition-transform duration-800`

## Button Standards

### Primary CTA
```tsx
className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 border border-amber-500/50 font-outfit text-sm font-extrabold tracking-widest text-white uppercase transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/30"
```

### Secondary Button
```tsx
className="px-4 py-2 rounded-lg border border-rp-iris/20 bg-rp-surface hover:bg-rp-overlay transition-all"
```

## Sound Effects

When adding interactive elements, integrate sound effects:
```tsx
import { useSFX } from '@/hooks/useSFX'

const { play } = useSFX()

// On click/hover
onClick={() => {
    play('click') // or 'hover', 'success', etc.
}}
```

## Checklist for New Components

- [ ] Uses Rose Pine color variables (`rp-*`)
- [ ] Fixed card dimensions (258x398px for character cards)
- [ ] Glassmorphism with proper backdrop-blur
- [ ] Smooth transitions (300ms default)
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Sound effects on interactions
- [ ] Proper z-index layering
- [ ] Drop shadows for depth
- [ ] Uppercase tracking for headers

## Examples

### Good Example - FlipCard
✅ Fixed dimensions, blurred background, glassmorphism, proper typography

### Bad Example
❌ Plain solid backgrounds
❌ No backdrop blur effects
❌ Random colors not from Rose Pine palette
❌ Inconsistent card sizes
❌ Missing transitions
