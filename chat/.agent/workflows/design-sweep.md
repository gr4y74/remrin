# Design Consistency Sweep Workflow

This workflow ensures consistent branding, theming, and styling across the entire Remrin.ai chat application.

## Prerequisites
- Rosé Pine theme variables defined in `globals.css`
- Tiempos fonts in `/public/fonts/`
- Logo at `/public/logo.svg`
- Dev server running: `npm run dev`

## Execution Order
Run agents **sequentially** (one at a time). Verify build after each.

---

## Agent 1: Branding Sweep
**Prompt:**
```
Replace all Remrin.ai branding with Remrin.ai across the codebase:

1. Search for "Remrin.ai", "Remrin.ai", "remrin" (case-insensitive)
2. Replace text references with "Remrin.ai" or "Remrin"
3. Find all logo/image references and update to use `/logo.svg`
4. Update page titles, meta descriptions, and alt text
5. Check package.json name and description
6. Run `npm run build` to verify

Files to check:
- components/ui/brand.tsx
- app/[locale]/layout.tsx
- app/[locale]/login/page.tsx
- All page.tsx files
- README.md, package.json
```

---

## Agent 2: Color Theme Consistency
**Prompt:**
```
Apply Rosé Pine theme consistently across all components:

COLOR REFERENCE:
- rp-base: #191724 (darkest background)
- rp-surface: #1f1d2e (cards, sidebars)
- rp-overlay: #26233a (dropdowns, modals)
- rp-text: #e0def4 (primary text)
- rp-subtle: #908caa (secondary text)
- rp-muted: #6e6a86 (disabled text)
- rp-rose: #ebbcba (accent, CTAs)
- rp-pine: #31748f (info)
- rp-foam: #9ccfd8 (success)
- rp-iris: #c4a7e7 (highlight)
- rp-love: #eb6f92 (error/destructive)
- rp-gold: #f6c177 (warning)

TASKS:
1. Find hardcoded colors (hex values, Tailwind color classes like bg-blue-500)
2. Replace with CSS variable equivalents (bg-rp-surface, text-rp-text, etc.)
3. Ensure consistent background hierarchy: base → surface → overlay
4. Update hover states to use rp-rose or rp-highlight-med
5. Run `npm run build` to verify

PRIORITY FILES:
- app/[locale]/globals.css (verify variables)
- All component files with bg-*, text-*, border-* classes
```

---

## Agent 3: Typography Consistency
**Prompt:**
```
Apply Tiempos font family consistently:

FONT CLASSES:
- font-tiempos-headline: Titles, persona names, headings
- font-tiempos-text: Body text, chat messages
- font-tiempos-fine: Elegant accents, quotes

TASKS:
1. Review all h1-h6 elements, add font-tiempos-headline
2. Review body/paragraph text, add font-tiempos-text
3. Ensure consistent font sizes (use Tailwind's text-sm, text-base, text-lg scale)
4. Remove any hardcoded font-family declarations
5. Verify chat messages use Tiempos (message-markdown.tsx)
6. Run `npm run build` to verify
```

---

## Agent 4: Sidebar & Navigation
**Prompt:**
```
Ensure sidebar and navigation consistency across all pages:

REFERENCE: components/sidebar/sidebar-switcher.tsx (already updated)

TASKS:
1. Verify all pages use the same sidebar component
2. Check icon sizes are consistent (24px for sidebar)
3. Verify hover effects: scale-110 + text-rp-rose
4. Ensure navigation links work correctly
5. Check mobile/responsive behavior
6. Profile settings dropdown uses Rosé Pine theme
7. Run `npm run build` to verify
```

---

## Agent 5: Page-by-Page Polish
**Prompt:**
```
Review each page route for design consistency:

PAGES TO CHECK:
- /login - Login form styling
- /[workspaceid]/chat - Main chat (already done)
- /discover - Discover souls page
- /marketplace - Soul Bazaar
- /moments - Moments gallery
- /summon - Soul summons
- /collection - My collection
- /workspace/* - Workspace settings pages

FOR EACH PAGE:
1. Background uses rp-base
2. Cards use rp-surface with rp-overlay hover
3. Text uses rp-text/rp-subtle
4. Buttons use rp-rose for primary actions
5. Borders use border-rp-highlight-med
6. Tiempos fonts applied
7. No orphan Remrin.ai references
8. Run `npm run build` after all changes
```

---

## Verification Checklist
After all agents complete:
- [ ] `npm run build` passes
- [ ] All pages load without errors
- [ ] No "Remrin.ai" text visible anywhere
- [ ] Rosé Pine theme consistent across all pages
- [ ] Tiempos fonts rendering correctly
- [ ] Sidebar works on all pages
