-- Migration: Add hero_image_url and storage buckets for personas
-- 1. Add hero_image_url column to personas table
ALTER TABLE personas ADD COLUMN IF NOT EXISTS hero_image_url TEXT;

-- 2. Create persona_images bucket (for avatars)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'persona_images',
    'persona_images',
    true,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 3. Create persona_hero_images bucket (for large banners)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'persona_hero_images',
    'persona_hero_images',
    true,
    10485760, -- 10MB
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 4. RLS Policies for persona_images
CREATE POLICY "Public read access on persona_images" ON storage.objects FOR SELECT USING (bucket_id = 'persona_images');

CREATE POLICY "Owners can upload persona avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'persona_images'
);

CREATE POLICY "Owners can update persona avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'persona_images'
);

CREATE POLICY "Owners can delete persona avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'persona_images'
);

-- 5. RLS Policies for persona_hero_images
CREATE POLICY "Public read access on persona_hero_images" ON storage.objects FOR SELECT USING (bucket_id = 'persona_hero_images');

CREATE POLICY "Owners can upload persona hero images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'persona_hero_images'
);

CREATE POLICY "Owners can update persona hero images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'persona_hero_images'
);

CREATE POLICY "Owners can delete persona hero images"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'persona_hero_images'
);

-- 6. Ensure persona_user_settings table exists (redundancy for 500 fixes)
CREATE TABLE IF NOT EXISTS persona_user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, persona_id)
);

-- Re-enable RLS just in case
ALTER TABLE persona_user_settings ENABLE ROW LEVEL SECURITY;

-- Re-add policies with IF NOT EXISTS logic (using DO blocks for safety)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own persona settings') THEN
        CREATE POLICY "Users can view their own persona settings" ON persona_user_settings FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create their own persona settings') THEN
        CREATE POLICY "Users can create their own persona settings" ON persona_user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own persona settings') THEN
        CREATE POLICY "Users can update their own persona settings" ON persona_user_settings FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own persona settings') THEN
        CREATE POLICY "Users can delete their own persona settings" ON persona_user_settings FOR DELETE USING (auth.uid() = user_id);
    END IF;
END
$$;
