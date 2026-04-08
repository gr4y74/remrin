-- SudoDodo v2.0 Global Voting System
CREATE TABLE IF NOT EXISTS sudododo_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- Ties to auth.users
  post_id UUID REFERENCES sudododo_posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES sudododo_comments(id) ON DELETE CASCADE,
  value SMALLINT NOT NULL CHECK (value IN (-1, 1)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT one_vote_per_post UNIQUE (user_id, post_id),
  CONSTRAINT one_vote_per_comment UNIQUE (user_id, comment_id),
  CONSTRAINT vote_target CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NOT NULL)
  )
);

-- RLS for Votes
ALTER TABLE sudododo_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Votes" ON sudododo_votes FOR SELECT USING (true);
CREATE POLICY "User Cast Votes" ON sudododo_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User Update Votes" ON sudododo_votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "User Delete Votes" ON sudododo_votes FOR DELETE USING (auth.uid() = user_id);

-- Vote Logic Functions
CREATE OR REPLACE FUNCTION get_sudododo_vote_score(p_post_id UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(SUM(value), 0)::INTEGER FROM sudododo_votes WHERE post_id = p_post_id;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION get_user_sudododo_vote(p_post_id UUID, p_user_id UUID)
RETURNS SMALLINT AS $$
  SELECT value FROM sudododo_votes
  WHERE post_id = p_post_id AND user_id = p_user_id LIMIT 1;
$$ LANGUAGE sql STABLE;
