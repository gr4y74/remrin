-- ============================================================
-- MOMENTS VIDEO & REACTIONS MIGRATION
-- Apply this SQL in Supabase SQL Editor
-- ============================================================

-- Step 1: Add video support columns to moments table
ALTER TABLE moments 
ADD COLUMN IF NOT EXISTS media_type VARCHAR(10) DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS duration_seconds INTEGER,
ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reactions_summary JSONB DEFAULT '{}';

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_moments_media_type ON moments(media_type);
CREATE INDEX IF NOT EXISTS idx_moments_created_by_user ON moments(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_moments_view_count ON moments(view_count DESC);

-- Step 3: Create moment_reactions table (if not exists)
CREATE TABLE IF NOT EXISTS moment_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moment_id UUID NOT NULL REFERENCES moments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reaction_emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(moment_id, user_id, reaction_emoji)
);

-- Step 4: Create indexes for reactions
CREATE INDEX IF NOT EXISTS idx_moment_reactions_moment_id ON moment_reactions(moment_id);
CREATE INDEX IF NOT EXISTS idx_moment_reactions_user_id ON moment_reactions(user_id);

-- Step 5: Enable RLS on reactions table
ALTER TABLE moment_reactions ENABLE ROW LEVEL SECURITY;

-- Step 6: Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view reactions" ON moment_reactions;
DROP POLICY IF EXISTS "Authenticated users can add reactions" ON moment_reactions;
DROP POLICY IF EXISTS "Users can remove their own reactions" ON moment_reactions;

-- Step 7: Create RLS policies for reactions
CREATE POLICY "Anyone can view reactions"
ON moment_reactions FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can add reactions"
ON moment_reactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own reactions"
ON moment_reactions FOR DELETE
USING (auth.uid() = user_id);

-- Step 8: Create function to update reaction counts
CREATE OR REPLACE FUNCTION update_moment_reactions_summary()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE moments
    SET reactions_summary = (
        SELECT COALESCE(jsonb_object_agg(reaction_emoji, count), '{}'::jsonb)
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

-- Step 9: Create trigger for reaction counts
DROP TRIGGER IF EXISTS trigger_update_moment_reactions ON moment_reactions;
CREATE TRIGGER trigger_update_moment_reactions
AFTER INSERT OR DELETE ON moment_reactions
FOR EACH ROW
EXECUTE FUNCTION update_moment_reactions_summary();

-- Step 10: Update existing moments to have empty reactions_summary
UPDATE moments SET reactions_summary = '{}' WHERE reactions_summary IS NULL;

-- Step 11: Create storage buckets for videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'moment-videos',
    'moment-videos',
    true,
    524288000,
    ARRAY['video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- Step 12: Create storage bucket for thumbnails
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'moment-thumbnails',
    'moment-thumbnails',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Step 13: Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Anyone can view moment videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload moment videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own moment videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own moment videos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view moment thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload moment thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own moment thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own moment thumbnails" ON storage.objects;

-- Step 14: Create RLS policies for moment-videos bucket
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

-- Step 15: Create RLS policies for moment-thumbnails bucket
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

-- ============================================================
-- MIGRATION COMPLETE
-- Run: npm run verify-moments-schema
-- ============================================================
