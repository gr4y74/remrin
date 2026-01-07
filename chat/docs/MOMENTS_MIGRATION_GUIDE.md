# Moments Video & Reactions Migration Guide

## Overview
This guide explains how to apply the database migrations for video support and reactions system.

## Migration Files Created
1. `supabase/migrations/20260107_moments_video_reactions.sql` - Adds video support and reactions
2. `supabase/migrations/20260107_moments_storage_buckets.sql` - Creates storage buckets

## Manual Application Steps

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://wftsctqfiqbdyllxwagi.supabase.co
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the contents of `supabase/migrations/20260107_moments_video_reactions.sql`
5. Click **Run**
6. Repeat for `supabase/migrations/20260107_moments_storage_buckets.sql`

### Option 2: Using psql

If you have the database connection string:

```bash
psql "postgresql://postgres:[PASSWORD]@db.wftsctqfiqbdyllxwagi.supabase.co:5432/postgres" \
  -f supabase/migrations/20260107_moments_video_reactions.sql

psql "postgresql://postgres:[PASSWORD]@db.wftsctqfiqbdyllxwagi.supabase.co:5432/postgres" \
  -f supabase/migrations/20260107_moments_storage_buckets.sql
```

## What Gets Created

### Database Schema Changes

#### moments table (new columns):
- `media_type` - VARCHAR(10) - 'image' or 'video'
- `video_url` - TEXT - URL to video file
- `thumbnail_url` - TEXT - URL to video thumbnail
- `duration_seconds` - INTEGER - Video duration
- `created_by_user_id` - UUID - User who created the moment
- `view_count` - INTEGER - Number of views
- `reactions_summary` - JSONB - Denormalized reaction counts

#### moment_reactions table (new):
- `id` - UUID PRIMARY KEY
- `moment_id` - UUID - References moments(id)
- `user_id` - UUID - References auth.users(id)
- `reaction_emoji` - VARCHAR(10) - Emoji character
- `created_at` - TIMESTAMP

### Storage Buckets

1. **moment-videos**
   - Public: Yes
   - Size limit: 500MB
   - Allowed types: video/mp4, video/webm, video/quicktime

2. **moment-thumbnails**
   - Public: Yes
   - Size limit: 5MB
   - Allowed types: image/jpeg, image/png, image/webp

### RLS Policies

#### moment_reactions:
- Anyone can view reactions
- Authenticated users can add reactions
- Users can remove their own reactions

#### Storage buckets:
- Anyone can view videos/thumbnails
- Authenticated users can upload
- Users can update/delete their own files

### Indexes Created
- `idx_moment_reactions_moment_id` - For fast reaction lookups
- `idx_moment_reactions_user_id` - For user reaction queries
- `idx_moments_media_type` - For filtering by media type
- `idx_moments_created_by_user` - For user's moments
- `idx_moments_view_count` - For sorting by popularity

### Triggers
- `trigger_update_moment_reactions` - Auto-updates reactions_summary when reactions change

## Verification

After applying migrations, run:

```bash
npm run verify-moments-schema
```

This will check:
- ✅ All columns exist
- ✅ Storage buckets are created
- ✅ RLS policies are in place
- ✅ Indexes are created
- ✅ Triggers are functioning

## Rollback

If you need to rollback:

```sql
-- Remove new columns
ALTER TABLE moments 
DROP COLUMN IF EXISTS media_type,
DROP COLUMN IF EXISTS video_url,
DROP COLUMN IF EXISTS thumbnail_url,
DROP COLUMN IF EXISTS duration_seconds,
DROP COLUMN IF EXISTS created_by_user_id,
DROP COLUMN IF EXISTS view_count,
DROP COLUMN IF EXISTS reactions_summary;

-- Drop reactions table
DROP TABLE IF EXISTS moment_reactions CASCADE;

-- Drop storage buckets
DELETE FROM storage.buckets WHERE id IN ('moment-videos', 'moment-thumbnails');
```

## Next Steps

After migrations are applied:
1. ✅ TypeScript types are already created in `types/moments.ts`
2. 🔄 AGENT 2 can start building the API endpoints
3. 🔄 AGENT 3 can start building the UI components
