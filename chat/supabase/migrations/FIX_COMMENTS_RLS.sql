-- Ensure Row Level Security is enabled
ALTER TABLE moment_comments ENABLE ROW LEVEL SECURITY;

-- 1. Allow EVERYONE to READ comments
DROP POLICY IF EXISTS "Anyone can read comments" ON moment_comments;
CREATE POLICY "Anyone can read comments" ON moment_comments
    FOR SELECT USING (true);

-- 2. Allow AUTHENTICATED users to INSERT comments
DROP POLICY IF EXISTS "Authenticated users can insert comments" ON moment_comments;
CREATE POLICY "Authenticated users can insert comments" ON moment_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Allow OWNERS (comment authors) to DELETE/UPDATE their own comments
DROP POLICY IF EXISTS "Users can update own comments" ON moment_comments;
CREATE POLICY "Users can update own comments" ON moment_comments
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON moment_comments;
CREATE POLICY "Users can delete own comments" ON moment_comments
    FOR DELETE USING (auth.uid() = user_id);

-- Fix for Profiles RLS (Just in case profiles aren't public)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
    ON profiles FOR SELECT USING (true);
