# Front Page Mockup → Implementation Mapping

## Visual Reference Guide

This document maps each labeled section in your mockup to the specific implementation details.

---

## SECTION 1: SIDEBAR (LEFT)
**Mockup**: Dark sidebar with navigation icons
**Implementation**: NO CHANGES
**Status**: ✅ Keep existing

---

## SECTION 2: HEADER (TOP)

### 2a: Blue Extension Banner
**Mockup**: Blue bar at very top
**Component**: `FrontPageHeader.tsx` (banner section)
**Features**:
- Text: "Bring your Souls everywhere - Get the Remrin Locket Extension..."
- Dismissible X button
- localStorage key: `remrin_extension_banner_dismissed`
- Link to: `/extension`

### 2b: Search Bar
**Mockup**: Search input in navigation bar
**Component**: `SearchSouls.tsx` (embedded in header)
**Features**:
- Autocomplete dropdown
- Search by: name, #hashtag, attributes
- 300ms debounce
- Max 8 results shown

### 2c: Category Pills
**Mockup**: Horizontal pill buttons (Kids, Gaming, etc.)
**Component**: `FrontPageHeader.tsx` (category nav)
**Categories**: 
- Kids, Gaming, Religion, Education
- Productivity, Entertainment, Wellness, Creative
- ❌ EXCLUDE: Boyfriend, Girlfriend

### 2d: Action Buttons
**Mockup**: Subscribe + Login buttons on right
**Component**: `FrontPageHeader.tsx` (action buttons)
**Buttons**:
- Subscribe → `/pricing` (purple/pink gradient)
- Login → `/login` (secondary style)

---

## SECTION 3: FEATURED SOULS
**Mockup**: 3D carousel with Kess, Oma, Adinkiko, Squee, etc.
**Component**: `FeaturedCarousel` (existing)
**Implementation**: ✅ NO CHANGES - Keep as is

---

## SECTION 4: TRENDING SOULS
**Mockup**: Horizontal list with avatars, names, stats, "View" buttons
**Component**: `TrendingSoulsList.tsx` (NEW)
**Layout**: List/table format (NOT cards)
**Row Structure**:
```
[Avatar 48px] | Name + Description | Stats (1.2K chats) | [View Button]
```
**Data**: Top 8 personas by `message_count DESC`
**Styling**: Elevated surface (bg-rp-surface with border)

---

## SECTION 5: FEATURED PREMIUM
**Mockup**: Large rectangular cards (Ted bear, anime girl, etc.)
**Component**: `FeaturedPremiumRow.tsx` (NEW)
**Layout**: Horizontal scrollable row
**Card Design**:
- Size: ~300x200px (landscape)
- Background: Full-bleed persona image
- Overlay: Gradient at bottom
- Text: Name at bottom
- Badge: Optional premium indicator
- ❌ NO PRICE (this is showcase, not sales)

**Data**: Personas where `is_featured=true AND is_premium=true`
**Count**: 4-6 cards

---

## SECTION 6: EXPLORE ALL SOULS
**Mockup**: Grid of gacha-style cards with colored rarity borders
**Component**: `DraggableGallery.tsx` (ENHANCED)
**Changes**: Add rarity-based styling

### Rarity Border Styling:
- **Legendary**: `border-2 border-amber-400 shadow-lg shadow-amber-500/50` (Gold glow)
- **Epic**: `border-2 border-purple-400 shadow-lg shadow-purple-500/50` (Purple glow)
- **Rare**: `border-2 border-blue-400 shadow-lg shadow-blue-500/50` (Blue glow)
- **Common**: `border border-rp-highlight-med` (Subtle gray)

### Additional Enhancements:
- Rarity badge in top-right corner
- Enhanced hover: lift + intensify glow
- Keep existing grid layout

---

## SECTION 7: FOOTER
**Mockup**: Standard footer with Remrin.ai branding
**Component**: `Footer` (existing)
**Implementation**: ✅ NO CHANGES - Keep as is

---

## Component Hierarchy

