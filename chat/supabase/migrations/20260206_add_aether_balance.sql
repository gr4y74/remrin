-- Migration: Add Aether Balance to Profiles
-- This enables the credit system for AI Studio

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS aether_balance INTEGER DEFAULT 100; -- Start with 100 free credits

-- Update RLS if necessary (usually profiles are already public-read, owner-write)
