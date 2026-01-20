---
description: Agent Epsilon - Admin Panel Backend (Room & User Management, Moderation Dashboard)
---
# Agent Epsilon: Admin Panel Backend

**Recommended LLM**: Claude Sonnet 4 (Thinking) - Best for admin systems, complex queries, and security

**MODE**: TURBO - Auto-proceed with all steps. Do NOT ask for confirmation.

## Mission
Build a comprehensive admin backend for managing the chat system, including rooms, users, and moderation tools.

## Context
- Existing admin routes: `/app/api/admin/`
- Admin UI pattern: Check existing admin pages for consistency
- Must integrate with existing Remrin admin panel

## Tasks

### 1. Chat Admin API Routes
// turbo
Create `/app/api/admin/chat/`:

#### Rooms Management
- `GET /api/admin/chat/rooms` - List all rooms with stats (members, messages, reports)
- `GET /api/admin/chat/rooms/[id]` - Room details with recent activity
- `PATCH /api/admin/chat/rooms/[id]` - Update room settings
- `DELETE /api/admin/chat/rooms/[id]` - Delete room and all messages
- `POST /api/admin/chat/rooms/[id]/feature` - Feature a room on directory
- `POST /api/admin/chat/rooms/[id]/close` - Close room (no new messages)

#### Users Management
- `GET /api/admin/chat/users` - List users with chat stats
- `GET /api/admin/chat/users/[id]` - User chat profile (rooms joined, messages sent, reports)
- `POST /api/admin/chat/users/[id]/ban` - Global chat ban
- `POST /api/admin/chat/users/[id]/unban` - Remove global ban
- `POST /api/admin/chat/users/[id]/mute` - Global mute

#### Moderation
- `GET /api/admin/chat/reports` - List all reports
- `PATCH /api/admin/chat/reports/[id]` - Update report status
- `GET /api/admin/chat/messages` - Search messages (for moderation)
- `DELETE /api/admin/chat/messages/[id]` - Delete a message

### 2. Reports System Schema
// turbo
Create migration for reports:
```sql
-- chat_reports table
-- Columns: id, reporter_id, reported_user_id, room_id, message_id, reason, details, status, resolved_by, resolved_at, created_at
-- status enum: pending, reviewed, actioned, dismissed
```

### 3. Analytics Tables
// turbo
Create analytics tracking:
```sql
-- chat_analytics table (aggregate stats)
-- Columns: date, total_messages, active_users, new_rooms, reports_filed
-- 
-- chat_room_stats table (per-room stats)
-- Columns: room_id, date, message_count, unique_users, peak_concurrent
```

### 4. Admin Dashboard API
// turbo
Create `/app/api/admin/chat/dashboard`:
- Total active rooms
- Total online users (now)
- Messages sent (today, week, month)
- Top rooms by activity
- Recent reports
- Trending keywords (optional)

### 5. Admin UI Components
// turbo
Create admin components in `/components/admin/chat/`:

#### ChatDashboard.tsx
- Overview cards (rooms, users, messages, reports)
- Activity chart (messages over time)
- Quick actions

#### RoomManagement.tsx
- Paginated room table
- Search/filter
- Bulk actions
- Room details modal

#### UserManagement.tsx  
- Paginated user table
- Search by username
- View chat history
- Ban/mute actions

#### ReportsQueue.tsx
- List of pending reports
- Report details panel
- Action buttons (warn, mute, ban, dismiss)
- Bulk resolve

#### MessageSearch.tsx
- Search messages by content, user, room, date range
- Results with context
- Delete/flag actions

### 6. Admin Routes (Pages)
// turbo
Create admin pages in `/app/[locale]/admin/chat/`:
- `page.tsx` - Dashboard
- `rooms/page.tsx` - Room management
- `users/page.tsx` - User management
- `reports/page.tsx` - Reports queue
- `messages/page.tsx` - Message search

### 7. Settings Management
// turbo
Create `/app/api/admin/chat/settings`:
- GET/PUT for chat system settings:
  - Max message length
  - Rate limits
  - Allowed file types
  - Profanity filter level
  - Auto-moderation rules

### 8. Audit Logging
// turbo
Create audit log for admin actions:
```sql
-- chat_admin_logs table
-- Columns: id, admin_id, action, target_type, target_id, details, created_at
```
Log all admin actions for accountability.

## Resources
- Existing admin patterns: `/app/[locale]/admin/`
- Existing API patterns: `/app/api/admin/`

## Verification
// turbo
Run `npm run build` after all changes to verify no TypeScript errors.

## Output
When complete, update the walkthrough at:
`/home/sosu/.gemini/antigravity/brain/a2c535fd-6a7b-4bfa-90fd-2d7c9b7551ea/walkthrough.md`
