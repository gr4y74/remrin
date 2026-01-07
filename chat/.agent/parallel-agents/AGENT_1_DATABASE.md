# AGENT 1: Database & Storage Infrastructure

## Mission
Implement complete database schema and storage infrastructure for video-based moments with reactions system.

## Context
- Project: Remrin.ai chat application
- Location: `/mnt/Data68/remrin/chat`
- Database: Supabase (PostgreSQL)
- Current: Image-only moments system exists
- Goal: Add video support + reactions + user attribution

## Tasks

### 1. Create Migration File
Create: `/mnt/Data68/remrin/chat/supabase/migrations/20260107_moments_video_reactions.sql`

```sql
-- Add video support to moments table
ALTER TABLE moments 
ADD COLUMN IF NOT EXISTS media_type VARCHAR(10) DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS duration_seconds INTEGER,
ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Create reactions table
CREATE TABLE IF NOT EXISTS moment_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moment_id UUID NOT NULL REFERENCES moments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reaction_emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(moment_id, user_id, reaction_emoji)
);

-- Add reaction counts to moments (denormalized for performance)
ALTER TABLE moments
ADD COLUMN IF NOT EXISTS reactions_summary JSONB DEFAULT '{}';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_moment_reactions_moment_id ON moment_reactions(moment_id);
CREATE INDEX IF NOT EXISTS idx_moment_reactions_user_id ON moment_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_moments_media_type ON moments(media_type);
CREATE INDEX IF NOT EXISTS idx_moments_created_by_user ON moments(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_moments_view_count ON moments(view_count DESC);

-- RLS Policies for reactions
ALTER TABLE moment_reactions ENABLE ROW LEVEL SECURITY;

-- Anyone can view reactions
CREATE POLICY "Anyone can view reactions"
ON moment_reactions FOR SELECT
USING (true);

-- Authenticated users can add reactions
CREATE POLICY "Authenticated users can add reactions"
ON moment_reactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can remove their own reactions
CREATE POLICY "Users can remove their own reactions"
ON moment_reactions FOR DELETE
USING (auth.uid() = user_id);

-- Function to update reaction counts
CREATE OR REPLACE FUNCTION update_moment_reactions_summary()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculate reactions summary for the affected moment
    UPDATE moments
    SET reactions_summary = (
        SELECT jsonb_object_agg(reaction_emoji, count)
        FROM (
            SELECT reaction_emoji, COUNT(*)::int as count
            FROM moment_reactions
            WHERE moment_id = COALESCE(NEW.moment_id, OLD.moment_id)
            GROUP BY reaction_emoji
        ) reactions
    )
    WHERE id = COALESCE(NEW.moment_id, OLD.moment_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update reaction counts
DROP TRIGGER IF EXISTS trigger_update_moment_reactions ON moment_reactions;
CREATE TRIGGER trigger_update_moment_reactions
AFTER INSERT OR DELETE ON moment_reactions
FOR EACH ROW
EXECUTE FUNCTION update_moment_reactions_summary();

-- Update existing moments to have empty reactions_summary
UPDATE moments SET reactions_summary = '{}' WHERE reactions_summary IS NULL;

COMMENT ON TABLE moment_reactions IS 'Emoji reactions on moments (like Discord reactions)';
COMMENT ON COLUMN moments.media_type IS 'Type of media: image or video';
COMMENT ON COLUMN moments.video_url IS 'URL to video file in storage';
COMMENT ON COLUMN moments.thumbnail_url IS 'URL to video thumbnail image';
COMMENT ON COLUMN moments.duration_seconds IS 'Video duration in seconds';
COMMENT ON COLUMN moments.reactions_summary IS 'Denormalized reaction counts as JSON {emoji: count}';
```

### 2. Create Storage Buckets
Create: `/mnt/Data68/remrin/chat/supabase/migrations/20260107_moments_storage_buckets.sql`

```sql
-- Create storage bucket for moment videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'moment-videos',
    'moment-videos',
    true,
    524288000, -- 500MB limit
    ARRAY['video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for video thumbnails
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'moment-thumbnails',
    'moment-thumbnails',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS for moment-videos bucket
CREATE POLICY "Anyone can view moment videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'moment-videos');

CREATE POLICY "Authenticated users can upload moment videos"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'moment-videos' 
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own moment videos"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'moment-videos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own moment videos"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'moment-videos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS for moment-thumbnails bucket
CREATE POLICY "Anyone can view moment thumbnails"
ON storage.objects FOR SELECT
USING (bucket_id = 'moment-thumbnails');

CREATE POLICY "Authenticated users can upload moment thumbnails"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'moment-thumbnails' 
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own moment thumbnails"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'moment-thumbnails' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own moment thumbnails"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'moment-thumbnails' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### 3. Update TypeScript Types
Update: `/mnt/Data68/remrin/chat/types/moments.ts` (create if doesn't exist)

```typescript
export type MediaType = 'image' | 'video'

export interface Moment {
  id: string
  persona_id: string
  created_by_user_id: string | null
  media_type: MediaType
  image_url: string | null
  video_url: string | null
  thumbnail_url: string | null
  duration_seconds: number | null
  caption: string | null
  created_at: string
  likes_count: number
  view_count: number
  is_pinned: boolean
  reactions_summary: Record<string, number>
}

export interface MomentReaction {
  id: string
  moment_id: string
  user_id: string
  reaction_emoji: string
  created_at: string
}

export interface MomentWithPersona extends Moment {
  persona: {
    id: string
    name: string
    image_url: string | null
  }
  created_by?: {
    id: string
    username: string
    image_url: string | null
  }
}
```

### 4. Test Migrations
Run migrations and verify:
```bash
# From /mnt/Data68/remrin/chat
npx supabase db push
npx supabase db reset # if needed
```

## Deliverables
1. ✅ Migration files created and tested
2. ✅ Storage buckets configured
3. ✅ RLS policies working
4. ✅ TypeScript types defined
5. ✅ Triggers functioning correctly

## Success Criteria
- [ ] Can insert video moments with all new fields
- [ ] Can add/remove reactions
- [ ] Reaction counts update automatically
- [ ] Storage buckets accept video uploads
- [ ] RLS prevents unauthorized access

## Dependencies
None - this agent can start immediately

## Handoff
Once complete, notify AGENT 2 (API) and AGENT 3 (Components) that database is ready.
