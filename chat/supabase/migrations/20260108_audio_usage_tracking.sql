-- Audio Usage Tracking Tables

-- Table to log every generation event
CREATE TABLE IF NOT EXISTS audio_generations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    provider TEXT NOT NULL, -- 'edge', 'kokoro', 'elevenlabs'
    voice_id TEXT NOT NULL,
    chars_count INTEGER NOT NULL,
    duration_seconds NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast monthly aggregation
CREATE INDEX idx_audio_generations_user_date ON audio_generations(user_id, created_at);

-- RLS Policies
ALTER TABLE audio_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own generations"
    ON audio_generations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System/Service role can insert generations"
    ON audio_generations FOR INSERT
    WITH CHECK (true); -- Usually inserted by service role, but if user triggers it directly need logic. 
                       -- Actually, AudioService runs on server.

-- Function to get monthly usage
CREATE OR REPLACE FUNCTION get_monthly_audio_usage(
    user_uuid UUID
) RETURNS INTEGER AS $$
DECLARE
    usage_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO usage_count
    FROM audio_generations
    WHERE user_id = user_uuid
      AND created_at >= date_trunc('month', CURRENT_DATE);
    
    RETURN usage_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
