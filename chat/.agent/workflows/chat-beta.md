---
description: Agent Beta - Real-time Features (Typing Indicators, Read Receipts, Enhanced Presence)
---
# Agent Beta: Real-time Features

**Recommended LLM**: Gemini 2.5 Pro (High) - Excellent for real-time system design and Supabase Broadcast

**MODE**: TURBO - Auto-proceed with all steps. Do NOT ask for confirmation.

## Mission
Implement real-time communication features that make the chat feel alive and responsive.

## Context
- Using Supabase Realtime (Postgres Changes, Presence, Broadcast)
- Existing hooks: `/hooks/useChatRoom.ts`, `/hooks/useDirectMessages.ts`
- Design era: Windows XP / AOL 9.0 (early-mid 2000s)

## Tasks

### 1. Typing Indicators (Broadcast)
// turbo
Create `/hooks/useTypingIndicator.ts`:
```typescript
// Use Supabase Broadcast channel for ephemeral typing events
// Broadcast "typing_start" when user starts typing
// Broadcast "typing_stop" after 2 seconds of inactivity
// Listen for others' typing events
```

### 2. Update Chat UI for Typing
// turbo
Modify `ChatRoomWindow.tsx` and `IMWindow.tsx`:
- Show "User is typing..." indicator at bottom of chat
- Animate with classic "..." dots
- Style with XP-era aesthetic

### 3. Read Receipts System
// turbo
Update `direct_messages` table:
```sql
-- Add columns: read_at, delivered_at
-- Create function to mark messages as read
```

### 4. Read Receipts Hook
// turbo
Update `/hooks/useDirectMessages.ts`:
- Track which messages have been read
- Mark messages as read when IM window is focused
- Subscribe to read receipt updates

### 5. Read Receipt UI
// turbo
Update `IMWindow.tsx`:
- Show checkmarks next to messages: ✓ (sent), ✓✓ (delivered), ✓✓ (blue = read)
- Classic messenger style

### 6. Enhanced Presence System
// turbo
Create `/hooks/useEnhancedPresence.ts`:
- Track user status: Online, Away, Busy, Invisible
- Auto-set "Away" after 5 minutes of inactivity
- Allow manual status changes
- Broadcast status to buddy list subscribers

### 7. Away Messages
// turbo
Create away message system:
- Database: Add `away_message` column to user profile or chat-specific table
- UI: Modal to set away message
- Display: Show away message in Profile Card and when IM is opened

### 8. Last Seen Tracking
// turbo
Track and display "Last seen: X minutes ago" for offline users in buddy list.

## Resources
- Supabase Broadcast docs: https://supabase.com/docs/guides/realtime/broadcast
- Existing presence code in `useChatRoom.ts`

## Verification
// turbo
Run `npm run build` after all changes to verify no TypeScript errors.

## Output
When complete, update the walkthrough at:
`/home/sosu/.gemini/antigravity/brain/a2c535fd-6a7b-4bfa-90fd-2d7c9b7551ea/walkthrough.md`
