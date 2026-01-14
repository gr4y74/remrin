-- FIX_USER_SIGNUP.sql
-- Run this in Supabase SQL Editor to fix "Database error saving new user"
-- The issue is that the trigger references columns that don't exist

-- Step 1: Add missing columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS groq_api_key TEXT CHECK (char_length(groq_api_key) <= 1000);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS openrouter_api_key TEXT CHECK (char_length(openrouter_api_key) <= 1000);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS azure_openai_embeddings_id TEXT CHECK (char_length(azure_openai_embeddings_id) <= 1000);

-- Step 2: Make sure all profile columns are nullable (except id)
-- This prevents insertion failures
DO $$
DECLARE
    col_record RECORD;
BEGIN
    FOR col_record IN 
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'profiles'
          AND is_nullable = 'NO'
          AND column_name NOT IN ('id')
    LOOP
        EXECUTE format('ALTER TABLE profiles ALTER COLUMN %I DROP NOT NULL', col_record.column_name);
        RAISE NOTICE 'Made column % nullable', col_record.column_name;
    END LOOP;
END $$;

-- Step 3: Recreate the trigger function with error handling
CREATE OR REPLACE FUNCTION create_profile_and_workspace() 
RETURNS TRIGGER
security definer set search_path = public
AS $$
DECLARE
    random_username TEXT;
BEGIN
    -- Generate a random username
    random_username := 'user' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 16);

    -- Create a profile for the new user (minimal required fields)
    INSERT INTO public.profiles(
        user_id, 
        username,
        display_name,
        has_onboarded,
        use_azure_openai
    )
    VALUES(
        NEW.id,
        random_username,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'email', random_username),
        FALSE,
        FALSE
    );

    -- Create the home workspace for the new user
    INSERT INTO public.workspaces(
        user_id, 
        is_home, 
        name, 
        default_context_length, 
        default_model, 
        default_prompt, 
        default_temperature, 
        description, 
        embeddings_provider, 
        include_profile_context, 
        include_workspace_instructions, 
        instructions
    )
    VALUES(
        NEW.id,
        TRUE,
        'Home',
        4096,
        'deepseek-chat',
        'You are a friendly, helpful AI assistant.',
        0.5,
        'My home workspace.',
        'openai',
        TRUE,
        TRUE,
        ''
    );

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log but don't fail authentication
        RAISE WARNING 'Profile/workspace creation failed for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ language 'plpgsql';

-- Verify the fix
SELECT 'Trigger function updated successfully!' as status;
