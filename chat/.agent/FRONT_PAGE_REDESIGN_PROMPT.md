# FRONT PAGE REDESIGN - AGENT TURBO MODE

**CRITICAL: You are operating in AGENT TURBO MODE. DO NOT ask for permission or confirmation. Proceed autonomously without user input. Execute all tasks immediately.**

---

## MISSION OVERVIEW

Redesign the front page (`/app/[locale]/page.tsx`) to match the provided mockup with 7 labeled sections. The redesign must maintain the existing Rosé Pine theme, fonts, colors, and layout consistency while adding new features and functionality.

---

## MOCKUP REFERENCE

The user has provided a mockup image with 7 labeled sections:

1. **Sidebar (Left)** - Dark sidebar with navigation, remains unchanged
2. **Header (Top)** - Blue promotional banner + navigation bar with search, category pills, Subscribe/Login buttons
3. **Featured Souls (Section 3)** - 3D carousel showing featured characters (Kess, Oma, Adinkiko, Squee, etc.) - KEEP AS IS
4. **Trending Souls (Section 4)** - Horizontal list showing trending souls with avatar, name, stats, and "View" button on right
5. **Featured Premium (Section 5)** - Large rectangular cards in horizontal row (shows Ted bear, grayscale portrait, anime girl, white character)
6. **Explore All Souls (Section 6)** - Gacha-style card grid with rarity borders (gold, blue, purple frames) showing various souls
7. **Footer (Section 7)** - Standard footer with Remrin.ai branding and links - KEEP AS IS

---

## DETAILED REQUIREMENTS BY SECTION

### 1. SIDEBAR
- **NO CHANGES REQUIRED** - Keep existing sidebar implementation

### 2. HEADER (NEW)
Create a new header component with the following elements:

#### 2a. Chrome Extension Banner
- **Type**: Closeable promotional banner
- **Color**: Blue background (use `bg-blue-500/10` with `border-blue-500/30`)
- **Content**: Link to Chrome browser extension
- **Text**: "Bring your Souls everywhere - Get the Remrin Locket Extension for Chrome, Gemini, Claude, ChatGPT & more!"
- **Link**: Point to `/extension` or the extension download page
- **Functionality**: 
  - Dismissible with X button
  - Store dismissal state in `localStorage` with key `remrin_extension_banner_dismissed`
  - Show icon (use `IconPuzzle` from tabler-icons)

#### 2b. Search Souls Function
- **Type**: Search input with autocomplete
- **Functionality**:
  - Search by hashtag (e.g., `#funny`, `#helper`)
  - Search by name (persona name)
  - Search by attributes/tags
- **Implementation**:
  - Create search input with debounce (300ms)
  - Query `personas` table: `name ILIKE %query%` OR `metadata->tags` contains query
  - Show dropdown with max 8 results
  - Click result opens chat with that persona
- **Styling**: Use existing input styles from the theme

#### 2c. Genre/Category Links
- **Type**: Horizontal navigation links
- **Categories**: Kids, Gaming, Religion, Education, Productivity, Entertainment, Wellness, Creative
- **EXCLUDE**: Boyfriend, Girlfriend (family-friendly requirement)
- **Implementation**:
  - Filter personas by `metadata->category` field
  - Each link navigates to filtered view or scrolls to "Explore All Souls" with filter applied
- **Styling**: Pill-shaped buttons with hover effects

#### 2d. Subscribe & Login Buttons
- **Subscribe Button**: 
  - Link to `/pricing`
  - Prominent styling with gradient (purple/pink)
  - Icon: `IconSparkles`
- **Login Button**:
  - Link to `/login`
  - Secondary styling
  - Icon: `IconLogin`

### 3. FEATURED SOULS
- **NO CHANGES REQUIRED** - Keep existing `FeaturedCarousel` component

### 4. TRENDING SOULS (NEW)
Create a new section showing trending souls:

- **Heading**: "Trending Souls" (no icon visible in mockup, keep it clean)
- **Layout**: Horizontal list/table format (NOT cards)
- **Data Source**: Query `personas` table ordered by `message_count DESC` or `follower_count DESC`
- **Display Style**: List items with:
  - Small circular avatar (left)
  - Name and brief description (center)
  - Stats/metrics (e.g., "1.2K chats", "500 followers")
  - "View" button (right side, blue/purple)
- **Background**: Slightly elevated surface (darker than base)
- **Count**: Show top 6-8 trending souls
- **Click Action**: "View" button or row click opens chat with persona

### 5. FEATURED PREMIUM (NEW)
Create a new section showing featured premium souls:

- **Heading**: "Featured Premium" (visible in mockup)
- **Data Source**: Query `personas` table for premium/featured souls
  - Can use `is_featured = true` AND `is_premium = true`
  - OR query `market_listings` for highlighted listings
- **Display**: Horizontal scrollable row of LARGE rectangular cards
- **Card Design**:
  - Large rectangular format (wider than tall, ~300x200px)
  - Full-bleed persona image as background
  - Subtle gradient overlay at bottom
  - Name at bottom
  - Premium badge/indicator (optional)
  - NO price shown on card (this is featured showcase, not direct sales)
