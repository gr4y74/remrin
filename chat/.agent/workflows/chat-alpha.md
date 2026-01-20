---
description: Agent Alpha - Core Social Infrastructure (Buddy Lists, Blocking, Profiles)
---
# Agent Alpha: Core Social Infrastructure

**Recommended LLM**: Claude Sonnet 4 (Thinking) - Best for complex database schema and RLS policy design

**MODE**: TURBO - Auto-proceed with all steps. Do NOT ask for confirmation.

## Mission
Build the complete social infrastructure for the Remrin Chat system, including persistent buddy lists, user blocking, and profile integration.

## Context
- This is part of a Windows XP / AOL 9.0 era chat application rebuild
- Backend: Supabase (Postgres, Realtime, Auth, RLS)
- Frontend: Next.js 14, React, Tailwind CSS
- Existing schema: See `/mnt/Data68/remrin/chat/supabase/migrations/20260120_aol_chat_schema.sql`

## Tasks

### 1. Buddy List Database Schema
// turbo
Create or update migration file for buddy lists:
```sql
-- buddy_lists table (if not exists, enhance it)
-- Columns: id, user_id, buddy_user_id, nickname, group_name, created_at
-- Add: is_favorite, notes, added_from (room_id or direct)
```

### 2. User Blocking System
// turbo
Create blocking infrastructure:
```sql
-- blocked_users table
-- Columns: id, blocker_id, blocked_id, reason, created_at
-- RLS: Users can only see/modify their own blocks
```

### 3. Buddy List API Endpoints
// turbo
Create API routes in `/app/api/chat/buddies/`:
- `GET /api/chat/buddies` - List all buddies with online status
- `POST /api/chat/buddies` - Add a buddy
- `DELETE /api/chat/buddies/[id]` - Remove a buddy
- `PATCH /api/chat/buddies/[id]` - Update nickname/group

### 4. Blocking API Endpoints
// turbo
Create API routes in `/app/api/chat/block/`:
- `GET /api/chat/block` - List blocked users
- `POST /api/chat/block` - Block a user
- `DELETE /api/chat/block/[id]` - Unblock a user

### 5. Update BuddyListWindow Component
// turbo
Modify `/components/aol-chat/BuddyListWindow.tsx`:
- Fetch real buddies from API instead of mock data
- Add "Add Buddy" modal with username search
- Add "Remove Buddy" confirmation
- Add "Block User" option in context menu
- Show real online/offline status from Presence

### 6. Create useBuddyList Hook
// turbo
Create `/hooks/useBuddyList.ts`:
- Fetch buddies on mount
- Subscribe to presence for online status
- Provide add/remove/block functions
- Cache buddy list in state

### 7. Profile Card Component
// turbo
Create `/components/aol-chat/ProfileCard.tsx`:
- Windows XP-style "Get Info" card
- Shows: username, avatar, bio, member since, mutual buddies
- Action buttons: Add Buddy, Send IM, Block

## Resources
- Icons: `/mnt/Data68/win98_icons/windows98-icons/png`
- Existing components: `/components/aol-chat/`

## Verification
// turbo
Run `npm run build` after all changes to verify no TypeScript errors.

## Output
When complete, update the walkthrough at:
`/home/sosu/.gemini/antigravity/brain/a2c535fd-6a7b-4bfa-90fd-2d7c9b7551ea/walkthrough.md`
