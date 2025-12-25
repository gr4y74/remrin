# Agent 2: Color Theme Consistency

**Recommended Model:** Claude Sonnet 4 (best CSS/design instinct)

## Objective
Apply Rosé Pine theme consistently across all components.

## Color Reference

```css
/* Rosé Pine Main */
--rp-base: #191724;      /* Darkest background */
--rp-surface: #1f1d2e;   /* Cards, sidebars */
--rp-overlay: #26233a;   /* Dropdowns, modals */
--rp-text: #e0def4;      /* Primary text */
--rp-subtle: #908caa;    /* Secondary text */
--rp-muted: #6e6a86;     /* Disabled/placeholder */
--rp-rose: #ebbcba;      /* Accent, CTAs */
--rp-pine: #31748f;      /* Info */
--rp-foam: #9ccfd8;      /* Success */
--rp-iris: #c4a7e7;      /* Highlight */
--rp-love: #eb6f92;      /* Error/destructive */
--rp-gold: #f6c177;      /* Warning */
```

## Tailwind Classes
- `bg-rp-base`, `bg-rp-surface`, `bg-rp-overlay`
- `text-rp-text`, `text-rp-subtle`, `text-rp-muted`
- `border-rp-highlight-med`
- `hover:bg-rp-overlay`, `hover:text-rp-rose`

## Tasks

1. **Find hardcoded colors:**
   ```bash
   grep -rE "#[0-9a-fA-F]{6}|bg-(blue|red|green|gray|slate)-" --include="*.tsx" .
   ```

2. **Replace with CSS variables:**
   - `bg-blue-500` → `bg-rp-pine`
   - `bg-gray-800` → `bg-rp-surface`
   - `text-gray-400` → `text-rp-muted`

3. **Ensure background hierarchy:**
   - Page backgrounds: `rp-base`
   - Cards/panels: `rp-surface`
   - Dropdowns/modals: `rp-overlay`

4. **Update hover/focus states:**
   - Buttons: `hover:bg-rp-rose/80`
   - Links: `hover:text-rp-rose`
   - Cards: `hover:bg-rp-overlay`

## Priority Files
- `app/[locale]/globals.css`
- `components/**/*.tsx`
- `tailwind.config.ts`

## Verification
```bash
npm run build
```

## Success Criteria
- [ ] No hardcoded hex colors in components
- [ ] Consistent dark theme appearance
- [ ] Build passes
