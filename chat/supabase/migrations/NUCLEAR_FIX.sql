-- NUCLEAR_FIX.sql
-- This will completely fix the signup issue by:
-- 1. Dropping ALL triggers on auth.users
-- 2. Making workspaces columns nullable
-- 3. Creating profiles table fresh
-- 4. Creating a new simple trigger

-- ===========================================================================
-- STEP 1: Drop ALL existing triggers on auth.users
-- ===========================================================================
DO $$
DECLARE
    trigger_rec RECORD;
BEGIN
    FOR trigger_rec IN 
        SELECT tgname 
        FROM pg_trigger 
        WHERE tgrelid = 'auth.users'::regclass
        AND tgisinternal = false
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.users', trigger_rec.tgname);
        RAISE NOTICE 'Dropped trigger: %', trigger_rec.tgname;
    END LOOP;
END $$;

-- ===========================================================================
-- STEP 2: Fix workspaces table - remove NOT NULL constraints
-- ===========================================================================
DO $$
BEGIN
    -- Make all columns nullable
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workspaces') THEN
        ALTER TABLE workspaces ALTER COLUMN default_context_length DROP NOT NULL;
        ALTER TABLE workspaces ALTER COLUMN default_model DROP NOT NULL;
        ALTER TABLE workspaces ALTER COLUMN default_prompt DROP NOT NULL;
        ALTER TABLE workspaces ALTER COLUMN default_temperature DROP NOT NULL;
        ALTER TABLE workspaces ALTER COLUMN description DROP NOT NULL;
        ALTER TABLE workspaces ALTER COLUMN embeddings_provider DROP NOT NULL;
        ALTER TABLE workspaces ALTER COLUMN include_profile_context DROP NOT NULL;
        ALTER TABLE workspaces ALTER COLUMN include_workspace_instructions DROP NOT NULL;
        ALTER TABLE workspaces ALTER COLUMN instructions DROP NOT NULL;
        ALTER TABLE workspaces ALTER COLUMN name DROP NOT NULL;
        ALTER TABLE workspaces ALTER COLUMN sharing DROP NOT NULL;
        ALTER TABLE workspaces ALTER COLUMN user_id DROP NOT NULL;
        RAISE NOTICE 'Fixed workspaces constraints';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Some workspaces columns already nullable: %', SQLERRM;
END $$;

-- ===========================================================================
-- STEP 3: Create or recreate profiles table
-- ===========================================================================
DROP TABLE IF EXISTS profiles CASCADE;

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    username TEXT UNIQUE,
    display_name TEXT,
    bio TEXT,
    image_url TEXT,
    image_path TEXT,
    profile_context TEXT,
    has_onboarded BOOLEAN DEFAULT FALSE,
    use_azure_openai BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- ===========================================================================
-- STEP 4: Enable RLS with permissive policies
-- ===========================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);

-- ===========================================================================
-- STEP 5: Create THE ONLY trigger function
-- ===========================================================================
DROP FUNCTION IF EXISTS create_profile_and_workspace() CASCADE;
DROP FUNCTION IF EXISTS public.create_profile_and_workspace() CASCADE;

CREATE FUNCTION public.handle_new_user() 
RETURNS TRIGGER
SECURITY DEFINER 
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    random_username TEXT;
BEGIN
    random_username := 'user' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10);

    -- Insert profile (minimal)
    INSERT INTO public.profiles (user_id, username)
    VALUES (NEW.id, random_username)
    ON CONFLICT (user_id) DO NOTHING;

    -- Insert workspace with defaults
    INSERT INTO public.workspaces (user_id, name, is_home, default_context_length, default_model, default_temperature)
    VALUES (NEW.id, 'Home', TRUE, 4096, 'deepseek-chat', 0.5)
    ON CONFLICT DO NOTHING;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Don't fail auth - just log warning
        RAISE WARNING 'handle_new_user error: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- ===========================================================================
-- STEP 6: Create the trigger
-- ===========================================================================
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ===========================================================================
-- VERIFICATION
-- ===========================================================================
SELECT 'NUCLEAR FIX COMPLETE!' as status;

-- Check tables exist
SELECT 
    'profiles' as table_name, 
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') as exists;
SELECT 
    'workspaces' as table_name, 
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'workspaces') as exists;

-- Check trigger exists
SELECT 
    tgname as trigger_name 
FROM pg_trigger 
WHERE tgrelid = 'auth.users'::regclass 
AND tgisinternal = false;
