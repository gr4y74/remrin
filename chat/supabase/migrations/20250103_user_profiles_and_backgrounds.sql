-- ═══════════════════════════════════════════════════════════════
-- USER PROFILES & BACKGROUNDS SYSTEM
-- Migration: 20250103_user_profiles_and_backgrounds.sql
-- ═══════════════════════════════════════════════════════════════

-- ============================================================
-- 1. PROFILES TABLE (if not exists)
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    bio TEXT CHECK (char_length(bio) <= 200),
    gender TEXT CHECK (gender IN ('male', 'female')),
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE profiles IS 'User profiles with display name, bio, and preferences';
COMMENT ON COLUMN profiles.display_name IS 'User chosen display name (max 50 chars)';
COMMENT ON COLUMN profiles.bio IS 'User bio/intro (max 200 chars)';
COMMENT ON COLUMN profiles.gender IS 'User gender preference (male/female)';
COMMENT ON COLUMN profiles.image_url IS 'URL to user avatar image';

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_display_name ON profiles(display_name);

-- ============================================================
-- 2. STORAGE BUCKETS
-- ============================================================

-- Avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- User backgrounds bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'user_backgrounds',
    'user_backgrounds',
    true,
    10485760, -- 10MB
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- ============================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view all profiles
CREATE POLICY IF NOT EXISTS "Public profiles are viewable by everyone"
ON profiles FOR SELECT
TO public
USING (true);

-- Users can insert their own profile
CREATE POLICY IF NOT EXISTS "Users can insert own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY IF NOT EXISTS "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Users can delete their own profile
CREATE POLICY IF NOT EXISTS "Users can delete own profile"
ON profiles FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- ============================================================
-- 4. STORAGE POLICIES - AVATARS
-- ============================================================

-- Anyone can view avatars (public bucket)
CREATE POLICY IF NOT EXISTS "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Users can upload their own avatar
CREATE POLICY IF NOT EXISTS "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update their own avatar
CREATE POLICY IF NOT EXISTS "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own avatar
CREATE POLICY IF NOT EXISTS "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================
-- 5. STORAGE POLICIES - USER BACKGROUNDS
-- ============================================================

-- Anyone can view backgrounds (public bucket)
CREATE POLICY IF NOT EXISTS "Background images are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user_backgrounds');

-- Users can upload their own backgrounds
CREATE POLICY IF NOT EXISTS "Users can upload own backgrounds"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'user_backgrounds' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update their own backgrounds
CREATE POLICY IF NOT EXISTS "Users can update own backgrounds"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'user_backgrounds' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own backgrounds
CREATE POLICY IF NOT EXISTS "Users can delete own backgrounds"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'user_backgrounds' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================
-- 6. TRIGGERS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_profiles_updated_at ON profiles;
CREATE TRIGGER trigger_update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_profiles_updated_at();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION create_profile_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, display_name, created_at, updated_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_create_profile_on_signup ON auth.users;
CREATE TRIGGER trigger_create_profile_on_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_profile_for_new_user();

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Check profiles table exists
-- SELECT COUNT(*) FROM profiles;

-- Check storage buckets exist
-- SELECT id, name, public, file_size_limit FROM storage.buckets WHERE id IN ('avatars', 'user_backgrounds');

-- Check RLS policies
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename = 'profiles';

-- ═══════════════════════════════════════════════════════════════
-- DONE! User profiles and backgrounds system is ready.
-- ═══════════════════════════════════════════════════════════════
