-- Create subscription_tier enum type
DO $$ BEGIN
    CREATE TYPE subscription_tier AS ENUM ('wanderer', 'soul_weaver', 'architect', 'titan');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add columns to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS age_bracket TEXT,
ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT false;

-- Add tier column to wallets
ALTER TABLE wallets
ADD COLUMN IF NOT EXISTS tier subscription_tier DEFAULT 'wanderer';
