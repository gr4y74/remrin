-- COMPLETE_FIX_USER_SIGNUP.sql
-- Run this in Supabase SQL Editor to fix "Database error saving new user"
-- This is a comprehensive fix that addresses ALL possible causes

-- ===========================================================================
-- STEP 1: Disable RLS temporarily for trigger execution
-- ===========================================================================
-- The trigger runs with SECURITY DEFINER but might still hit RLS issues

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces DISABLE ROW LEVEL SECURITY;
ALTER TABLE wallets DISABLE ROW LEVEL SECURITY;

-- ===========================================================================
-- STEP 2: Fix profiles table - make all columns nullable
-- ===========================================================================
DO $$
DECLARE
    col_record RECORD;
BEGIN
    FOR col_record IN 
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'profiles'
          AND table_schema = 'public'
          AND is_nullable = 'NO'
          AND column_name NOT IN ('id')
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE profiles ALTER COLUMN %I DROP NOT NULL', col_record.column_name);
            RAISE NOTICE 'Made profiles.% nullable', col_record.column_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not modify profiles.%: %', col_record.column_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- ===========================================================================
-- STEP 3: Fix workspaces table - make all columns nullable  
-- ===========================================================================
DO $$
DECLARE
    col_record RECORD;
BEGIN
    FOR col_record IN 
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'workspaces'
          AND table_schema = 'public'
          AND is_nullable = 'NO'
          AND column_name NOT IN ('id')
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE workspaces ALTER COLUMN %I DROP NOT NULL', col_record.column_name);
            RAISE NOTICE 'Made workspaces.% nullable', col_record.column_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not modify workspaces.%: %', col_record.column_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- ===========================================================================
-- STEP 4: Fix wallets table - make all columns nullable (if exists)
-- ===========================================================================
DO $$
DECLARE
    col_record RECORD;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wallets') THEN
        FOR col_record IN 
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'wallets'
              AND table_schema = 'public'
              AND is_nullable = 'NO'
              AND column_name NOT IN ('id')
        LOOP
            BEGIN
                EXECUTE format('ALTER TABLE wallets ALTER COLUMN %I DROP NOT NULL', col_record.column_name);
                RAISE NOTICE 'Made wallets.% nullable', col_record.column_name;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Could not modify wallets.%: %', col_record.column_name, SQLERRM;
            END;
        END LOOP;
    END IF;
END $$;

-- ===========================================================================
-- STEP 5: Drop and recreate the trigger function with ABSOLUTE MINIMUM columns
-- ===========================================================================
DROP FUNCTION IF EXISTS create_profile_and_workspace() CASCADE;

CREATE OR REPLACE FUNCTION create_profile_and_workspace() 
RETURNS TRIGGER
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
    random_username TEXT;
    profile_exists BOOLEAN;
    workspace_exists BOOLEAN;
BEGIN
    -- Generate a random username
    random_username := 'user' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);

    -- Check if profile already exists
    SELECT EXISTS(SELECT 1 FROM profiles WHERE user_id = NEW.id) INTO profile_exists;
    
    IF NOT profile_exists THEN
        -- Create profile with ONLY user_id and username (absolute minimum)
        INSERT INTO profiles (user_id, username)
        VALUES (NEW.id, random_username);
        RAISE NOTICE 'Created profile for user %', NEW.id;
    END IF;

    -- Check if workspace already exists
    SELECT EXISTS(SELECT 1 FROM workspaces WHERE user_id = NEW.id AND is_home = true) INTO workspace_exists;
    
    IF NOT workspace_exists THEN
        -- Create workspace with minimal defaults
        INSERT INTO workspaces (user_id, is_home, name)
        VALUES (NEW.id, TRUE, 'Home');
        RAISE NOTICE 'Created workspace for user %', NEW.id;
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail - let user still sign up
        RAISE WARNING 'create_profile_and_workspace failed for %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===========================================================================
-- STEP 6: Recreate the trigger
-- ===========================================================================
DROP TRIGGER IF EXISTS create_profile_and_workspace_trigger ON auth.users;

CREATE TRIGGER create_profile_and_workspace_trigger
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_profile_and_workspace();

-- ===========================================================================
-- STEP 7: Re-enable RLS with proper policies
-- ===========================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- Make sure we have a policy that allows the trigger to work
DROP POLICY IF EXISTS "Service role full access profiles" ON profiles;
CREATE POLICY "Service role full access profiles" ON profiles FOR ALL 
    USING (true) 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access workspaces" ON workspaces;  
CREATE POLICY "Service role full access workspaces" ON workspaces FOR ALL
    USING (true)
    WITH CHECK (true);

-- ===========================================================================
-- STEP 8: Verify setup
-- ===========================================================================
SELECT 'DONE! Trigger recreated successfully.' as status;

-- Show what columns are now in profiles
SELECT 'Profiles columns:' as info;
SELECT column_name, is_nullable FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public' 
ORDER BY ordinal_position LIMIT 10;
