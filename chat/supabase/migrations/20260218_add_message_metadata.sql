-- Migration to add metadata column to messages table
-- This is used for storing feedback (likes/dislikes), tool calls, and other structured data.

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'messages' 
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE messages ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;
