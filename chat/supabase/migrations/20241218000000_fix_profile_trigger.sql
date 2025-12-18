-- REMRIN: Fix create_profile_and_workspace trigger to include groq_api_key and openrouter_api_key
-- Run this in your Supabase SQL Editor

-- First, add openrouter_api_key column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' 
                   AND column_name = 'openrouter_api_key') THEN
        ALTER TABLE profiles ADD COLUMN openrouter_api_key TEXT CHECK (char_length(openrouter_api_key) <= 1000);
    END IF;
END $$;

-- Update the trigger function to include all columns
CREATE OR REPLACE FUNCTION create_profile_and_workspace() 
RETURNS TRIGGER
security definer set search_path = public
AS $$
DECLARE
    random_username TEXT;
BEGIN
    -- Generate a random username
    random_username := 'user' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 16);

    -- Create a profile for the new user
    INSERT INTO public.profiles(
        user_id, 
        anthropic_api_key, 
        azure_openai_35_turbo_id, 
        azure_openai_45_turbo_id, 
        azure_openai_45_vision_id, 
        azure_openai_api_key, 
        azure_openai_endpoint,
        azure_openai_embeddings_id,
        google_gemini_api_key, 
        has_onboarded, 
        image_url, 
        image_path, 
        mistral_api_key, 
        display_name, 
        bio, 
        openai_api_key, 
        openai_organization_id, 
        perplexity_api_key, 
        profile_context, 
        use_azure_openai, 
        username,
        groq_api_key,
        openrouter_api_key
    )
    VALUES(
        NEW.id,
        '',  -- anthropic_api_key
        '',  -- azure_openai_35_turbo_id
        '',  -- azure_openai_45_turbo_id
        '',  -- azure_openai_45_vision_id
        '',  -- azure_openai_api_key
        '',  -- azure_openai_endpoint
        '',  -- azure_openai_embeddings_id
        '',  -- google_gemini_api_key
        FALSE,  -- has_onboarded
        '',  -- image_url
        '',  -- image_path
        '',  -- mistral_api_key
        '',  -- display_name
        '',  -- bio
        '',  -- openai_api_key
        '',  -- openai_organization_id
        '',  -- perplexity_api_key
        '',  -- profile_context
        FALSE,  -- use_azure_openai
        random_username,  -- username
        '',  -- groq_api_key
        ''   -- openrouter_api_key
    );

    -- Create the home workspace for the new user with DeepSeek as default model
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
        'deepseek-chat',  -- REMRIN: DeepSeek as default
        'You are a friendly, helpful AI assistant.',
        0.5,
        'My home workspace.',
        'openai',
        TRUE,
        TRUE,
        ''
    );

    RETURN NEW;
END;
$$ language 'plpgsql';
