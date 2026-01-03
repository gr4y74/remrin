# 🚀 FRONT PAGE REDESIGN - QUICK REFERENCE

## 📋 COPY THIS PROMPT TO YOUR AGENT:

**Location**: `/mnt/Data68/remrin/chat/.agent/FRONT_PAGE_REDESIGN_PROMPT.md`

---

## 📊 WHAT GETS BUILT

### ✨ NEW Components (4)
1. `FrontPageHeader.tsx` - Complete header with banner, search, categories, buttons
2. `TrendingSoulsList.tsx` - List of trending souls with stats
3. `FeaturedPremiumRow.tsx` - Horizontal premium showcase
4. `SearchSouls.tsx` - Search with autocomplete

### 🔧 UPDATED Components (2)
1. `page.tsx` - Main page layout integration
2. `DraggableGallery.tsx` - Add gacha-style rarity borders

---

## 🎯 7 SECTIONS BREAKDOWN

| # | Section | Status | Component |
|---|---------|--------|-----------|
| 1 | Sidebar | ✅ Keep | Existing |
| 2 | Header | 🆕 New | `FrontPageHeader` |
| 3 | Featured Souls | ✅ Keep | `FeaturedCarousel` |
| 4 | Trending Souls | 🆕 New | `TrendingSoulsList` |
| 5 | Featured Premium | 🆕 New | `FeaturedPremiumRow` |
| 6 | Explore All | 🔧 Update | `DraggableGallery` |
| 7 | Footer | ✅ Keep | `Footer` |

---

## ⚡ TURBO MODE INSTRUCTIONS

**CRITICAL**: The agent MUST:
- ✅ Execute autonomously
- ✅ NOT ask for permission
- ✅ Proceed immediately
- ✅ Fix errors automatically
- ✅ Run build verification
- ✅ Report completion

---

## 🎨 KEY DESIGN ELEMENTS

### Header (Section 2)
- Blue extension banner (dismissible)
- Search bar with autocomplete
- 8 category pills (family-friendly)
- Subscribe + Login buttons

### Trending (Section 4)
- List layout (NOT cards)
- Avatar + Name + Stats + "View" button
- Top 8 by message_count

### Premium (Section 5)
- Large rectangular cards (~300x200px)
- Horizontal scroll
- Full-bleed images
- NO pricing shown

### Explore (Section 6)
- Gacha-style rarity borders:
  - 🟡 Legendary: Gold glow
  - 🟣 Epic: Purple glow
  - 🔵 Rare: Blue glow
  - ⚪ Common: Gray border

---

## 📁 SUPPORTING DOCUMENTS

1. **Main Prompt**: `FRONT_PAGE_REDESIGN_PROMPT.md` (14.5KB)
   - Complete implementation guide
   - Database queries
   - Component specs
   - Testing checklist

2. **Summary**: `FRONT_PAGE_REDESIGN_SUMMARY.md`
   - Overview and how to use
   - Next steps

3. **Mapping**: `FRONT_PAGE_MOCKUP_MAPPING.md`
   - Visual reference guide
   - Mockup → Code mapping
   - Responsive breakpoints

---

## 🔍 QUALITY GATES

Before completion, agent must verify:
- [ ] All 7 sections present
- [ ] Search works (hashtags, names, attributes)
- [ ] Banner dismissal persists
- [ ] Trending shows real data
- [ ] Premium cards scroll
- [ ] Rarity borders display
- [ ] Responsive (mobile/tablet/desktop)
- [ ] TypeScript builds cleanly
- [ ] No console errors

---

## 🎯 FAMILY-FRIENDLY REQUIREMENT

**EXCLUDE** these categories:
- ❌ Boyfriend
- ❌ Girlfriend
- ❌ Any romantic/dating categories

**INCLUDE** these categories:
- ✅ Kids
- ✅ Gaming
- ✅ Religion
- ✅ Education
- ✅ Productivity
- ✅ Entertainment
- ✅ Wellness
- ✅ Creative

---

## 📊 DATABASE REQUIREMENTS

### personas table must have:
- `visibility = 'PUBLIC'` for display
- `message_count` for trending
- `is_featured` + `is_premium` for premium section
- `metadata` JSONB with tags/category for search

---

## 🚀 READY TO EXECUTE

**Just feed the prompt to your agent and let them run!**

The agent will:
1. Create 4 new components
2. Update 2 existing files
3. Test all functionality
4. Verify build succeeds
5. Report completion

**Estimated Time**: 30-60 minutes (agent-dependent)

---

**All documents are in**: `/mnt/Data68/remrin/chat/.agent/`

**Start with**: `FRONT_PAGE_REDESIGN_PROMPT.md`

🎉 **LET'S GO!**
