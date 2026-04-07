-- SudoDodo - Distro Intelligence & Community Schema

-- Communities (r/DistroName)
CREATE TABLE IF NOT EXISTS sudododo_communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  theme_color TEXT DEFAULT '#3b82f6',
  tagline TEXT,
  description TEXT,
  members_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hardware Models / Matrix
CREATE TABLE IF NOT EXISTS sudododo_hardware (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manufacturer TEXT NOT NULL,
  model_name TEXT NOT NULL,
  category TEXT, -- 'laptop', 'desktop', 'component'
  UNIQUE(manufacturer, model_name)
);

-- Distro Hubs & Intelligence
CREATE TABLE IF NOT EXISTS sudododo_distro_intel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES sudododo_communities(id),
  tux_score INT DEFAULT 0,
  monthly_installs TEXT, 
  user_rating DECIMAL(3,2),
  beginner_friendliness TEXT DEFAULT 'mid',
  latest_version TEXT,
  rank_position INT,
  distrowatch_hit_rank INT, -- Legacy ranking context
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Hardware Compatibility Matrix (Flat for now, can be expanded to JSONB for details)
  hardware_compatibility JSONB DEFAULT '[]'::jsonb, 
  package_data JSONB DEFAULT '{}'::jsonb -- For Repology data
);

-- Example row for ThinkPad X1
-- INSERT INTO sudododo_hardware (manufacturer, model_name, category) VALUES ('Lenovo', 'ThinkPad X1 Carbon Gen 6', 'laptop');

-- Posts
CREATE TABLE IF NOT EXISTS sudododo_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES sudododo_communities(id),
  author_name TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  media_url TEXT,
  media_type TEXT, 
  flair TEXT,
  upvotes INT DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments
CREATE TABLE IF NOT EXISTS sudododo_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES sudododo_posts(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  upvotes INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE sudododo_communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE sudododo_hardware ENABLE ROW LEVEL SECURITY;
ALTER TABLE sudododo_distro_intel ENABLE ROW LEVEL SECURITY;
ALTER TABLE sudododo_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sudododo_comments ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public Read" ON sudododo_communities FOR SELECT USING (true);
CREATE POLICY "Public Read" ON sudododo_hardware FOR SELECT USING (true);
CREATE POLICY "Public Read" ON sudododo_distro_intel FOR SELECT USING (true);
CREATE POLICY "Public Read" ON sudododo_posts FOR SELECT USING (true);
CREATE POLICY "Public Read" ON sudododo_comments FOR SELECT USING (true);
