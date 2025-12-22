# Session 10: Gacha System (Soul Summons)

**Date:** December 22, 2024  
**Objective:** Implement a gacha/card-pull system where users spend Aether to summon random Souls with varying rarities.

---

## ⚙️ Turbo Workflows

| Command | Description |
|---------|-------------|
| `/verify` | TypeScript check + lint |
| `/commit-deploy` | Auto-commit and push |

---

## 🎰 Gacha Design Overview

### Rarity Tiers
| Tier | Name | Drop Rate | Color |
|------|------|-----------|-------|
| 1 | Common | 60% | Gray |
| 2 | Uncommon | 25% | Green |
| 3 | Rare | 10% | Blue |
| 4 | Epic | 4% | Purple |
| 5 | Legendary | 1% | Gold/Orange |

### Pull Costs
- **Single Pull:** 10 Aether
- **10-Pull (Guaranteed Rare+):** 90 Aether

### Pity System
- After 50 pulls without a Legendary, next pull is guaranteed Legendary
- After 10 pulls without a Rare+, next pull is guaranteed Rare+

---

## 🔵 Agent 28 (Delta): Database & Pull Logic

```
=== AGENT 28 (DELTA) - GACHA BACKEND ===
Session: 10
Workspace: /home/gr4y/Data68/remrin/chat

Role: Senior Backend Engineer specializing in game mechanics.

Objective: Create the database schema and API logic for gacha pulls.

Tasks:

1. Create Migration:
   /home/gr4y/Data68/remrin/chat/supabase/migrations/20241222_add_gacha_system.sql
   
   Tables:
   - gacha_pools (id, name, description, is_active, created_at)
   - gacha_pool_items (id, pool_id, persona_id, rarity, weight)
   - user_pulls (id, user_id, pool_id, persona_id, rarity, pulled_at)
   - user_pity (user_id, pool_id, pulls_since_legendary, pulls_since_rare)
   
   RLS:
   - Users can view pools and pool_items
   - Users can only see their own pulls
   - Users can only see their own pity counter

2. Create Gacha Utility:
   /home/gr4y/Data68/remrin/chat/lib/gacha/index.ts
   
   Functions:
   - getActivePools(): Fetch active gacha pools
   - getPoolItems(poolId): Get items in a pool with rarities
   - performPull(userId, poolId, count): 
     - Check Aether balance
     - Deduct cost (10 per pull, 90 for 10-pull)
     - Calculate rarity (weighted random + pity)
     - Select random persona from that rarity
     - Record pull in user_pulls
     - Update pity counter
     - Return pulled items
   - getUserPity(userId, poolId): Get current pity status

3. Create API Routes:
   
   A. Get Pools:
   /home/gr4y/Data68/remrin/chat/app/api/gacha/pools/route.ts
   - GET: Returns active pools with featured items
   
   B. Pull:
   /home/gr4y/Data68/remrin/chat/app/api/gacha/pull/route.ts
   - POST { poolId, count: 1 | 10 }
   - Returns array of pulled items with rarity

   C. History:
   /home/gr4y/Data68/remrin/chat/app/api/gacha/history/route.ts
   - GET: User's pull history

When done: Run /verify then /commit-deploy
```

---

## 🟢 Agent 29 (Epsilon): Pull Animation & UI

