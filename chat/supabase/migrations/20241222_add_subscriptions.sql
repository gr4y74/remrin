-- Subscriptions and Stripe Integration
-- Created: 2024-12-22

-- 1. Create subscriptions table to mirror Stripe data
CREATE TABLE subscriptions (
    id TEXT PRIMARY KEY, -- Stripe Subscription ID
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    status TEXT NOT NULL, -- active, incomplete, canceled, etc.
    price_id TEXT,
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by user
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
-- Index for lookups by stripe subscription id (primary key handles this, but good to be explicit if querying often)

-- RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
ON subscriptions FOR SELECT USING (user_id = auth.uid());

-- 2. Add stripe_customer_id to wallets if not present
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallets' AND column_name = 'stripe_customer_id') THEN
        ALTER TABLE wallets ADD COLUMN stripe_customer_id TEXT;
        CREATE INDEX idx_wallets_stripe_customer_id ON wallets(stripe_customer_id);
    END IF;

    -- Also add tier columns if they don't exist (though task didn't explicitly ask, usually needed for syncing)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallets' AND column_name = 'tier') THEN
         ALTER TABLE wallets ADD COLUMN tier TEXT DEFAULT 'wanderer'; -- wanderer, soul_weaver, architect, titan
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallets' AND column_name = 'tier_expires_at') THEN
         ALTER TABLE wallets ADD COLUMN tier_expires_at TIMESTAMPTZ;
    END IF;
END $$;
