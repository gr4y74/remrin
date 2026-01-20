-- Create user_presence table for enhanced presence system
CREATE TABLE IF NOT EXISTS user_presence (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'away', 'busy', 'invisible')),
    away_message TEXT,
    last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all presence"
    ON user_presence FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update own presence"
    ON user_presence FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own presence"
    ON user_presence FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_presence_status ON user_presence(status);
CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON user_presence(last_seen);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_presence_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_user_presence_updated_at ON user_presence;
CREATE TRIGGER trigger_update_user_presence_updated_at
    BEFORE UPDATE ON user_presence
    FOR EACH ROW
    EXECUTE FUNCTION update_user_presence_updated_at();

-- Function to get user's last seen time
CREATE OR REPLACE FUNCTION get_user_last_seen(p_user_id UUID)
RETURNS TABLE (
    last_seen TIMESTAMPTZ,
    status TEXT,
    away_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.last_seen,
        up.status,
        up.away_message
    FROM user_presence up
    WHERE up.user_id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_last_seen(UUID) TO authenticated;
