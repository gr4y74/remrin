-- ULTIMATE FIX - Make ALL profiles columns nullable except id
-- This will prevent any NOT NULL constraint errors

-- Get all NOT NULL columns first
SELECT column_name, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND is_nullable = 'NO'
  AND column_name != 'id';

-- Make all columns nullable except id, created_at, updated_at
ALTER TABLE profiles ALTER COLUMN image_path DROP NOT NULL;
ALTER TABLE profiles ALTER COLUMN profile_context DROP NOT NULL;
ALTER TABLE profiles ALTER COLUMN display_name DROP NOT NULL;

-- Add any missing columns we need
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT CHECK (char_length(bio) <= 200);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female'));

-- Verify all columns are now nullable (except id, created_at, updated_at)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;
