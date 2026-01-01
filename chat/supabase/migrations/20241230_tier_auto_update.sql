-- ═══════════════════════════════════════════════════════════════
-- TIER AUTO-UPDATE & WEBHOOK SUPPORT
-- ═══════════════════════════════════════════════════════════════
-- 
-- This migration adds:
-- 1. Tier change history tracking
-- 2. Automatic tier sync functions
-- 3. Webhook event logging
-- 4. Tier upgrade/downgrade handlers
--
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- TIER CHANGE HISTORY
-- ─────────────────────────────────────────────────────────────
-- Track all tier changes for auditing and analytics

CREATE TABLE IF NOT EXISTS tier_change_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    old_tier subscription_tier,
    new_tier subscription_tier NOT NULL,
    change_reason TEXT, -- 'upgrade', 'downgrade', 'trial_end', 'payment_failed', 'admin'
    stripe_subscription_id TEXT,
    changed_by UUID REFERENCES auth.users(id), -- NULL if automatic
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tier_history_user ON tier_change_history(user_id);
CREATE INDEX IF NOT EXISTS idx_tier_history_created ON tier_change_history(created_at DESC);

-- ─────────────────────────────────────────────────────────────
-- STRIPE WEBHOOK EVENTS LOG
-- ─────────────────────────────────────────────────────────────
-- Log all Stripe webhook events for debugging

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT UNIQUE NOT NULL, -- Stripe event ID
    event_type TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    subscription_id TEXT,
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON stripe_webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON stripe_webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_user ON stripe_webhook_events(user_id);

-- ─────────────────────────────────────────────────────────────
-- TIER MAPPING CONFIGURATION
-- ─────────────────────────────────────────────────────────────
-- Map Stripe price IDs to subscription tiers

CREATE TABLE IF NOT EXISTS tier_price_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_price_id TEXT UNIQUE NOT NULL,
    tier subscription_tier NOT NULL,
    tier_name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tier_price_mapping_active ON tier_price_mapping(is_active);

-- Seed default mappings (update these with your actual Stripe price IDs)
INSERT INTO tier_price_mapping (stripe_price_id, tier, tier_name, is_active)
VALUES
    ('price_wanderer_free', 'wanderer', 'Wanderer (Free)', true),
    ('price_soul_weaver_monthly', 'soul_weaver', 'Soul Weaver (Pro)', true),
    ('price_architect_monthly', 'architect', 'Architect (Premium)', true),
    ('price_titan_monthly', 'titan', 'Titan (Enterprise)', true)
