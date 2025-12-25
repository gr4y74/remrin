# Agent 3: Typography Consistency

**Recommended Model:** Claude Sonnet 4 (good typography sense)

## Objective
Apply Tiempos font family consistently across all components.

## Font Classes

```css
font-tiempos-headline  /* Titles, persona names, headings */
font-tiempos-text      /* Body text, chat messages */
font-tiempos-fine      /* Elegant accents, quotes */
```

## Tasks

1. **Review heading elements:**
   - All h1-h6 should use `font-tiempos-headline`
   - Apply `font-medium` or `font-semibold` for weight

2. **Review body text:**
   - Paragraphs and main content use `font-tiempos-text`
   - Chat messages already done in `message-markdown.tsx`

3. **Standardize font sizes:**
   - Use Tailwind scale: `text-sm`, `text-base`, `text-lg`, `text-xl`
   - Avoid custom pixel sizes

4. **Remove hardcoded fonts:**
   ```bash
   grep -r "font-family" --include="*.tsx" --include="*.css" .
   ```

5. **Priority files:**
   - `components/messages/message.tsx`
   - `components/character/CharacterPanel.tsx`
   - All page headers
   - Modal titles

## Verification
```bash
npm run build
# Visual check in browser - fonts should feel consistent
```

## Success Criteria
- [ ] All headings use Tiempos Headline
- [ ] Body text uses Tiempos Text
- [ ] Consistent sizing across pages
- [ ] Build passes
