-- Add index for finding personas by owner (Studio dashboard)
CREATE INDEX IF NOT EXISTS idx_personas_owner_id ON personas(owner_id);

-- Add index for filtering chats by assistant and date (Analytics)
CREATE INDEX IF NOT EXISTS idx_chats_assistant_created ON chats(assistant_id, created_at);

-- Add index for finding messages in a chat ordered by time (Chat history)
CREATE INDEX IF NOT EXISTS idx_messages_chat_created ON messages(chat_id, created_at);

-- Add index for finding recent user messages across chats (Analytics activity feed, user history)
CREATE INDEX IF NOT EXISTS idx_messages_user_role_created ON messages(user_id, role, created_at);

-- Add index for filtering files by user (Knowledge Vault)
CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);

-- Add index for sorting persona stats (Leaderboard)
CREATE INDEX IF NOT EXISTS idx_persona_stats_total_chats ON persona_stats(total_chats DESC);
