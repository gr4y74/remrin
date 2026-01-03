-- Test queries to verify profiles table is working correctly

-- 1. Check if profiles table exists and has correct structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- 2. Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'profiles';

-- 3. Try to select from profiles (should work for authenticated users)
SELECT * FROM profiles LIMIT 5;

-- 4. Check if your user has a profile
-- Replace 'YOUR_USER_ID' with your actual user ID
SELECT * FROM profiles WHERE id = '2059bfbd-a3aa-4300-ac04-8ee379573da9';

-- 5. Try manual insert (as admin)
-- This will help us see if there's a constraint issue
INSERT INTO profiles (id, display_name, bio, gender, image_url)
VALUES (
    '2059bfbd-a3aa-4300-ac04-8ee379573da9',
    'Test User',
    'Test bio',
    'male',
    null
)
ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    bio = EXCLUDED.bio,
    gender = EXCLUDED.gender,
    image_url = EXCLUDED.image_url,
    updated_at = NOW();

-- 6. Verify the insert worked
SELECT * FROM profiles WHERE id = '2059bfbd-a3aa-4300-ac04-8ee379573da9';
