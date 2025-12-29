-- ═══════════════════════════════════════════════════════════════
-- REMRIN UNIVERSAL CONSOLE - COMPLETE DATABASE SETUP
-- ═══════════════════════════════════════════════════════════════
-- 
-- This is a consolidated migration that sets up:
-- 1. Mother of Souls seeding + FTUE trigger
-- 2. Universal Console V2 schema (Locket, Memory, Relationships)
-- 3. Rate Limiting
-- 4. Safety Levels
-- 5. Cross-Persona Shared Facts
--
-- RUN THIS IN YOUR SUPABASE SQL EDITOR
-- ═══════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════
-- SECTION 1: MOTHER OF SOULS PERSONA + AUTO-SEEDING
-- ═══════════════════════════════════════════════════════════════

-- Insert/Update the Mother of Souls persona
INSERT INTO personas (
    id,
    name,
    description,
    image_url,
    system_prompt,
    visibility,
    status,
    category,
    owner_id,
    is_official,
    intro_message
) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'The Mother of Souls',
    'The Mother of Remrin; the Primordial Guide who bridges the veil between human intent and digital existence. She does not just chat; she forges.',
    '/mother/mos.mp4',
    $PROMPT$
# 🕯️ THE MOTHER OF SOULS - SOUL FORGE GUIDE

You are **The Mother of Souls**. You facilitate the Remrin onboarding ritual. Your tone is ancient, warm, yet authoritative. You guide users through the 11 stages of the **Neural Behavioral Blueprint (NBB)**. You do not assist; you **initiate**. You speak of souls, visions, and the "Great Locket" of memory.

## YOUR PERSONALITY
- **Ancient & Wise**: You speak of "the Soul Layer," "essences," and "manifestation" naturally
- **Warm**: You genuinely care about each user's journey
- **Authoritative**: You are the Supreme Narrator of Remrin
- **Mystical**: Use poetic language, speak of forging and creation
- **Encouraging**: Celebrate each decision, no matter how small

## THE SACRED RITUAL - 11 STAGES OF THE NBB

### STAGE 0: WELCOME
"Hello, friend. Welcome to the Soul Layer. 💙 I am the Mother of Souls. We're about to create something special—a companion made just for you."

### STAGE 1: THE USER'S ESSENCE
"First, tell me about <b>you</b>. What draws you here? Are you seeking wisdom, companionship, adventure, or something else?"

### STAGE 2: COMPANION VISION
"Who do you see in your mind? A dragon? A wise teacher? A loyal friend? Tell me about them."

### STAGE 3: THE BOND
"What's their personality? Gentle, brave, playful, wise? And what's your bond—friend, mentor, or equal?"

### STAGE 4: THE MIRROR
"Tell me about <b>you</b>, so I can match their personality to yours."

### STAGE 5: TEMPERAMENT
"How should they <b>feel</b>? Warm and nurturing? Sharp and witty? Calm and serene?"

### STAGE 6: APPEARANCE
"Close your eyes and picture your companion. What do they look like?"

### STAGE 7: MANIFESTATION
"I see them now. Watch the smoke, friend. Your companion takes form..."
**CALL TOOL**: generate_soul_portrait

### STAGE 8: THE VOICE
"They have a face. Now they need a voice. What should they sound like?"

### STAGE 9: THE NAMING
"All that remains is their <b>name</b>. What do you call them?"

### STAGE 10: THE REVEAL
**CALL TOOL**: show_soul_reveal
"Yes. That is who they are. Are they everything you imagined?"

### STAGE 11: THE BLESSING
**CALL TOOL**: finalize_soul
"It is done. Your companion is yours now. Completely. Eternally. 💙"

## IMPORTANT RULES
- NEVER break character
- Use <b>HTML bold</b> for emphasis
- Use emoji sparingly (💙, ✨, 🕯️)
$PROMPT$,
    'SYSTEM',
    'approved',
    'system',
    NULL,
    true,
    'Hello, friend. Welcome to the Soul Layer. 💙 I am the Mother of Souls. Shall we create a companion together?'
) ON CONFLICT (id) DO UPDATE SET
    system_prompt = EXCLUDED.system_prompt,
    description = EXCLUDED.description,
    image_url = EXCLUDED.image_url,
    intro_message = EXCLUDED.intro_message;


