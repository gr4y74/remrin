-- ═══════════════════════════════════════════════════════════════
-- MOOD & COGNITIVE SHIFT SYSTEM
-- ═══════════════════════════════════════════════════════════════
-- 
-- This migration adds human imperfection to AI personas through:
-- 1. Mood state persistence (social battery, melancholy, interest)
-- 2. Cognitive drift configuration (semantic tangents)
-- 3. Topic exhaustion tracking
-- 4. Session-based "brain weather" randomness
--
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- PERSONA MOOD STATE TABLE
-- ─────────────────────────────────────────────────────────────
-- Tracks dynamic mood variables for each user-persona pair

CREATE TABLE IF NOT EXISTS persona_mood_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    persona_id UUID REFERENCES personas(id) ON DELETE CASCADE,
    
    -- Mood Variables (0.0 - 1.0)
    social_battery FLOAT DEFAULT 1.0 CHECK (social_battery BETWEEN 0.0 AND 1.0),
    interest_vector FLOAT DEFAULT 0.5 CHECK (interest_vector BETWEEN 0.0 AND 1.0),
    melancholy_threshold FLOAT DEFAULT 0.0 CHECK (melancholy_threshold BETWEEN 0.0 AND 1.0),
    
    -- Topic Tracking
    current_topic_domain TEXT DEFAULT 'personal',
    topic_start_time TIMESTAMPTZ DEFAULT NOW(),
    topic_token_count INTEGER DEFAULT 0,
    
    -- Session Metadata
    last_interaction TIMESTAMPTZ DEFAULT NOW(),
    session_start TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, persona_id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mood_state_user_persona 
    ON persona_mood_state(user_id, persona_id);

CREATE INDEX IF NOT EXISTS idx_mood_state_last_interaction 
    ON persona_mood_state(last_interaction);

-- ─────────────────────────────────────────────────────────────
-- MOOD STATE HELPER FUNCTIONS
-- ─────────────────────────────────────────────────────────────

-- Function to get or create mood state
CREATE OR REPLACE FUNCTION get_or_create_mood_state(
    p_user_id TEXT,
    p_persona_id UUID
)
RETURNS persona_mood_state AS $$
DECLARE
    mood_record persona_mood_state;
    hours_since_last FLOAT;
BEGIN
    -- Try to get existing mood state
    SELECT * INTO mood_record
    FROM persona_mood_state
    WHERE user_id = p_user_id AND persona_id = p_persona_id;
    
    IF NOT FOUND THEN
        -- Create new mood state with random "brain weather"
        INSERT INTO persona_mood_state (user_id, persona_id)
        VALUES (p_user_id, p_persona_id)
        RETURNING * INTO mood_record;
        
        RETURN mood_record;
    END IF;
    
    -- Check if new session (>4 hours since last interaction)
    hours_since_last := EXTRACT(EPOCH FROM (NOW() - mood_record.last_interaction)) / 3600;
    
    IF hours_since_last > 4 THEN
        -- Partial recovery and new session start
        UPDATE persona_mood_state
        SET 
            social_battery = LEAST(1.0, social_battery + 0.3),
            session_start = NOW(),
            updated_at = NOW()
        WHERE user_id = p_user_id AND persona_id = p_persona_id
        RETURNING * INTO mood_record;
    END IF;
    
    RETURN mood_record;
END;
$$ LANGUAGE plpgsql;

-- Function to update mood state after interaction
CREATE OR REPLACE FUNCTION update_mood_after_interaction(
    p_user_id TEXT,
    p_persona_id UUID,
    p_domain TEXT,
    p_token_count INTEGER,
    p_battery_drain FLOAT
)
RETURNS VOID AS $$
DECLARE
    current_mood persona_mood_state;
    topic_changed BOOLEAN;
BEGIN
    -- Get current mood state
    SELECT * INTO current_mood
    FROM persona_mood_state
    WHERE user_id = p_user_id AND persona_id = p_persona_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Mood state not found for user % and persona %', p_user_id, p_persona_id;
    END IF;
    
    -- Check if topic changed
    topic_changed := current_mood.current_topic_domain != p_domain;
    
    -- Update mood state
    UPDATE persona_mood_state
    SET
        social_battery = GREATEST(0.0, social_battery - p_battery_drain),
        current_topic_domain = p_domain,
        topic_start_time = CASE 
            WHEN topic_changed THEN NOW()
            ELSE topic_start_time
        END,
        topic_token_count = CASE
            WHEN topic_changed THEN p_token_count
            ELSE topic_token_count + p_token_count
        END,
        last_interaction = NOW(),
        updated_at = NOW()
    WHERE user_id = p_user_id AND persona_id = p_persona_id;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────

ALTER TABLE persona_mood_state ENABLE ROW LEVEL SECURITY;

-- Users can only access their own mood states
CREATE POLICY IF NOT EXISTS "Users can manage own mood states"
    ON persona_mood_state FOR ALL
    USING (user_id = auth.uid()::text);

-- Service role can access all mood states
CREATE POLICY IF NOT EXISTS "Service role can manage all mood states"
    ON persona_mood_state FOR ALL
    TO service_role
    USING (true);

-- ─────────────────────────────────────────────────────────────
-- DEFAULT COGNITIVE DRIFT CONFIG FOR EXISTING PERSONAS
-- ─────────────────────────────────────────────────────────────

-- Add default mood config to personas that don't have it
UPDATE personas
SET config = COALESCE(config, '{}'::jsonb) || jsonb_build_object(
    'cognitive_drift', 0.3,
    'social_exhaustion', 0.5,
    'mood_spontaneity', 0.4,
    'topic_exhaustion_minutes', 30
)
WHERE config IS NULL 
   OR NOT (config ? 'cognitive_drift');

-- ═══════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES
-- ═══════════════════════════════════════════════════════════════

-- Check table exists:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'persona_mood_state';

-- Check functions exist:
-- SELECT proname FROM pg_proc WHERE proname IN ('get_or_create_mood_state', 'update_mood_after_interaction');

-- Check personas have mood config:
-- SELECT id, name, config->'cognitive_drift' as drift FROM personas LIMIT 5;

-- ═══════════════════════════════════════════════════════════════
-- DONE! Mood & Cognitive Shift system is ready.
-- ═══════════════════════════════════════════════════════════════
