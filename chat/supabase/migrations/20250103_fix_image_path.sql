-- Check current profiles table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- If image_path exists and is NOT NULL, we need to either:
-- 1. Make it nullable, or
-- 2. Use image_path instead of image_url

-- Option 1: Make image_path nullable (recommended)
ALTER TABLE profiles ALTER COLUMN image_path DROP NOT NULL;

-- Option 2: If image_url doesn't exist, rename image_path to image_url
-- ALTER TABLE profiles RENAME COLUMN image_path TO image_url;

-- Verify the change
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name IN ('image_path', 'image_url');
