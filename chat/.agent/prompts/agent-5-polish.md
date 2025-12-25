# Agent 5: Page-by-Page Polish

**Recommended Model:** Claude Sonnet 4 (thorough, detail-oriented)

## Objective
Review each page route for design consistency with the new Rosé Pine theme.

## Pages to Check

1. **`/login`** - Login form
2. **`/[workspaceid]/chat`** - Main chat ✓ (mostly done)
3. **`/discover`** - Discover souls
4. **`/marketplace`** - Soul Bazaar
5. **`/moments`** - Moments gallery
6. **`/summon`** - Soul summons
7. **`/collection`** - My collection
8. **`/workspace/*`** - Workspace settings

## For Each Page, Verify:

- [ ] Background uses `rp-base`
- [ ] Cards use `rp-surface` with `rp-overlay` hover
- [ ] Text uses `rp-text` / `rp-subtle`
- [ ] Buttons use `rp-rose` for primary actions
- [ ] Borders use `border-rp-highlight-med`
- [ ] Tiempos fonts applied to headings
- [ ] No orphan "ChatbotUI" references
- [ ] Logo shows Remrin logo

## File Locations
```
app/[locale]/login/
app/[locale]/[workspaceid]/chat/
app/[locale]/discover/
app/[locale]/marketplace/
app/[locale]/moments/
app/[locale]/summon/
app/[locale]/collection/
```

## Verification
```bash
npm run build
# Visit each page in browser
```

## Success Criteria
- [ ] All pages feel cohesive
- [ ] No visual inconsistencies
- [ ] Build passes
- [ ] No 404 or error pages
