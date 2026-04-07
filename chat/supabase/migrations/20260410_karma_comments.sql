-- Comment Threading & Nesting
ALTER TABLE sudododo_comments ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES sudododo_comments(id) ON DELETE CASCADE;

-- Persistent Karma System
CREATE TABLE IF NOT EXISTS sudododo_user_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- Ties to auth.users
  post_id UUID REFERENCES sudododo_posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES sudododo_comments(id) ON DELETE CASCADE,
  vote_type INT NOT NULL CHECK (vote_type IN (-1, 1)), -- 1 for Up, -1 for Down
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id),
  UNIQUE(user_id, comment_id)
);

ALTER TABLE sudododo_user_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read" ON sudododo_user_votes FOR SELECT USING (true);
