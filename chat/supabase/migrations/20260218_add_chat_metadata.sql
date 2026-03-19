-- Add title and is_starred columns to chats table
ALTER TABLE public.chats 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS is_starred BOOLEAN DEFAULT false;

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_chats_user_id_starred ON public.chats(user_id, is_starred) WHERE is_starred = true;
