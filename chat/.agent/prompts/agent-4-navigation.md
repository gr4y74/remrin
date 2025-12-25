# Agent 4: Sidebar & Navigation

**Recommended Model:** Gemini 3 Pro (good for structural consistency)

## Objective
Ensure sidebar and navigation consistency across all pages.

## Reference Implementation
`components/sidebar/sidebar-switcher.tsx` (already updated)

## Tasks

1. **Verify sidebar usage:**
   - All workspace pages should use `Dashboard` component
   - Dashboard includes the sidebar automatically

2. **Icon consistency:**
   - Sidebar icons: 24px
   - Button icons: 18-22px
   - Hover: `scale-110 + text-rp-rose`

3. **Navigation links:**
   - `/discover` - Discover Souls
   - `/marketplace` - Soul Bazaar
   - `/moments` - Moments Gallery
   - `/summon` - Soul Summons
   - `/collection` - My Collection

4. **Check these components:**
   - `components/sidebar/sidebar-switcher.tsx`
   - `components/sidebar/sidebar.tsx`
   - `components/ui/dashboard.tsx`
   - `components/utility/profile-settings.tsx`

5. **Mobile/responsive:**
   - Sidebar should collapse on small screens
   - Icons remain accessible

## Verification
```bash
npm run build
# Navigate all links in browser
```

## Success Criteria
- [ ] All pages have consistent sidebar
- [ ] All links work correctly
- [ ] Hover animations consistent
- [ ] Build passes