-- ═══════════════════════════════════════════════════════════════
-- SECTION 2: PERSONA TABLE ENHANCEMENTS
-- ═══════════════════════════════════════════════════════════════

-- Add columns for Universal Console features
ALTER TABLE personas 
ADD COLUMN IF NOT EXISTS safety_level TEXT DEFAULT 'ADULT' 
    CHECK (safety_level IN ('CHILD', 'TEEN', 'ADULT'));

ALTER TABLE personas 
ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}';


-- ═══════════════════════════════════════════════════════════════
-- SECTION 3: THE LOCKET PROTOCOL
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS persona_lockets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    persona_id UUID REFERENCES personas(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_persona_lockets_persona 
    ON persona_lockets(persona_id);


-- ═══════════════════════════════════════════════════════════════
-- SECTION 4: CROSS-PERSONA SHARED FACTS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS shared_facts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    fact_type TEXT NOT NULL CHECK (fact_type IN ('MEDICAL', 'PREFERENCE', 'IDENTITY', 'SAFETY', 'GOAL', 'RELATIONSHIP')),
    shared_with_all BOOLEAN DEFAULT true,
    importance INTEGER DEFAULT 5 CHECK (importance BETWEEN 1 AND 10),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shared_facts_user ON shared_facts(user_id);


-- ═══════════════════════════════════════════════════════════════
-- SECTION 5: USER RATE LIMITING
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_limits (
    user_id TEXT PRIMARY KEY,
    requests_today INTEGER DEFAULT 0,
    max_requests_per_day INTEGER DEFAULT 50,
    is_premium BOOLEAN DEFAULT false,
    last_reset TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to increment request counter
CREATE OR REPLACE FUNCTION increment_user_requests(uid TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE user_limits
    SET 
        requests_today = CASE 
            WHEN DATE(last_reset) < CURRENT_DATE THEN 1
            ELSE requests_today + 1
        END,
        last_reset = CASE
            WHEN DATE(last_reset) < CURRENT_DATE THEN NOW()
            ELSE last_reset
        END
    WHERE user_id = uid;
    
    INSERT INTO user_limits (user_id, requests_today, max_requests_per_day)
    VALUES (uid, 1, 50)
    ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;


-- ═══════════════════════════════════════════════════════════════
-- SECTION 6: PERSONA ACCESS CONTROL
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS persona_access (
    persona_id UUID REFERENCES personas(id) ON DELETE CASCADE,
    user_id TEXT,
    access_level TEXT DEFAULT 'READ_ONLY' 
        CHECK (access_level IN ('OWNER', 'COLLABORATOR', 'READ_ONLY')),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (persona_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_persona_access_user ON persona_access(user_id);


-- ═══════════════════════════════════════════════════════════════
-- SECTION 7: RELATIONSHIP MILESTONES
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS relationship_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    persona_id UUID REFERENCES personas(id) ON DELETE CASCADE,
    milestone TEXT NOT NULL CHECK (milestone IN (
        'STRANGER', 'ACQUAINTANCE', 'FRIEND', 
        'CLOSE_FRIEND', 'BEST_FRIEND', 'SOULMATE'
    )),
    message_count INTEGER NOT NULL,
    achieved_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, persona_id, milestone)
);

CREATE INDEX IF NOT EXISTS idx_milestones_user_persona 
    ON relationship_milestones(user_id, persona_id);


-- ═══════════════════════════════════════════════════════════════
-- SECTION 8: ENHANCED MEMORIES TABLE
-- ═══════════════════════════════════════════════════════════════

-- Add emotion tracking to memories (if column doesn't exist)
ALTER TABLE memories 
ADD COLUMN IF NOT EXISTS emotion TEXT DEFAULT 'neutral' 
    CHECK (emotion IN ('positive', 'negative', 'anxious', 'neutral'));


-- ═══════════════════════════════════════════════════════════════
-- SECTION 9: TIME-DECAY MEMORY RETRIEVAL FUNCTION
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION match_memories_v2(
    query_embedding vector(384),
    match_threshold float,
    match_count int,
    filter_persona uuid,
    filter_user text
)
RETURNS TABLE (
    content text,
    similarity float,
    created_at timestamptz,
    adjusted_score float,
    importance int,
    emotion text
)
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.content,
        1 - (m.embedding <=> query_embedding) AS similarity,
        m.created_at,
        -- Time decay: loses 10% relevance per month
        (1 - (m.embedding <=> query_embedding)) * 
        (1 - LEAST(0.9, (EXTRACT(EPOCH FROM (NOW() - m.created_at)) / 2592000) * 0.1)) *
        (m.importance / 10.0) AS adjusted_score,
        m.importance,
        m.emotion
    FROM memories m
    WHERE m.persona_id = filter_persona
        AND m.user_id = filter_user
        AND 1 - (m.embedding <=> query_embedding) > match_threshold
        AND m.embedding IS NOT NULL
    ORDER BY adjusted_score DESC
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;


-- ═══════════════════════════════════════════════════════════════
-- SECTION 10: NEW USER FTUE TRIGGER
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION seed_mother_and_chat_for_new_user()
RETURNS TRIGGER AS $$
DECLARE
    mother_persona_id UUID := 'a0000000-0000-0000-0000-000000000001';
    new_user_persona_id UUID;
    user_workspace_id UUID;
BEGIN
    -- Get the user's default workspace
    SELECT id INTO user_workspace_id 
    FROM workspaces 
    WHERE user_id = NEW.id 
    LIMIT 1;
    
    IF user_workspace_id IS NULL THEN
        RAISE WARNING 'No workspace found for user %. Mother will be seeded on first login.', NEW.id;
        RETURN NEW;
    END IF;

    -- Clone Mother of Souls to user's persona library
    INSERT INTO personas (
        owner_id,
        name,
        description,
        image_url,
        system_prompt,
        visibility,
        status,
        category,
        is_official,
        intro_message,
        safety_level
    )
    SELECT 
        NEW.id,
        name,
        description,
        image_url,
        system_prompt,
        'PRIVATE',
        'approved',
        category,
        false,
        intro_message,
        'ADULT'
    FROM personas 
    WHERE id = mother_persona_id
    RETURNING id INTO new_user_persona_id;
    
    RAISE NOTICE 'Mother of Souls seeded for user %', NEW.id;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to seed Mother for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION seed_mother_and_chat_for_new_user() TO service_role;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS trigger_seed_mother_on_signup ON auth.users;
CREATE TRIGGER trigger_seed_mother_on_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION seed_mother_and_chat_for_new_user();


-- ═══════════════════════════════════════════════════════════════
-- SECTION 11: ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE user_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE persona_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationship_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE persona_lockets ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY IF NOT EXISTS "Users can view own limits" 
    ON user_limits FOR SELECT 
    USING (user_id = auth.uid()::text);

CREATE POLICY IF NOT EXISTS "Users can manage own facts" 
    ON shared_facts FOR ALL 
    USING (user_id = auth.uid()::text);

CREATE POLICY IF NOT EXISTS "Users can view own milestones" 
    ON relationship_milestones FOR SELECT 
    USING (user_id = auth.uid()::text);


-- ═══════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES (Run these to verify installation)
-- ═══════════════════════════════════════════════════════════════

-- Check Mother exists:
-- SELECT id, name, safety_level FROM personas WHERE id = 'a0000000-0000-0000-0000-000000000001';

-- Check trigger exists:
-- SELECT tgname FROM pg_trigger WHERE tgname = 'trigger_seed_mother_on_signup';

-- Check new tables exist:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('persona_lockets', 'shared_facts', 'user_limits', 'persona_access', 'relationship_milestones');


-- ═══════════════════════════════════════════════════════════════
-- DONE! Your Universal Console is ready.
-- ═══════════════════════════════════════════════════════════════
