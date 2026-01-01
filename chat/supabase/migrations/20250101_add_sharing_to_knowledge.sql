-- Migration: Add sharing columns to user_knowledge
ALTER TABLE user_knowledge 
ADD COLUMN IF NOT EXISTS shared_with_all BOOLEAN DEFAULT false;

ALTER TABLE user_knowledge 
ADD COLUMN IF NOT EXISTS persona_ids UUID[] DEFAULT '{}';

-- Update search policy to include shared items (though for now items are still filtered by user_id in the API)
-- This ensures that if we ever want to allow cross-user sharing, the schema is ready.