ON CONFLICT (stripe_price_id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- FUNCTION: Get tier from Stripe price ID
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_tier_from_price_id(price_id TEXT)
RETURNS subscription_tier AS $$
DECLARE
    tier_result subscription_tier;
BEGIN
    SELECT tier INTO tier_result
    FROM tier_price_mapping
    WHERE stripe_price_id = price_id
      AND is_active = true;
    
    -- Default to wanderer if not found
    RETURN COALESCE(tier_result, 'wanderer'::subscription_tier);
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────
-- FUNCTION: Update user tier
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_user_tier(
    p_user_id UUID,
    p_new_tier subscription_tier,
    p_reason TEXT DEFAULT 'upgrade',
    p_subscription_id TEXT DEFAULT NULL,
    p_changed_by UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    old_tier subscription_tier;
    new_limit INTEGER;
BEGIN
    -- Get current tier from wallets
    SELECT tier INTO old_tier
    FROM wallets
    WHERE user_id = p_user_id;
    
    -- Update tier in wallets
    UPDATE wallets
    SET tier = p_new_tier,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Update tier in user_limits
    UPDATE user_limits
    SET tier = p_new_tier
    WHERE user_id = p_user_id::text;
    
    -- Update max requests based on tier
    CASE p_new_tier
        WHEN 'wanderer' THEN new_limit := 50;
        WHEN 'soul_weaver' THEN new_limit := 500;
        WHEN 'architect' THEN new_limit := 999999;
        WHEN 'titan' THEN new_limit := 999999;
        ELSE new_limit := 50;
    END CASE;
    
    UPDATE user_limits
    SET max_requests_per_day = new_limit
    WHERE user_id = p_user_id::text;
    
    -- Log tier change
    INSERT INTO tier_change_history (
        user_id, old_tier, new_tier, change_reason, 
        stripe_subscription_id, changed_by
    )
    VALUES (
        p_user_id, old_tier, p_new_tier, p_reason,
        p_subscription_id, p_changed_by
    );
    
    RAISE NOTICE 'Updated user % from % to %', p_user_id, old_tier, p_new_tier;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────
-- FUNCTION: Handle subscription created/updated
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION handle_subscription_change(
    p_user_id UUID,
    p_subscription_id TEXT,
    p_price_id TEXT,
    p_status TEXT
)
RETURNS VOID AS $$
DECLARE
    new_tier subscription_tier;
BEGIN
    -- Get tier from price ID
    new_tier := get_tier_from_price_id(p_price_id);
    
    -- Only update if subscription is active
    IF p_status = 'active' THEN
        PERFORM update_user_tier(
            p_user_id,
            new_tier,
            'subscription_activated',
            p_subscription_id
        );
    ELSIF p_status IN ('canceled', 'unpaid', 'past_due') THEN
        -- Downgrade to free tier
        PERFORM update_user_tier(
            p_user_id,
            'wanderer'::subscription_tier,
            'subscription_' || p_status,
            p_subscription_id
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────
-- FUNCTION: Sync all users with their Stripe subscriptions
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION sync_all_user_tiers()
RETURNS TABLE (
    user_id UUID,
    old_tier subscription_tier,
    new_tier subscription_tier,
    synced BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH active_subs AS (
        SELECT 
            s.user_id,
            s.price_id,
            s.status,
            ROW_NUMBER() OVER (PARTITION BY s.user_id ORDER BY s.created_at DESC) as rn
        FROM subscriptions s
        WHERE s.status = 'active'
    ),
    tier_updates AS (
        SELECT 
            w.user_id,
            w.tier as old_tier,
            COALESCE(get_tier_from_price_id(a.price_id), 'wanderer'::subscription_tier) as new_tier
        FROM wallets w
        LEFT JOIN active_subs a ON a.user_id = w.user_id AND a.rn = 1
    )
    SELECT 
        tu.user_id,
        tu.old_tier,
        tu.new_tier,
        CASE 
            WHEN tu.old_tier != tu.new_tier THEN
                (update_user_tier(tu.user_id, tu.new_tier, 'sync', NULL, NULL) IS NULL)
            ELSE true
        END as synced
    FROM tier_updates tu;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────
-- TRIGGER: Auto-update tier on subscription change
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION trigger_subscription_tier_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle new or updated subscription
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        PERFORM handle_subscription_change(
            NEW.user_id,
            NEW.id,
            NEW.price_id,
            NEW.status
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_update_tier_on_subscription ON subscriptions;
CREATE TRIGGER auto_update_tier_on_subscription
    AFTER INSERT OR UPDATE OF status, price_id
    ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_subscription_tier_update();

-- ─────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────

ALTER TABLE tier_change_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier_price_mapping ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own tier history" ON tier_change_history;
DROP POLICY IF EXISTS "Service role can manage tier history" ON tier_change_history;
DROP POLICY IF EXISTS "Service role can manage webhook events" ON stripe_webhook_events;
DROP POLICY IF EXISTS "Anyone can view tier mappings" ON tier_price_mapping;
DROP POLICY IF EXISTS "Service role can manage tier mappings" ON tier_price_mapping;

-- Users can view their own tier history
CREATE POLICY "Users can view own tier history"
    ON tier_change_history FOR SELECT
    USING (user_id = auth.uid());

-- Service role can manage everything
CREATE POLICY "Service role can manage tier history"
    ON tier_change_history FOR ALL
    TO service_role
    USING (true);

CREATE POLICY "Service role can manage webhook events"
    ON stripe_webhook_events FOR ALL
    TO service_role
    USING (true);

-- Anyone can view active tier mappings
CREATE POLICY "Anyone can view tier mappings"
    ON tier_price_mapping FOR SELECT
    USING (is_active = true);

CREATE POLICY "Service role can manage tier mappings"
    ON tier_price_mapping FOR ALL
    TO service_role
    USING (true);

-- ═══════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES
-- ═══════════════════════════════════════════════════════════════

-- Check tables exist:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('tier_change_history', 'stripe_webhook_events', 'tier_price_mapping');

-- Check functions exist:
-- SELECT proname FROM pg_proc WHERE proname IN ('update_user_tier', 'handle_subscription_change', 'sync_all_user_tiers');

-- Check trigger exists:
-- SELECT tgname FROM pg_trigger WHERE tgname = 'auto_update_tier_on_subscription';

-- Test tier update:
-- SELECT update_user_tier('USER_UUID'::uuid, 'soul_weaver'::subscription_tier, 'test', NULL, NULL);

-- View tier history:
-- SELECT * FROM tier_change_history ORDER BY created_at DESC LIMIT 10;

-- ═══════════════════════════════════════════════════════════════
-- DONE! Auto-update system is ready.
-- ═══════════════════════════════════════════════════════════════
