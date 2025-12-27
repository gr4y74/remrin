# Design Fixes - Implementation Guide

This document provides **specific code changes** to fix the issues identified in the Design Audit Report.

---

## 🔴 PHASE 1: Critical Fixes

### 1. Remove Hardcoded Colors

#### File: `components/sidebar/sidebar-switcher.tsx`

**Line 132 - Soul Summons Color**
```typescript
// ❌ BEFORE
display={<div style={{ color: '#EA2E20' }}>Soul Summons</div>}

// ✅ AFTER
display={<div className="text-rp-love">Soul Summons</div>}
```

**Line 187 - Settings Icon Color**
```typescript
// ❌ BEFORE
<IconSettings 
  size={SIDEBAR_ICON_SIZE} 
  className={cn(iconHoverClass, isToolsOpen && "rotate-90")} 
  style={{ color: isToolsOpen ? '#DE5BA7' : '#DE5BA7' }} 
/>

// ✅ AFTER
<IconSettings 
  size={SIDEBAR_ICON_SIZE} 
  className={cn(
    iconHoverClass, 
    "text-rp-love",
    isToolsOpen && "rotate-90"
  )} 
/>
```

---

#### File: `components/discovery/TrendingCarousel.tsx`

**Lines 60-61 - Featured Souls Header**
```typescript
// ❌ BEFORE
<Star className="size-5" style={{ color: '#907AA8' }} />
<h2 className="text-2xl font-bold" style={{ color: '#907AA8' }}>Featured Souls</h2>

// ✅ AFTER
<Star className="size-5 text-rp-iris" />
<h2 className="font-tiempos-headline text-2xl font-bold text-rp-iris">Featured Souls</h2>
```

---

#### File: `components/discovery/DiscoveryFeed.tsx`

**Lines 145-146 - Explore Souls Header**
```typescript
// ❌ BEFORE
<Compass className="size-5" style={{ color: '#907AA8' }} />
<h2 className="text-2xl font-bold" style={{ color: '#907AA8' }}>Explore Souls</h2>

// ✅ AFTER
<Compass className="size-5 text-rp-iris" />
<h2 className="font-tiempos-headline text-2xl font-bold text-rp-iris">Explore Souls</h2>
```

---

#### File: `components/discovery/CharacterCard.tsx`

**Line 117 - Badge Color**
```typescript
// ❌ BEFORE
<Badge 
  className="bg-rp-base/60 flex items-center gap-1 rounded-full border-0 px-2 py-1 text-xs backdrop-blur-sm" 
  style={{ color: '#BE8E95' }}
>

// ✅ AFTER
<Badge className="bg-rp-base/60 text-rp-rose flex items-center gap-1 rounded-full border-0 px-2 py-1 text-xs backdrop-blur-sm">
```

**Line 150 - Character Name Color**
```typescript
// ❌ BEFORE
<h3 
  className={cn(
    "font-tiempos-headline line-clamp-2 text-lg font-bold leading-tight drop-shadow-lg",
    "transition-transform duration-300",
    isHovering && "translate-x-1"
  )}
  style={{ color: '#BE8E95' }}
>

// ✅ AFTER
<h3 className={cn(
  "font-tiempos-headline text-rp-rose line-clamp-2 text-lg font-bold leading-tight drop-shadow-lg",
  "transition-transform duration-300",
  isHovering && "translate-x-1"
)}>
```

---

#### File: `app/[locale]/page.tsx`

**Line 308 - Soul Summons Button Text**
```typescript
// ❌ BEFORE
<span className="text-sm font-medium" style={{ color: '#ea2e20' }}>Soul Summons</span>

// ✅ AFTER
<span className="text-sm font-medium text-rp-love">Soul Summons</span>
```

**Line 345 - Explore Souls Header**
```typescript
// ❌ BEFORE
<h2 className="font-tiempos-headline text-lg font-semibold" style={{ color: '#907aa8' }}>
  Explore Souls
</h2>

// ✅ AFTER
<h2 className="font-tiempos-headline text-lg font-semibold text-rp-iris">
  Explore Souls
</h2>
```

---

### 2. Fix Studio Page Zinc Colors

#### File: `app/[locale]/studio/page.tsx`

