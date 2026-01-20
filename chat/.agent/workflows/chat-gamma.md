---
description: Agent Gamma - Room System (Directory, Categories, Private Rooms, Moderation)
---
# Agent Gamma: Room System

**Recommended LLM**: Claude Sonnet 4 (Thinking) - Best for complex permission systems and moderation logic

**MODE**: TURBO - Auto-proceed with all steps. Do NOT ask for confirmation.

## Mission
Build a complete room management system with discovery, categories, privacy controls, and moderation tools.

## Context
- Existing table: `chat_rooms` (see migration file)
- Design era: Windows XP / AOL 9.0 (early-mid 2000s)
- AOL had room categories like: Romance, Sports, Entertainment, Tech, etc.

## Tasks

### 1. Enhance Room Schema
// turbo
Update `chat_rooms` table:
```sql
-- Add columns:
-- category (enum: General, Romance, Sports, Entertainment, Tech, Gaming, Music, Art, etc.)
-- is_private (boolean)
-- password_hash (text, nullable)
-- max_members (int, default 50)
-- owner_id (uuid, references auth.users)
-- description (text)
-- rules (text)
-- banner_url (text)
-- created_at, updated_at
```

### 2. Room Moderation Tables
// turbo
Create moderation infrastructure:
```sql
-- room_moderators: id, room_id, user_id, permissions (jsonb), granted_by, created_at
-- room_bans: id, room_id, user_id, reason, banned_by, expires_at, created_at
-- room_mutes: id, room_id, user_id, reason, muted_by, expires_at, created_at
```

### 3. Room Directory API
// turbo
Create `/app/api/chat/rooms/`:
- `GET /api/chat/rooms` - List public rooms with filters (category, search, sort by members)
- `GET /api/chat/rooms/[id]` - Get room details
- `POST /api/chat/rooms` - Create a room
- `PATCH /api/chat/rooms/[id]` - Update room (owner/mod only)
- `DELETE /api/chat/rooms/[id]` - Delete room (owner only)

### 4. Room Moderation API
// turbo
Create `/app/api/chat/rooms/[id]/moderation/`:
- `POST .../kick` - Kick a user from room
- `POST .../ban` - Ban a user from room
- `POST .../mute` - Mute a user in room
- `POST .../unban` - Unban a user
- `GET .../bans` - List banned users

### 5. Room Directory Component
// turbo
Create `/components/aol-chat/RoomDirectory.tsx`:
- Windows XP-style window with room browser
- Category tabs/sidebar
- Room list with: name, description, member count, lock icon if private
- Search bar
- "Create Room" button
- Preview room before joining

### 6. Create Room Modal
// turbo
Create `/components/aol-chat/CreateRoomModal.tsx`:
- Room name, description, category dropdown
- Privacy toggle (public/private)
- Password field (if private)
- Max members slider
- Create button

### 7. Room Settings Panel
// turbo
Create `/components/aol-chat/RoomSettingsPanel.tsx`:
- For room owners/mods only
- Edit room details
- Manage moderators
- View/manage bans and mutes
- Set room rules

### 8. Update ChatRoomWindow
// turbo
Enhance `/components/aol-chat/ChatRoomWindow.tsx`:
- Show room description in header
- Add "Room Info" button
- Add moderation controls for mods (right-click user menu)
- Show if room is private with lock icon
- Enforce mutes (disable input for muted users)

### 9. Password Protection Flow
// turbo
When joining a private room:
- Show password prompt modal
- Verify password server-side
- Grant temporary access token

## Resources
- Icons: `/mnt/Data68/win98_icons/windows98-icons/png`
- Existing room logic: `/hooks/useChatRoom.ts`

## Verification
// turbo
Run `npm run build` after all changes to verify no TypeScript errors.

## Output
When complete, update the walkthrough at:
`/home/sosu/.gemini/antigravity/brain/a2c535fd-6a7b-4bfa-90fd-2d7c9b7551ea/walkthrough.md`
