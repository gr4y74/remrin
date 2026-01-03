-- NUCLEAR OPTION - Make ALL columns in profiles nullable except id
-- This script will automatically find and fix ALL NOT NULL constraints

DO $$
DECLARE
    col_record RECORD;
BEGIN
    -- Loop through all NOT NULL columns except id, created_at, updated_at
    FOR col_record IN 
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'profiles'
          AND is_nullable = 'NO'
          AND column_name NOT IN ('id', 'created_at', 'updated_at')
    LOOP
        -- Make each column nullable
        EXECUTE format('ALTER TABLE profiles ALTER COLUMN %I DROP NOT NULL', col_record.column_name);
        RAISE NOTICE 'Made column % nullable', col_record.column_name;
    END LOOP;
END $$;

-- Add our required columns if they don't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT CHECK (char_length(bio) <= 200);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female'));

-- Show final structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    CASE WHEN is_nullable = 'NO' THEN '❌ NOT NULL' ELSE '✅ Nullable' END as status
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;