**Replace all instances:**
```typescript
// ❌ BEFORE → ✅ AFTER
text-zinc-400  → text-rp-subtle
text-zinc-500  → text-rp-muted
text-zinc-600  → text-rp-muted/80
bg-zinc-900    → bg-rp-surface
border-zinc-700 → border-rp-highlight-med
border-zinc-600 → border-rp-highlight-high
hover:text-zinc-300 → hover:text-rp-text
```

**Specific Examples:**

**Line 100**
```typescript
// ❌ BEFORE
className="flex items-center gap-2 text-zinc-400 transition-colors hover:text-white"

// ✅ AFTER
className="flex items-center gap-2 text-rp-subtle transition-colors hover:text-rp-text"
```

**Line 109**
```typescript
// ❌ BEFORE
<span className="ml-2 text-sm font-normal text-zinc-500">

// ✅ AFTER
<span className="ml-2 text-sm font-normal text-rp-muted">
```

**Line 189**
```typescript
// ❌ BEFORE
<p className="mt-1 text-xs text-zinc-500">

// ✅ AFTER
<p className="mt-1 text-xs text-rp-muted">
```

---

#### File: `app/[locale]/studio/components/store-tab.tsx`

**Line 60**
```typescript
// ❌ BEFORE
<p className="text-sm text-zinc-500">

// ✅ AFTER
<p className="text-sm text-rp-muted">
```

**Line 74**
```typescript
// ❌ BEFORE
<span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>

// ✅ AFTER
<span className="absolute left-3 top-1/2 -translate-y-1/2 text-rp-muted">$</span>
```

**Line 144**
```typescript
// ❌ BEFORE
<div className="text-sm font-medium text-zinc-400">Add New Item</div>

// ✅ AFTER
<div className="text-sm font-medium text-rp-subtle">Add New Item</div>
```

---

#### File: `app/[locale]/studio/components/voice-tab.tsx`

**Line 47**
```typescript
// ❌ BEFORE
<div className="flex flex-col items-center gap-2 text-zinc-500">

// ✅ AFTER
<div className="flex flex-col items-center gap-2 text-rp-muted">
```

**Line 94**
```typescript
// ❌ BEFORE
: 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600'

// ✅ AFTER
: 'border-rp-highlight-med bg-rp-surface text-rp-subtle hover:border-rp-highlight-high'
```

---

#### File: `app/[locale]/studio/components/visuals-tab.tsx`

**Line 47**
```typescript
// ❌ BEFORE
<div className="flex flex-col items-center gap-2 text-zinc-500">

// ✅ AFTER
<div className="flex flex-col items-center gap-2 text-rp-muted">
```

---

#### File: `app/[locale]/studio/components/behavior-tab.tsx`

**Line 39**
```typescript
// ❌ BEFORE
<p className="text-sm text-zinc-400">

// ✅ AFTER
<p className="text-sm text-rp-subtle">
```

---

#### File: `app/[locale]/studio/components/identity-tab.tsx`

**Line 67**
```typescript
// ❌ BEFORE
<div className="flex flex-col items-center gap-2 text-zinc-500">

// ✅ AFTER
<div className="flex flex-col items-center gap-2 text-rp-muted">
```

---

### 3. Add Focus States to Inputs

#### File: `components/ui/input.tsx`

**Line 14 - Add focus ring**
```typescript
// ❌ BEFORE
className={cn(
  "border-input bg-background ring-offset-background placeholder:text-muted-foreground focus:none flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  className
)}

// ✅ AFTER
className={cn(
  "border-input bg-background ring-offset-background placeholder:text-muted-foreground flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rp-rose/50 focus-visible:border-rp-rose focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
  className
)}
```

---

### 4. Improve Button Hover States

#### File: `components/ui/button.tsx`

**Line 8 - Better hover effect**
```typescript
// ❌ BEFORE
const buttonVariants = cva(
  "ring-offset-background focus-visible:ring-ring inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",

// ✅ AFTER
const buttonVariants = cva(
  "ring-offset-background focus-visible:ring-ring inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
```

**Update variant hover states:**
```typescript
variants: {
  variant: {
    // ✅ AFTER - Better hover states
    default: "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:scale-105",
    outline: "border-input bg-background hover:bg-accent hover:text-accent-foreground hover:scale-105 border",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:scale-105",
    ghost: "hover:bg-accent hover:text-accent-foreground hover:scale-105",
    link: "text-primary underline-offset-4 hover:underline"
  },
  // ... rest stays the same
}
```

---

## 🟡 PHASE 2: Consistency Improvements

