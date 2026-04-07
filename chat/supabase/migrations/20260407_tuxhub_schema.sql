-- Sudo Dodo / TuxHub - Community & Ranking Schema

-- Communities (r/DistroName)
CREATE TABLE IF NOT EXISTS tuxhub_communities (
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

-- Distro Rankings Data
CREATE TABLE IF NOT EXISTS tuxhub_distro_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES tuxhub_communities(id),
  tux_score INT DEFAULT 0,
  monthly_installs TEXT, -- stored as string for formatted display (e.g. "2.1M")
  user_rating DECIMAL(3,2),
  beginner_friendliness TEXT DEFAULT 'mid', -- 'yes', 'mid', 'no'
  hardware_compatibility_json JSONB,
  latest_version TEXT,
  rank_position INT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Posts
CREATE TABLE IF NOT EXISTS tuxhub_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES tuxhub_communities(id),
  author_name TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  media_url TEXT,
  media_type TEXT, -- 'image', 'video', 'link'
  flair TEXT,
  flair_type TEXT, -- 'guide', 'news', etc.
  upvotes INT DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments
CREATE TABLE IF NOT EXISTS tuxhub_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES tuxhub_posts(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  upvotes INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE tuxhub_communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tuxhub_distro_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tuxhub_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tuxhub_comments ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public Read Communities" ON tuxhub_communities FOR SELECT USING (true);
CREATE POLICY "Public Read Rankings" ON tuxhub_distro_rankings FOR SELECT USING (true);
CREATE POLICY "Public Read Posts" ON tuxhub_posts FOR SELECT USING (true);
CREATE POLICY "Public Read Comments" ON tuxhub_comments FOR SELECT USING (true);

-- Mock seed data
INSERT INTO tuxhub_communities (name, slug, icon, theme_color, tagline)
VALUES 
  ('r/PopOS', 'popos', '🚀', '#48a999', 'The Linux distro that gets out of your way'),
  ('r/Fedora', 'fedora', '🔴', '#3c2fb5', 'Cutting-edge. Pure. GNOME.'),
  ('r/ArchLinux', 'arch', '🏔️', '#1793d1', 'A simple, lightweight distribution');
