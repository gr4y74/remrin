-- ═══════════════════════════════════════════════════════════════
-- NOTIFICATIONS SYSTEM MIGRATION
-- ═══════════════════════════════════════════════════════════════

-- Extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. User Profiles (Central Source of Truth)
-- Using IF NOT EXISTS to avoid errors if already present
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Content Table (Generic table for likes/comments)
CREATE TABLE IF NOT EXISTS content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type VARCHAR(50), -- e.g., 'post', 'moment', 'persona'
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. User Subscribers (User-to-User)
CREATE TABLE IF NOT EXISTS user_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscriber_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscribed_to_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(subscriber_id, subscribed_to_id)
);

CREATE INDEX IF NOT EXISTS idx_subscribed_to ON user_subscribers(subscribed_to_id);

-- 4. User Connections (Networking/Friends)
CREATE TABLE IF NOT EXISTS user_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  connected_to_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, rejected
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, connected_to_id)
);

CREATE INDEX IF NOT EXISTS idx_connected_to ON user_connections(connected_to_id);

-- 5. Content Likes
CREATE TABLE IF NOT EXISTS content_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id UUID REFERENCES content(id) ON DELETE CASCADE,
  content_type VARCHAR(50), -- post, comment, image, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, content_id)
);

CREATE INDEX IF NOT EXISTS idx_content_likes ON content_likes(content_id);

-- 6. Content Comments
CREATE TABLE IF NOT EXISTS content_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id UUID REFERENCES content(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  parent_comment_id UUID REFERENCES content_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_comments ON content_comments(content_id);

-- 7. System Notifications
CREATE TABLE IF NOT EXISTS system_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50), -- info, warning, success, error
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_notifications ON system_notifications(user_id, is_read);

-- 8. Functions & Triggers

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_notifications()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, username, avatar_url)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)), 
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for user creation
DROP TRIGGER IF EXISTS on_auth_user_created_notifications ON auth.users;
CREATE TRIGGER on_auth_user_created_notifications
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_notifications();

-- 9. Row Level Security

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_notifications ENABLE ROW LEVEL SECURITY;

-- User Profiles: Everyone can read, users can update their own
CREATE POLICY "Profiles are viewable by everyone" ON user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Content: Everyone can read, authors can update/delete
CREATE POLICY "Content viewable by everyone" ON content
  FOR SELECT USING (true);

CREATE POLICY "Users can create content" ON content
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Subscribers: Users can see their own subscribers
CREATE POLICY "Users can view their subscribers" ON user_subscribers
  FOR SELECT USING (auth.uid() = subscribed_to_id OR auth.uid() = subscriber_id);

CREATE POLICY "Users can subscribe to others" ON user_subscribers
  FOR INSERT WITH CHECK (auth.uid() = subscriber_id);

-- Connections: Users can see their own connections
CREATE POLICY "Users can view own connections" ON user_connections
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = connected_to_id);

CREATE POLICY "Users can manage own connections" ON user_connections
  FOR ALL USING (auth.uid() = user_id OR auth.uid() = connected_to_id);

-- Likes: Everyone can read, users can manage their own
CREATE POLICY "Likes viewable by everyone" ON content_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own likes" ON content_likes
  FOR ALL USING (auth.uid() = user_id);

-- Comments: Everyone can read, users can manage their own
CREATE POLICY "Comments viewable by everyone" ON content_comments
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own comments" ON content_comments
  FOR ALL USING (auth.uid() = user_id);

-- System Notifications: Users can only see their own
CREATE POLICY "Users can view own notifications" ON system_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON system_notifications
  FOR UPDATE USING (auth.uid() = user_id);