### 1. Typography Standardization

#### Create Typography Constants

**File: `lib/design-tokens.ts`** (Create new file)
```typescript
export const TYPOGRAPHY = {
  heading: {
    h1: 'font-tiempos-headline text-4xl md:text-5xl lg:text-6xl font-bold',
    h2: 'font-tiempos-headline text-2xl md:text-3xl lg:text-4xl font-semibold',
    h3: 'font-tiempos-headline text-xl md:text-2xl font-semibold',
    h4: 'font-tiempos-headline text-lg md:text-xl font-medium',
  },
  body: {
    large: 'font-tiempos-text text-lg',
    normal: 'font-tiempos-text text-base',
    small: 'font-tiempos-text text-sm',
    tiny: 'font-tiempos-fine text-xs',
  },
}

export const SPACING = {
  card: {
    small: 'p-3',
    medium: 'p-4',
    large: 'p-6',
  },
  section: {
    tight: 'mt-4',
    normal: 'mt-6',
    loose: 'mt-8',
    extraLoose: 'mt-12',
  },
}

export const BORDERS = {
  radius: {
    button: 'rounded-full',
    card: 'rounded-2xl',
    input: 'rounded-lg',
    badge: 'rounded-full',
  },
}

export const TRANSITIONS = {
  fast: 'transition-all duration-200 ease-out',
  normal: 'transition-all duration-300 ease-out',
  slow: 'transition-all duration-500 ease-out',
}
```

---

#### Update Page Headers

**File: `app/[locale]/(platform)/moments/page.tsx`**

**Line 107**
```typescript
// ❌ BEFORE
<h1 className="font-tiempos-headline text-3xl font-bold text-rp-text">

// ✅ AFTER
<h1 className="font-tiempos-headline text-4xl md:text-5xl font-bold text-rp-text">
```

---

**File: `app/[locale]/(platform)/summon/page.tsx`**

**Line 113 - Already good, keep as is**
```typescript
// ✅ GOOD
<h1 className="font-tiempos-headline bg-gradient-to-r from-purple-400 via-pink-500 to-orange-400 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent md:text-5xl">
```

---

### 2. Standardize Card Padding

#### File: `components/collection/CollectionCard.tsx`

**Line 161**
```typescript
// ❌ BEFORE
<div className="absolute inset-x-0 bottom-0 p-3">

// ✅ AFTER
<div className="absolute inset-x-0 bottom-0 p-4">
```

---

### 3. Unify Badge Positioning

**Apply to all card components:**
```typescript
// ✅ STANDARD
// Top-right badges
className="absolute right-3 top-3"

// Top-left badges
className="absolute left-3 top-3"
```

---

### 4. Standardize Hover Effects

**Apply to all interactive elements:**

```typescript
// Links
className="hover:text-rp-rose hover:scale-105 transition-all duration-200"

// Buttons
className="hover:bg-primary/90 hover:scale-105 transition-all duration-200"

// Cards
className="hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"

// Icons
className="hover:text-rp-rose hover:scale-110 transition-all duration-200"
```

---

## 🟢 PHASE 3: Enhancements

### 1. Add Skeleton Screens

**File: `components/ui/skeleton.tsx`** (Create new file)
```typescript
import { cn } from "@/lib/utils"

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-rp-surface/50",
        className
      )}
      {...props}
    />
  )
}

// Card skeleton
export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-rp-muted/20 bg-rp-surface overflow-hidden">
      <Skeleton className="aspect-[3/4] w-full" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )
}

// Grid skeleton
export function GridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}
```

**Usage in pages:**
```typescript
// In loading states
{loading ? (
  <GridSkeleton count={12} />
) : (
  <CharacterGrid characters={characters} />
)}
```

---

### 2. Add Scroll-Triggered Animations

**File: `lib/hooks/use-intersection-observer.ts`** (Create new file)
```typescript
import { useEffect, useRef, useState } from 'react'

export function useIntersectionObserver(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true)
        observer.disconnect()
      }
    }, options)

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [options])

  return { ref, isVisible }
}
```

**Usage:**
```typescript
function AnimatedSection({ children }) {
  const { ref, isVisible } = useIntersectionObserver({ threshold: 0.1 })
  
  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      )}
    >
      {children}
    </div>
  )
}
```

---

### 3. Enhanced Glassmorphism

