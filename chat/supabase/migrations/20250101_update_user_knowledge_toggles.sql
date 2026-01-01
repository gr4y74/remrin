-- Add is_active and is_shared columns to user_knowledge
ALTER TABLE user_knowledge 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT false;

-- Re-create policies or ensure they still work? 
-- The existing policies use user_id, which remains. 
-- No changes needed to policies for now as they are per-user.