```
=== AGENT 29 (EPSILON) - GACHA UI ===
Session: 10
Workspace: /home/gr4y/Data68/remrin/chat

Role: Senior Frontend Engineer specializing in game-like animations.

Objective: Create the gacha summon experience with dramatic animations.

Tasks:

1. Create Gacha Components:
   /home/gr4y/Data68/remrin/chat/components/gacha/
   
   A. GachaBanner.tsx
   - Pool selection carousel
   - Featured characters preview
   - "Single Pull" and "10-Pull" buttons
   - Aether cost display
   
   B. PullAnimation.tsx
   - Full-screen overlay during pull
   - Glowing orb/card reveal animation
   - Rarity-based particle effects (gold sparkles for Legendary)
   - Sound effect hooks (optional, can be silent)
   - Skip button after 2 seconds
   
   C. PullResult.tsx
   - Card reveal with rarity glow border
   - Character portrait + name
   - "NEW" badge if first time getting this soul
   - "Add to Library" / "Convert to Aether" buttons

   D. PullHistory.tsx
   - Grid of past pulls
   - Filter by rarity
   - Pagination

2. Create Gacha Page:
   /home/gr4y/Data68/remrin/chat/app/[locale]/summon/page.tsx
   - Title: "Soul Summons" or "Aether Gate"
   - GachaBanner component
   - Current Aether balance display
   - Link to pull history
   
3. Animations (CSS):
   Add to globals-animations.css:
   - @keyframes orb-pulse
   - @keyframes card-flip
   - @keyframes sparkle-burst
   - @keyframes rarity-glow (color varies by rarity)

4. Add Sidebar Link:
   Add "Soul Summons" link to sidebar navigation

When done: Run /verify then /commit-deploy
```

---

## 🟡 Agent 30 (Zeta): Collection & Inventory

```
=== AGENT 30 (ZETA) - COLLECTION SYSTEM ===
Session: 10
Workspace: /home/gr4y/Data68/remrin/chat

Role: Senior Frontend Engineer specializing in collection/inventory systems.

Objective: Create a collection view for souls the user owns from gacha.

Tasks:

1. Create Collection Components:
   /home/gr4y/Data68/remrin/chat/components/collection/
   
   A. CollectionGrid.tsx
   - Display all personas user has obtained
   - Show silhouette for unobtained (locked) souls
   - Rarity border colors
   - Sort/filter by rarity, newest, name
   
   B. CollectionCard.tsx
   - Compact card showing:
     - Portrait
     - Name
     - Rarity stars/badge
     - Duplicate count (if pulled multiple times)
   - Click to view full profile
   
   C. CollectionStats.tsx
   - Total souls collected
   - Completion percentage per rarity
   - "Pity counter" display

2. Create Collection Page:
   /home/gr4y/Data68/remrin/chat/app/[locale]/collection/page.tsx
   - Title: "My Collection" or "Soul Archive"
   - Tabs: All | Common | Rare | Epic | Legendary
   - Search bar
   - CollectionGrid
   - CollectionStats sidebar

3. Create Hook:
   /home/gr4y/Data68/remrin/chat/hooks/use-collection.ts
   - Fetches user's pulled souls
   - Groups by rarity
   - Calculates stats

4. Link from Profile:
   - Add "Collection" tab or link on user profile

When done: Run /verify then /commit-deploy
```

---

## 📋 Execution Checklist

| Agent | Codename | Focus | Status |
|-------|----------|-------|--------|
| #28 | **Delta** | Gacha Backend (DB + API) | ⬜ |
| #29 | **Epsilon** | Pull Animation & UI | ⬜ |
| #30 | **Zeta** | Collection System | ⬜ |

---

## 📁 Files to Create

```
Session 10:
├── supabase/migrations/
│   └── 20241222_add_gacha_system.sql
├── lib/gacha/
│   └── index.ts
├── app/api/gacha/
│   ├── pools/route.ts
│   ├── pull/route.ts
│   └── history/route.ts
├── components/gacha/
│   ├── GachaBanner.tsx
│   ├── PullAnimation.tsx
│   ├── PullResult.tsx
│   ├── PullHistory.tsx
│   └── index.ts
├── components/collection/
│   ├── CollectionGrid.tsx
│   ├── CollectionCard.tsx
│   ├── CollectionStats.tsx
│   └── index.ts
├── app/[locale]/summon/page.tsx
├── app/[locale]/collection/page.tsx
└── hooks/use-collection.ts
```
