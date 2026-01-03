-- COMPREHENSIVE FIX FOR PROFILES TABLE
-- Run this entire script in Supabase SQL Editor

-- Step 1: Check current structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Step 2: Make image_path nullable if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'image_path'
    ) THEN
        ALTER TABLE profiles ALTER COLUMN image_path DROP NOT NULL;
        RAISE NOTICE 'Made image_path nullable';
    END IF;
END $$;

-- Step 3: Add image_url column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'image_url'
    ) THEN
        ALTER TABLE profiles ADD COLUMN image_url TEXT;
        RAISE NOTICE 'Added image_url column';
    END IF;
END $$;

-- Step 4: Add bio column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'bio'
    ) THEN
        ALTER TABLE profiles ADD COLUMN bio TEXT CHECK (char_length(bio) <= 200);
        RAISE NOTICE 'Added bio column';
    END IF;
END $$;

-- Step 5: Add gender column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'gender'
    ) THEN
        ALTER TABLE profiles ADD COLUMN gender TEXT CHECK (gender IN ('male', 'female'));
        RAISE NOTICE 'Added gender column';
    END IF;
END $$;

-- Step 6: Verify final structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;
