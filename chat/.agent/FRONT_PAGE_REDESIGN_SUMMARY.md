# Front Page Redesign - Agent Prompt Summary

## Overview
I've created a comprehensive, detailed agent prompt for redesigning the Remrin.ai front page based on your mockup image. The prompt is designed for **AGENT TURBO MODE** - meaning the agent will execute autonomously without asking for permission.

## Prompt Location
**File**: `/mnt/Data68/remrin/chat/.agent/FRONT_PAGE_REDESIGN_PROMPT.md`

## What the Prompt Covers

### 7 Sections from Your Mockup

1. **Sidebar** - No changes (existing implementation)

2. **Header** - NEW component with 4 parts:
   - Blue closeable extension banner (localStorage dismissal)
   - Search bar with autocomplete (hashtags, names, attributes)
   - Category navigation pills (Kids, Gaming, Religion, Education, etc.)
   - Subscribe & Login buttons

3. **Featured Souls** - No changes (keep existing 3D carousel)

4. **Trending Souls** - NEW list/table layout showing:
   - Circular avatars
   - Name + description
   - Stats (message count, followers)
   - "View" button

5. **Featured Premium** - NEW horizontal scrollable row:
   - Large rectangular cards (~300x200px)
   - Full-bleed image backgrounds
   - Gradient overlay with name at bottom
   - No pricing (showcase, not sales)

6. **Explore All Souls** - ENHANCED styling:
   - Keep existing DraggableGallery
   - Add gacha-style rarity borders (gold, purple, blue)
   - Rarity badges
   - Enhanced glow effects

7. **Footer** - No changes (existing implementation)

## Components to Create

1. `/components/layout/FrontPageHeader.tsx` - Complete header with all 4 sub-components
2. `/components/discovery/TrendingSoulsList.tsx` - List layout for trending souls
3. `/components/discovery/FeaturedPremiumRow.tsx` - Horizontal scrollable premium showcase
4. `/components/ui/SearchSouls.tsx` - Search with autocomplete dropdown

## Files to Update

1. `/app/[locale]/page.tsx` - Main page layout integration
2. `/components/discovery/DraggableGallery.tsx` - Add gacha-style card borders

## Key Technical Details

### Database Queries Included
- Trending souls (by message_count DESC)
- Featured premium souls (is_featured + is_premium flags)
- Search functionality (name + metadata tags)

### Styling Guidelines
- Rosé Pine theme consistency
- Responsive design (mobile, tablet, desktop breakpoints)
- Smooth animations and hover effects
- Gacha-style rarity borders with glows

### Implementation Steps
The prompt includes 6 detailed implementation steps:
1. Create Header Component
2. Create Trending Souls Section
3. Create Featured Premium Section
4. Update Explore All Souls Styling
5. Update Main Page
6. Testing & Verification

## Quality Checklist
The prompt includes a 14-point checklist covering:
- All 7 sections present
- Search functionality
- Banner dismissal persistence
- Category filtering
- Responsive design
- Theme consistency
- No TypeScript/ESLint errors
- Family-friendly content

## Turbo Mode Features
The prompt explicitly instructs the agent to:
- ✅ Execute autonomously
- ✅ NOT wait for user confirmation
- ✅ Proceed immediately
- ✅ Fix errors automatically
- ✅ Run build verification
- ✅ Report completion summary

## How to Use

### Option 1: Feed to Another Agent
Copy the entire contents of `/mnt/Data68/remrin/chat/.agent/FRONT_PAGE_REDESIGN_PROMPT.md` and provide it to your execution agent.

### Option 2: Use as Workflow
The prompt can be converted into a workflow file if needed.

### Option 3: Execute Directly
An agent with access to your codebase can execute this prompt directly.

## Notes
- All requirements from your mockup are captured
- Family-friendly requirement enforced (no boyfriend/girlfriend categories)
- Uses existing personas from database
- Maintains design consistency
- All links open chat windows correctly
- Premium souls showcase (not direct sales in this section)

## Next Steps
1. Provide this prompt to your execution agent
2. Agent will create all components
3. Agent will update main page
4. Agent will verify build succeeds
5. You review the completed implementation

---

**The prompt is ready to use! Just feed it to an agent in TURBO MODE and they'll execute the entire redesign autonomously.** 🚀
