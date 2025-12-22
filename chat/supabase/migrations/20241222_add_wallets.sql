-- Wallet System for Aether Credits
-- Created: 2024-12-22

CREATE TABLE wallets (
    user_id TEXT PRIMARY KEY,
    balance_aether INTEGER DEFAULT 100 NOT NULL,  -- Starting credits
    balance_brain INTEGER DEFAULT 1000 NOT NULL,  -- LLM usage credits
    is_creator BOOLEAN DEFAULT false,
    total_earned INTEGER DEFAULT 0,
    total_spent INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_wallets_user_id ON wallets(user_id);

-- RLS
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet"
ON wallets FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can update own wallet"
ON wallets FOR UPDATE USING (user_id = auth.uid()::text);

-- Auto-create wallet on user signup
CREATE OR REPLACE FUNCTION create_wallet_for_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO wallets (user_id) VALUES (NEW.id::text);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_create_wallet
    AFTER INSERT ON auth.users FOR EACH ROW
    EXECUTE FUNCTION create_wallet_for_user();

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_wallet_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_wallet_updated_at
    BEFORE UPDATE ON wallets FOR EACH ROW
    EXECUTE FUNCTION update_wallet_updated_at();
