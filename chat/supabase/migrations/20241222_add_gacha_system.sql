-- Gacha System - Pools, Items, Pulls, and Pity
-- Created: 2024-12-22

-- ============================================
-- GACHA POOLS TABLE
-- ============================================
CREATE TABLE gacha_pools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    banner_image TEXT,
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE gacha_pools IS 'Available gacha banners/pools for pulling personas';
COMMENT ON COLUMN gacha_pools.banner_image IS 'URL to the banner image for this pool';
COMMENT ON COLUMN gacha_pools.start_date IS 'When the pool becomes available (null = always)';
COMMENT ON COLUMN gacha_pools.end_date IS 'When the pool expires (null = never)';

-- ============================================
-- GACHA POOL ITEMS TABLE
-- ============================================
CREATE TABLE gacha_pool_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pool_id UUID NOT NULL REFERENCES gacha_pools(id) ON DELETE CASCADE,
    persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
    rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    weight INTEGER NOT NULL DEFAULT 100,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(pool_id, persona_id)
);

COMMENT ON TABLE gacha_pool_items IS 'Personas available in each gacha pool with their rarity and drop weight';
COMMENT ON COLUMN gacha_pool_items.rarity IS 'Rarity tier: common, rare, epic, legendary';
COMMENT ON COLUMN gacha_pool_items.weight IS 'Relative drop weight within the same rarity tier';
COMMENT ON COLUMN gacha_pool_items.is_featured IS 'Whether this item is featured/rate-up in the banner';

-- ============================================
-- USER PULLS TABLE
-- ============================================
CREATE TABLE user_pulls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    pool_id UUID NOT NULL REFERENCES gacha_pools(id) ON DELETE CASCADE,
    persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
    rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    pull_number INTEGER NOT NULL DEFAULT 1,
    is_pity BOOLEAN DEFAULT false,
    aether_spent INTEGER NOT NULL DEFAULT 10,
    pulled_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE user_pulls IS 'History of all gacha pulls made by users';
COMMENT ON COLUMN user_pulls.pull_number IS 'Which pull this was (1, 2, 3... for multi-pulls)';
COMMENT ON COLUMN user_pulls.is_pity IS 'Whether this pull was triggered by pity system';

-- ============================================
-- USER PITY TABLE
-- ============================================
CREATE TABLE user_pity (
    user_id TEXT NOT NULL,
    pool_id UUID NOT NULL REFERENCES gacha_pools(id) ON DELETE CASCADE,
    pulls_since_legendary INTEGER DEFAULT 0,
    pulls_since_rare INTEGER DEFAULT 0,
    total_pulls INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, pool_id)
);

COMMENT ON TABLE user_pity IS 'Pity counter tracking for guaranteed rare/legendary pulls';
COMMENT ON COLUMN user_pity.pulls_since_legendary IS 'Number of pulls since last legendary (hard pity at 90)';
COMMENT ON COLUMN user_pity.pulls_since_rare IS 'Number of pulls since last rare or better (soft pity at 10)';

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_gacha_pools_active ON gacha_pools(is_active);
CREATE INDEX idx_gacha_pools_dates ON gacha_pools(start_date, end_date);
CREATE INDEX idx_gacha_pool_items_pool ON gacha_pool_items(pool_id);
CREATE INDEX idx_gacha_pool_items_rarity ON gacha_pool_items(rarity);
CREATE INDEX idx_user_pulls_user ON user_pulls(user_id);
CREATE INDEX idx_user_pulls_pool ON user_pulls(pool_id);
CREATE INDEX idx_user_pulls_date ON user_pulls(pulled_at);
CREATE INDEX idx_user_pity_user ON user_pity(user_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Gacha Pools: Everyone can view active pools
ALTER TABLE gacha_pools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active gacha pools"
ON gacha_pools FOR SELECT
USING (
    is_active = true 
    AND (start_date IS NULL OR start_date <= NOW())
    AND (end_date IS NULL OR end_date > NOW())
);

-- Pool Items: Everyone can view items in active pools
ALTER TABLE gacha_pool_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view items in active pools"
ON gacha_pool_items FOR SELECT
USING (
    pool_id IN (
        SELECT id FROM gacha_pools 
        WHERE is_active = true 
        AND (start_date IS NULL OR start_date <= NOW())
        AND (end_date IS NULL OR end_date > NOW())
    )
);

-- User Pulls: Users can only see their own pull history
ALTER TABLE user_pulls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pull history"
ON user_pulls FOR SELECT
USING (user_id = auth.uid()::text);

CREATE POLICY "Service can insert pulls"
ON user_pulls FOR INSERT
WITH CHECK (user_id = auth.uid()::text);

-- User Pity: Users can only see their own pity counters
ALTER TABLE user_pity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pity counters"
ON user_pity FOR SELECT
USING (user_id = auth.uid()::text);

CREATE POLICY "Service can insert pity"
ON user_pity FOR INSERT
WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Service can update pity"
ON user_pity FOR UPDATE
USING (user_id = auth.uid()::text);

-- ============================================
-- UPDATED_AT TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_gacha_pools_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_gacha_pools_updated_at
    BEFORE UPDATE ON gacha_pools FOR EACH ROW
    EXECUTE FUNCTION update_gacha_pools_updated_at();

CREATE OR REPLACE FUNCTION update_user_pity_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_pity_updated_at
    BEFORE UPDATE ON user_pity FOR EACH ROW
    EXECUTE FUNCTION update_user_pity_updated_at();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get or create pity record
CREATE OR REPLACE FUNCTION get_or_create_pity(p_user_id TEXT, p_pool_id UUID)
RETURNS user_pity AS $$
DECLARE
    result user_pity;
BEGIN
    -- Try to get existing record
    SELECT * INTO result FROM user_pity 
    WHERE user_id = p_user_id AND pool_id = p_pool_id;
    
    -- Create if not exists
    IF NOT FOUND THEN
        INSERT INTO user_pity (user_id, pool_id)
        VALUES (p_user_id, p_pool_id)
        RETURNING * INTO result;
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
