-- CREATE_MISSING_TABLES.sql
-- Run this in Supabase SQL Editor
-- The profiles table does not exist - we need to create it

-- ===========================================================================
-- STEP 1: Create the profiles table
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    -- ID
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- RELATIONSHIPS
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- METADATA
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    
    -- CORE FIELDS (all nullable for easy creation)
    username TEXT UNIQUE,
    display_name TEXT,
    bio TEXT,
    image_url TEXT,
    image_path TEXT,
    profile_context TEXT,
    has_onboarded BOOLEAN DEFAULT FALSE,
    use_azure_openai BOOLEAN DEFAULT FALSE,
    
    -- API KEYS (all optional)
    anthropic_api_key TEXT,
    azure_openai_api_key TEXT,
    azure_openai_endpoint TEXT,
    azure_openai_35_turbo_id TEXT,
    azure_openai_45_turbo_id TEXT,
    azure_openai_45_vision_id TEXT,
    azure_openai_embeddings_id TEXT,
    google_gemini_api_key TEXT,
    mistral_api_key TEXT,
    openai_api_key TEXT,
    openai_organization_id TEXT,
    perplexity_api_key TEXT,
    groq_api_key TEXT,
    openrouter_api_key TEXT
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- ===========================================================================
-- STEP 2: Create the workspaces table if it doesn't exist
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    name TEXT DEFAULT 'Home',
    description TEXT DEFAULT '',
    is_home BOOLEAN DEFAULT FALSE,
    sharing TEXT DEFAULT 'private',
    default_model TEXT DEFAULT 'deepseek-chat',
    default_prompt TEXT DEFAULT 'You are a friendly, helpful AI assistant.',
    default_temperature REAL DEFAULT 0.5,
    default_context_length INTEGER DEFAULT 4096,
    embeddings_provider TEXT DEFAULT 'openai',
    include_profile_context BOOLEAN DEFAULT TRUE,
    include_workspace_instructions BOOLEAN DEFAULT TRUE,
    instructions TEXT DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_workspaces_user_id ON workspaces(user_id);

-- ===========================================================================
-- STEP 3: Enable RLS and create policies
-- ===========================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role bypass" ON profiles;
CREATE POLICY "Service role bypass" ON profiles
    FOR ALL USING (true) WITH CHECK (true);

-- Workspaces policies
DROP POLICY IF EXISTS "Users can view own workspaces" ON workspaces;
CREATE POLICY "Users can view own workspaces" ON workspaces
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own workspaces" ON workspaces;
CREATE POLICY "Users can update own workspaces" ON workspaces
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own workspaces" ON workspaces;
CREATE POLICY "Users can insert own workspaces" ON workspaces
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role bypass workspaces" ON workspaces;
CREATE POLICY "Service role bypass workspaces" ON workspaces
    FOR ALL USING (true) WITH CHECK (true);

-- ===========================================================================
-- STEP 4: Create the trigger function
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.create_profile_and_workspace() 
RETURNS TRIGGER
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
    random_username TEXT;
BEGIN
    random_username := 'user' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);

    -- Create profile
    INSERT INTO public.profiles (user_id, username, display_name, has_onboarded)
    VALUES (NEW.id, random_username, COALESCE(NEW.raw_user_meta_data->>'name', random_username), FALSE)
    ON CONFLICT (user_id) DO NOTHING;

    -- Create home workspace
    INSERT INTO public.workspaces (user_id, name, is_home)
    VALUES (NEW.id, 'Home', TRUE)
    ON CONFLICT DO NOTHING;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Trigger failed for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===========================================================================
-- STEP 5: Create the trigger
-- ===========================================================================
DROP TRIGGER IF EXISTS create_profile_and_workspace_trigger ON auth.users;
CREATE TRIGGER create_profile_and_workspace_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.create_profile_and_workspace();

-- ===========================================================================
-- VERIFICATION
-- ===========================================================================
SELECT 'SUCCESS! Tables created.' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('profiles', 'workspaces');
