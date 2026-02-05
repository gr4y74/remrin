---
name: Component Checklist
description: Quality checklist for React/Next.js components including TypeScript, accessibility, responsiveness, and testing
---

# Component Checklist Skill

Use this skill when creating or modifying React/Next.js components to ensure quality and consistency.

## Before Writing Code

### Planning
- [ ] Component name is descriptive and follows PascalCase
- [ ] Location in component tree is logical (`/components/discovery/`, `/components/ui/`, etc.)
- [ ] Dependencies are identified (hooks, utilities, types)
- [ ] Props interface is designed with proper types

## TypeScript Requirements

### Type Safety
```tsx
// ✅ Good - Explicit interface
interface CardProps {
    persona: Persona
    onClick?: () => void
    className?: string
}

export function Card({ persona, onClick, className }: CardProps) {
    // ...
}

// ❌ Bad - No types
export function Card({ persona, onClick, className }) {
    // ...
}
```

### Required Checks
- [ ] All props have explicit types via interface
- [ ] No `any` types (use `unknown` if truly dynamic)
- [ ] Return type is clear (component returns JSX.Element)
- [ ] Event handlers are typed: `onClick: () => void`, `onChange: (e: ChangeEvent<HTMLInputElement>) => void`
- [ ] Generics used appropriately for reusable components

## Component Structure

### File Organization
```
ComponentName/
├── ComponentName.tsx          # Main component
├── ComponentName.module.css   # Styles (if using CSS modules)
└── index.ts                   # Optional export
```

### Component Template
```tsx
"use client" // If using client-side features

import React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import styles from "./ComponentName.module.css"

interface ComponentNameProps {
    // Props
}

export function ComponentName({ prop1, prop2 }: ComponentNameProps) {
    // Hooks
    // Event handlers
    // Effects
    
    return (
        <div className={styles.container}>
            {/* JSX */}
        </div>
    )
}
```

## Accessibility (a11y)

### Required Elements
- [ ] Semantic HTML (`<button>`, `<nav>`, `<main>`, `<article>`, etc.)
- [ ] Alt text for all images
- [ ] ARIA labels where needed (`aria-label`, `aria-describedby`)
- [ ] Keyboard navigation support (Tab, Enter, Escape)
- [ ] Focus states visible (`focus:ring-2 focus:ring-rp-iris`)
- [ ] Color contrast meets WCAG AA standards

### Interactive Elements
```tsx
// ✅ Good - Button with proper semantics
<button
    onClick={handleClick}
    aria-label="Close modal"
    className="..."
>
    <XIcon />
</button>

// ❌ Bad - Div as button
<div onClick={handleClick}>
    <XIcon />
</div>
```

## Responsive Design

### Breakpoints (Tailwind)
- `sm`: 640px (mobile landscape)
- `md`: 768px (tablet)
- `lg`: 1024px (desktop)
- `xl`: 1280px (large desktop)

### Required Checks
- [ ] Component works on mobile (320px+)
- [ ] Component works on tablet (768px+)
- [ ] Component works on desktop (1024px+)
- [ ] Touch targets are at least 44x44px
- [ ] Text is readable at all sizes
- [ ] Horizontal scroll is avoided

### Responsive Pattern
```tsx
<div className="
    px-4 py-6           // Mobile
    sm:px-6 sm:py-8     // Tablet
    md:px-8 md:py-10    // Desktop
">
    {/* Content */}
</div>
```

## Performance

### Image Optimization
- [ ] Use Next.js `Image` component
- [ ] Specify `width` and `height` or use `fill`
- [ ] Add `sizes` prop for responsive images
- [ ] Use appropriate formats (WebP, AVIF)

### Code Splitting
- [ ] Use dynamic imports for heavy components
- [ ] Lazy load components below the fold
- [ ] Use `React.memo()` for expensive renders

### Example
```tsx
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
    loading: () => <LoadingSpinner />
})
```

## State Management

### Client State
- [ ] Use `useState` for local state
- [ ] Use `useReducer` for complex state
- [ ] Use `useContext` for shared state (avoid prop drilling)
- [ ] State is properly typed

### Server State
- [ ] Use SWR or React Query for data fetching
- [ ] Handle loading states
- [ ] Handle error states
- [ ] Implement retry logic

## Error Handling

### Required Checks
- [ ] Try/catch blocks for async operations
- [ ] Error states displayed to user
- [ ] Errors logged to console in development
- [ ] Fallback UI for error states

### Example
```tsx
const [error, setError] = useState<string | null>(null)

try {
    const data = await fetchData()
    setData(data)
} catch (err) {
    setError("Failed to load data")
    console.error(err)
}

if (error) {
    return <ErrorMessage message={error} />
}
```

## Sound Effects Integration

### Required for Interactive Components
- [ ] Import `useSFX` hook
- [ ] Add sound on hover (optional)
- [ ] Add sound on click
- [ ] Add sound on success/error

### Example
```tsx
import { useSFX } from '@/hooks/useSFX'

export function InteractiveCard({ onClick }: Props) {
    const { play } = useSFX()
    
    return (
        <button
            onClick={() => {
                play('click')
                onClick?.()
            }}
            onMouseEnter={() => play('hover')}
        >
            Click me
        </button>
    )
}
```

## CSS/Styling

### Tailwind Classes
- [ ] Use utility classes consistently
- [ ] Group related classes (layout, spacing, colors, typography)
- [ ] Use `cn()` helper for conditional classes
- [ ] Avoid inline styles unless dynamic

### CSS Modules (if used)
- [ ] Class names are semantic
- [ ] No global styles (use scoped classes)
- [ ] Variables for repeated values

## Testing Checklist

### Manual Testing
- [ ] Component renders without errors
- [ ] All props work as expected
- [ ] Click handlers fire correctly
- [ ] Hover states work
- [ ] Keyboard navigation works
- [ ] Component works in all browsers

### Visual Testing
- [ ] Check in light/dark mode (if applicable)
- [ ] Check at different screen sizes
- [ ] Check with long/short content
- [ ] Check with missing/broken images

## Pre-Commit Checklist

- [ ] Run `npm run type-check` - passes
- [ ] Run `npm run lint` - passes
- [ ] No console.logs (except intentional debugging)
- [ ] No commented-out code
- [ ] Component exported from index.ts
- [ ] File follows naming conventions
- [ ] Imports are organized (React, Next, external, internal, styles)

## Documentation

### JSDoc Comments (for complex components)
```tsx
/**
 * FlipCard displays a character card with front/back flip animation
 * 
 * @param persona - The persona data to display
 * @param onClick - Optional click handler
 * @param className - Additional CSS classes
 */
export function FlipCard({ persona, onClick, className }: FlipCardProps) {
    // ...
}
```

## Common Pitfalls to Avoid

❌ Missing key props in lists
❌ Using index as key
❌ Mutating state directly
❌ Missing dependencies in useEffect
❌ Not handling loading/error states
❌ Hardcoded colors (use theme variables)
❌ Magic numbers (use named constants)
❌ Oversized images without optimization