**Update card components:**
```typescript
// ✅ Enhanced glass effect
className="bg-rp-surface/80 backdrop-blur-xl border border-white/10 dark:border-white/5 shadow-2xl"
```

---

### 4. Add Custom Color Variables

**File: `app/[locale]/globals.css`**

**Add to :root (light theme):**
```css
:root {
  /* ... existing variables ... */
  
  /* Extended palette */
  --rp-crimson: 3 82% 52%;      /* #ea2e20 equivalent */
  --rp-magenta: 330 68% 61%;    /* #de5ba7 equivalent */
  --rp-lavender: 268 21% 57%;   /* #907aa8 equivalent */
  --rp-dusty-rose: 351 27% 65%; /* #be8e95 equivalent */
}

.dark {
  /* ... existing variables ... */
  
  /* Extended palette - dark mode versions */
  --rp-crimson: 343 81% 75%;
  --rp-magenta: 330 68% 61%;
  --rp-lavender: 267 57% 78%;
  --rp-dusty-rose: 2 55% 83%;
}
```

**Update tailwind.config.ts:**
```typescript
colors: {
  // ... existing colors ...
  
  // Extended Rosé Pine
  'rp-crimson': 'hsl(var(--rp-crimson))',
  'rp-magenta': 'hsl(var(--rp-magenta))',
  'rp-lavender': 'hsl(var(--rp-lavender))',
  'rp-dusty-rose': 'hsl(var(--rp-dusty-rose))',
}
```

**Then use in components:**
```typescript
// Instead of hardcoded colors
className="text-rp-crimson"    // For #ea2e20
className="text-rp-magenta"    // For #de5ba7
className="text-rp-lavender"   // For #907aa8
className="text-rp-dusty-rose" // For #be8e95
```

---

## Testing Checklist

After implementing fixes, test:

### Visual Testing
- [ ] All pages in light mode
- [ ] All pages in dark mode
- [ ] Theme switching works correctly
- [ ] No hardcoded colors visible
- [ ] Consistent spacing across pages
- [ ] Typography hierarchy clear

### Interaction Testing
- [ ] All buttons have hover states
- [ ] All links have hover states
- [ ] Focus indicators visible on tab
- [ ] Cards tilt on hover
- [ ] Animations smooth (60fps)

### Accessibility Testing
- [ ] Color contrast ratios pass WCAG AA
- [ ] All interactive elements have focus states
- [ ] ARIA labels present where needed
- [ ] Keyboard navigation works
- [ ] Screen reader friendly

### Responsive Testing
- [ ] Mobile (375px)
- [ ] Tablet (768px)
- [ ] Desktop (1440px)
- [ ] Touch targets ≥ 44px
- [ ] No horizontal scroll

---

## Quick Find & Replace Commands

For bulk updates, use these VS Code regex patterns:

### Remove inline color styles
**Find:** `style=\{\{\s*color:\s*['"]#[0-9a-fA-F]{6}['"]\s*\}\}`
**Replace:** (manual - depends on context)

### Replace text-zinc classes
**Find:** `text-zinc-400`
**Replace:** `text-rp-subtle`

**Find:** `text-zinc-500`
**Replace:** `text-rp-muted`

**Find:** `text-zinc-600`
**Replace:** `text-rp-muted/80`

### Replace bg-zinc classes
**Find:** `bg-zinc-900`
**Replace:** `bg-rp-surface`

### Replace border-zinc classes
**Find:** `border-zinc-700`
**Replace:** `border-rp-highlight-med`

**Find:** `border-zinc-600`
**Replace:** `border-rp-highlight-high`

---

## Implementation Order

1. **Day 1:** Remove hardcoded colors (sidebar, discovery, landing)
2. **Day 2:** Fix Studio page zinc colors
3. **Day 3:** Add focus states and accessibility fixes
4. **Day 4:** Typography standardization
5. **Day 5:** Spacing and padding consistency
6. **Day 6-7:** Component polish and hover states
7. **Day 8-10:** Enhancements (skeletons, animations, etc.)

---

**Total Estimated Time:** 35-50 hours
**Recommended Team Size:** 1-2 developers
**Testing Time:** Additional 10-15 hours

---

## Notes

- Always test in both light and dark modes
- Use browser DevTools to verify color contrast
- Test on real mobile devices, not just browser resize
- Run `npm run build` to catch TypeScript errors
- Use `npm run lint` to catch style issues

---

**End of Implementation Guide**