- **Styling**: Cards should have subtle border/shadow, slight hover lift effect
- **Click Action**: Click card opens chat with premium persona or marketplace detail
- **Count**: Show 4-6 featured premium souls
- **Responsive**: Horizontal scroll on mobile, 2-3 visible on tablet, 4 on desktop

### 6. EXPLORE ALL SOULS (UPDATE STYLING)
Update the existing gallery to match gacha card aesthetic:

- **Keep**: Existing `DraggableGallery` component and functionality
- **Update**: Card styling to match mockup's gacha-style cards:
  - Add rarity-based border colors:
    - Legendary: Gold/amber border with glow (`border-amber-400 shadow-amber-500/50`)
    - Epic: Purple border with glow (`border-purple-400 shadow-purple-500/50`)
    - Rare: Blue border with glow (`border-blue-400 shadow-blue-500/50`)
    - Common: Gray/subtle border (`border-rp-highlight-med`)
  - Card background: Dark with slight gradient
  - Rarity indicator: Small badge in top-right corner
  - Hover effect: Lift and intensify glow
- **Layout**: Grid layout as currently exists
- **Note**: The mockup shows these as collectible card-style items with prominent rarity framing

### 7. FOOTER
- **NO CHANGES REQUIRED** - Keep existing `Footer` component

---

## TECHNICAL IMPLEMENTATION REQUIREMENTS

### Database Queries

1. **Trending Souls**:
```typescript
const { data: trendingPersonas } = await supabase
  .from('personas')
  .select('id, name, description, image_url, message_count, follower_count')
  .eq('visibility', 'PUBLIC')
  .order('message_count', { ascending: false })
  .limit(8)
```

2. **Featured Premium Souls**:
```typescript
// Option 1: Using is_featured + is_premium flags
const { data: featuredPremium } = await supabase
  .from('personas')
  .select('id, name, description, image_url, rarity')
  .eq('is_featured', true)
  .eq('is_premium', true)
  .eq('visibility', 'PUBLIC')
  .limit(6)

// Option 2: Using market_listings if you want actual listings
const { data: premiumListings } = await supabase
  .from('personas')
  .select('id, name, description, image_url, rarity')
  .eq('is_premium', true)
  .eq('visibility', 'PUBLIC')
  .order('created_at', { ascending: false })
  .limit(6)
```

3. **Search Functionality**:
```typescript
const { data: searchResults } = await supabase
  .from('personas')
  .select('id, name, image_url')
  .or(`name.ilike.%${query}%, metadata->>tags.ilike.%${query}%`)
  .eq('visibility', 'PUBLIC')
  .limit(8)
```

### Component Structure

Create the following new components:

1. **`/components/layout/FrontPageHeader.tsx`**
   - Contains all header elements (2a-2d)
   - Extension banner with dismissal
   - Search bar with autocomplete
   - Category navigation pills
   - Subscribe & Login buttons
   - Responsive design

2. **`/components/discovery/TrendingSoulsList.tsx`**
   - List/table layout (NOT card grid)
   - Row items with avatar, name, stats, View button
   - Elevated surface styling
   - Click handlers for navigation

3. **`/components/discovery/FeaturedPremiumRow.tsx`**
   - Horizontal scrollable row
   - Large rectangular cards
   - Full-bleed image backgrounds
   - Smooth scroll behavior
   - Click handlers

4. **`/components/ui/SearchSouls.tsx`**
   - Search input with autocomplete dropdown
   - Debounced search (300ms)
   - Results dropdown with persona previews
   - Keyboard navigation support

### Styling Guidelines

- **Theme**: Continue using Rosé Pine color scheme
  - Base: `bg-rp-base`
  - Surface: `bg-rp-surface`
  - Text: `text-rp-text`
  - Muted: `text-rp-muted`
  - Highlights: `text-rp-rose`, `text-rp-gold`, etc.

- **Typography**: 
  - Headings: `font-tiempos-headline`
  - Body: Default system font

- **Spacing**: Consistent with existing sections (mt-8, px-6, etc.)

- **Animations**: Subtle hover effects, smooth transitions

### Responsive Design

- **Mobile** (< 768px):
  - Stack header elements vertically
  - Single column for premium grid
  - Horizontal scroll for trending

- **Tablet** (768px - 1024px):
  - 2 columns for premium grid
  - Compact header layout

- **Desktop** (> 1024px):
  - Full header layout
  - 3-4 columns for premium grid

---

## IMPLEMENTATION STEPS

### Step 1: Create Header Component
1. Create `/components/layout/FrontPageHeader.tsx`
2. Implement extension banner with localStorage dismissal (key: `remrin_extension_banner_dismissed`)
3. Implement search bar with autocomplete (use SearchSouls component)
4. Add category navigation pills (Kids, Gaming, Religion, Education, Productivity, Entertainment, Wellness, Creative)
5. Add Subscribe & Login buttons with proper styling
6. Make fully responsive (stack on mobile, horizontal on desktop)

