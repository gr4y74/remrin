-- SubDodo Memberships & Social Logic
CREATE TABLE IF NOT EXISTS sudododo_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- Ties to auth.users
  community_id UUID REFERENCES sudododo_communities(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'contributor', 'moderator')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, community_id)
);

-- RLS for Memberships
ALTER TABLE sudododo_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Memberships" ON sudododo_memberships FOR SELECT USING (true);
CREATE POLICY "User Join Communities" ON sudododo_memberships FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User Leave Communities" ON sudododo_memberships FOR DELETE USING (auth.uid() = user_id);

-- Update Community Member Count Function
CREATE OR REPLACE FUNCTION update_community_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE sudododo_communities SET members_count = members_count + 1 WHERE id = NEW.community_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE sudododo_communities SET members_count = members_count - 1 WHERE id = OLD.community_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_update_member_count
AFTER INSERT OR DELETE ON sudododo_memberships
FOR EACH ROW EXECUTE FUNCTION update_community_member_count();
