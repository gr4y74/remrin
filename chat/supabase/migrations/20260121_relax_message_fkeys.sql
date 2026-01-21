-- Migration: Relax Foreign Key Constraints for AI Bots
-- This allows persona IDs to be used in message tables

-- 1. Direct Messages
ALTER TABLE public.direct_messages DROP CONSTRAINT IF EXISTS direct_messages_from_user_id_fkey;
ALTER TABLE public.direct_messages DROP CONSTRAINT IF EXISTS direct_messages_to_user_id_fkey;

-- 2. Chat Messages (Room Messages)
ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_user_id_fkey;

-- 3. Add a check or just leave it open for UUIDs
-- We want to keep the data integrity for humans where possible, but allow bots.
-- For now, removing the strict auth.users constraint is the simplest path for the chat engine.