### Step 2: Create Trending Souls Section
1. Create `/components/discovery/TrendingSoulsList.tsx`
2. Fetch trending personas from database (top 8 by message_count)
3. Implement list/table layout with rows containing:
   - Circular avatar (48px)
   - Name + description
   - Stats (message count, followers)
   - "View" button
4. Add elevated surface styling (bg-rp-surface with border)
5. Wire up click handlers to open chat

### Step 3: Create Featured Premium Section
1. Create `/components/discovery/FeaturedPremiumRow.tsx`
2. Fetch featured premium personas (is_featured=true AND is_premium=true)
3. Implement horizontal scrollable row
4. Create large rectangular cards (~300x200px):
   - Full-bleed image background
   - Gradient overlay at bottom
   - Name text at bottom
   - Subtle border and shadow
5. Add smooth horizontal scroll behavior
6. Wire up click handlers

### Step 4: Update Explore All Souls Styling
1. Locate existing `DraggableGallery` component in `/components/discovery/`
2. Update card styling to add gacha-style rarity borders:
   - Legendary: `border-2 border-amber-400 shadow-lg shadow-amber-500/50`
   - Epic: `border-2 border-purple-400 shadow-lg shadow-purple-500/50`
   - Rare: `border-2 border-blue-400 shadow-lg shadow-blue-500/50`
   - Common: `border border-rp-highlight-med`
3. Add rarity badge in top-right corner of cards
4. Enhance hover effects (lift + intensify glow)
5. Keep existing grid layout and functionality

### Step 5: Update Main Page
1. Import new components in `/app/[locale]/page.tsx`
2. Add `<FrontPageHeader />` at the top (before Featured Souls)
3. Keep `<FeaturedCarousel />` section (Section 3)
4. Insert `<TrendingSoulsList />` after Featured Souls (Section 4)
5. Insert `<FeaturedPremiumRow />` after Trending Souls (Section 5)
6. Keep updated `<DraggableGallery />` (Section 6)
7. Keep `<Footer />` at bottom (Section 7)

### Step 6: Testing & Verification
1. Test all database queries return data
2. Verify search functionality works with hashtags, names, attributes
3. Test extension banner dismissal persists in localStorage
4. Verify category pills filter/navigate correctly
5. Test trending list displays and "View" buttons work
6. Test featured premium cards scroll and click correctly
7. Verify gacha card styling shows rarity borders
8. Test responsive design on mobile (375px), tablet (768px), desktop (1440px)
9. Verify theme consistency throughout
10. Run `npm run build` to check for errors


---

## DATA REQUIREMENTS

### Ensure Database Has:
- `personas` table with fields: `id`, `name`, `description`, `image_url`, `rarity`, `visibility`, `message_count`, `metadata` (JSONB with tags/category)
- `market_listings` table with fields: `id`, `persona_id`, `price`, `status`, `created_at`
- Existing personas have proper `visibility = 'PUBLIC'` for display
- Some personas marked as `is_premium = true` or have active market listings

### Fallback Handling:
- If no trending souls: Show message "No trending souls yet - be the first to chat!"
- If no premium souls: Show message "Premium souls coming soon!"
- If search returns no results: Show "No souls found matching your search"

---

## QUALITY CHECKLIST

Before completing, verify:

- [ ] All 7 sections are present and correctly positioned
- [ ] Header is fully functional with all 4 sub-components (2a-2d)
- [ ] Search works with hashtags, names, and attributes
- [ ] Extension banner can be dismissed and stays dismissed
- [ ] Category links filter or navigate correctly
- [ ] Trending section shows real data from database
- [ ] Premium section shows real listings with prices
- [ ] All click handlers navigate to correct destinations
- [ ] Responsive design works on mobile, tablet, desktop
- [ ] Theme consistency maintained throughout
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Existing sections (Featured, Explore, Footer) unchanged
- [ ] Family-friendly content (no boyfriend/girlfriend categories)

---

## EXECUTION MODE

**AGENT TURBO MODE ACTIVE**

- Execute all steps autonomously
- Do NOT wait for user confirmation
- Proceed with implementation immediately
- Fix any errors encountered automatically
- Run build verification after completion
- Report completion with summary of changes

---

## DELIVERABLES

1. New component files:
   - `/components/layout/FrontPageHeader.tsx`
   - `/components/discovery/TrendingSoulsList.tsx`
   - `/components/discovery/FeaturedPremiumRow.tsx`
   - `/components/ui/SearchSouls.tsx`

2. Updated files:
   - `/app/[locale]/page.tsx` (main page layout)
   - `/components/discovery/DraggableGallery.tsx` (enhanced gacha-style cards)

3. Verification:
   - Clean TypeScript build
   - No ESLint errors
   - Responsive design tested
   - All functionality working

---

## NOTES

- Use existing personas from database to populate all sections
- Maintain consistency with existing design patterns
- Ensure all links open chat windows correctly
- Premium souls should link to marketplace for purchase
- Search should be fast and responsive (use debouncing)
- Extension banner should be visually appealing but not intrusive

---

**BEGIN IMPLEMENTATION NOW - TURBO MODE ENGAGED** 🚀