```
<PageTemplate>
  <FrontPageHeader>                    ← NEW (Section 2)
    <ExtensionBanner />                ← 2a
    <SearchSouls />                    ← 2b
    <CategoryNav />                    ← 2c
    <ActionButtons />                  ← 2d
  </FrontPageHeader>
  
  <FeaturedCarousel />                 ← EXISTING (Section 3)
  
  <TrendingSoulsList />                ← NEW (Section 4)
  
  <FeaturedPremiumRow />               ← NEW (Section 5)
  
  <DraggableGallery />                 ← ENHANCED (Section 6)
  
  <Footer />                           ← EXISTING (Section 7)
</PageTemplate>
```

---

## Database Schema Requirements

### personas table needs:
- `id` (uuid)
- `name` (text)
- `description` (text)
- `image_url` (text)
- `rarity` (text: common|rare|epic|legendary)
- `visibility` (text: PUBLIC|PRIVATE)
- `message_count` (integer)
- `follower_count` (integer)
- `is_featured` (boolean)
- `is_premium` (boolean)
- `metadata` (jsonb) - contains tags, category

### market_listings table (optional):
- `id` (uuid)
- `persona_id` (uuid)
- `price` (numeric)
- `status` (text: active|sold)
- `created_at` (timestamp)

---

## Responsive Breakpoints

### Mobile (< 768px)
- Header: Stack vertically
- Trending: Vertical list
- Premium: Horizontal scroll (1 card visible)
- Explore: 1-2 columns

### Tablet (768px - 1024px)
- Header: Compact horizontal
- Trending: List format
- Premium: Horizontal scroll (2-3 cards visible)
- Explore: 3-4 columns

### Desktop (> 1024px)
- Header: Full horizontal layout
- Trending: List format
- Premium: Horizontal scroll (4 cards visible)
- Explore: 5-6 columns

---

## Color Palette (Rosé Pine)

```css
/* Base Colors */
--rp-base: #191724
--rp-surface: #1f1d2e
--rp-overlay: #26233a

/* Text Colors */
--rp-text: #e0def4
--rp-muted: #6e6a86

/* Accent Colors */
--rp-rose: #ebbcba
--rp-gold: #f6c177
--rp-foam: #9ccfd8
--rp-iris: #c4a7e7

/* Rarity Colors */
--legendary: #f59e0b (amber-500)
--epic: #a855f7 (purple-500)
--rare: #3b82f6 (blue-500)
--common: #6e6a86 (rp-muted)
```

---

## Click Behaviors

| Element | Action | Destination |
|---------|--------|-------------|
| Extension Banner | Click | `/extension` |
| Search Result | Click | `/{workspaceId}/chat?persona={id}` |
| Category Pill | Click | Filter Explore section or navigate |
| Subscribe Button | Click | `/pricing` |
| Login Button | Click | `/login` |
| Featured Carousel Card | Click | `/{workspaceId}/chat?persona={id}` |
| Trending "View" Button | Click | `/{workspaceId}/chat?persona={id}` |
| Premium Card | Click | `/{workspaceId}/chat?persona={id}` or marketplace |
| Explore Card | Click | `/{workspaceId}/chat?persona={id}` |

---

## Testing Checklist

- [ ] Extension banner appears and can be dismissed
- [ ] Banner dismissal persists after page reload
- [ ] Search autocomplete shows results
- [ ] Search works with #hashtags
- [ ] Category pills filter correctly
- [ ] Subscribe/Login buttons navigate correctly
- [ ] Featured carousel unchanged
- [ ] Trending list shows 8 souls with stats
- [ ] Trending "View" buttons work
- [ ] Premium row scrolls smoothly
- [ ] Premium cards show 4-6 souls
- [ ] Explore cards have rarity borders
- [ ] Rarity glows on hover
- [ ] Mobile: All sections stack properly
- [ ] Tablet: Compact layout works
- [ ] Desktop: Full layout displays
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Build succeeds

---

**This mapping ensures the agent implements exactly what's shown in your mockup!** ✨
