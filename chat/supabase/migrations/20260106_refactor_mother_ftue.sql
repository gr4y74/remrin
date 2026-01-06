-- ============================================================
-- REFACTOR MOTHER FTUE - STOP CLONING, START FOLLOWING
-- ============================================================

CREATE OR REPLACE FUNCTION seed_mother_and_chat_for_new_user()
RETURNS TRIGGER AS $$
DECLARE
    mother_persona_id UUID := 'a0000000-0000-0000-0000-000000000001';
    new_chat_id UUID;
    user_workspace_id UUID;
BEGIN
    -- Get the user's default workspace
    SELECT id INTO user_workspace_id 
    FROM workspaces 
    WHERE user_id = NEW.id 
    LIMIT 1;
    
    IF user_workspace_id IS NULL THEN
        RAISE WARNING 'No workspace found for user %. Mother chat will be created on first login.', NEW.id;
        RETURN NEW;
    END IF;

    -- 1. Make the User FOLLOW the Mother of Souls (Singleton)
    -- This ensures she appears in their sidebar/list
    INSERT INTO character_follows (user_id, persona_id, followed_at)
    VALUES (NEW.id, mother_persona_id, now())
    ON CONFLICT (user_id, persona_id) DO NOTHING;

    -- 2. Create the initial chat with Mother singleton
    -- We assume assistant_id is used for persona linkage based on schema inspection
    INSERT INTO chats (
        id,
        user_id,
        workspace_id,
        assistant_id, -- Linking to Mother
        name,
        model,
        prompt,
        temperature,
        context_length,
        include_profile_context,
        include_workspace_instructions,
        embeddings_provider
    ) VALUES (
        gen_random_uuid(),
        NEW.id,
        user_workspace_id,
        mother_persona_id, -- The Link
        'Soul Forge - Your First Creation',
        'deepseek-chat',
        '',
        0.8,
        4096,
        true,
        true,
        'openai'
    )
    RETURNING id INTO new_chat_id;
    
    RAISE NOTICE 'Mother of Souls connected for user % with chat %', NEW.id, new_chat_id;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to seed Mother for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
