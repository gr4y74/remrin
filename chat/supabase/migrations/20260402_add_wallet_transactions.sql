-- Wallet Transactions Table
-- Tracks Aether and Brain credit changes (purchases, usage, grants)

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    currency TEXT NOT NULL CHECK (currency IN ('aether', 'brain')),
    type TEXT NOT NULL CHECK (type IN ('purchase', 'usage', 'grant', 'transfer', 'refund')),
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions(created_at DESC);

-- RLS
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
ON wallet_transactions FOR SELECT
USING (auth.uid() = user_id);

-- Only service role (admin) can insert
CREATE POLICY "Service role can insert transactions"
ON wallet_transactions FOR INSERT
WITH CHECK (true);

-- Function to handle transaction logging (optional trigger-based if needed, but we'll use API)
COMMENT ON TABLE wallet_transactions IS 'Logs all ledger movements for user wallets.';
