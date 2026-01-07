-- Notifications and Social System Migration
-- Run this in Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. System Notifications
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

-- 2. User Subscribers
CREATE TABLE IF NOT EXISTS user_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscriber_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscribed_to_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(subscriber_id, subscribed_to_id)
);

CREATE INDEX IF NOT EXISTS idx_subscribed_to ON user_subscribers(subscribed_to_id);

-- 3. Content & Likes (Required for notifications queries)
CREATE TABLE IF NOT EXISTS content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type VARCHAR(50),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS content_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id UUID REFERENCES content(id) ON DELETE CASCADE,
  content_type VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, content_id)
);

CREATE TABLE IF NOT EXISTS content_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id UUID REFERENCES content(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  parent_comment_id UUID REFERENCES content_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  connected_to_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, connected_to_id)
);

-- 4. User Profiles (Compatibility Layer for Notifications)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50),
  display_name VARCHAR(100),
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Populate user_profiles from existing profiles table if empty
INSERT INTO user_profiles (id, username, display_name, avatar_url, bio)
SELECT user_id, username, display_name, image_url, bio 
FROM profiles 
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  display_name = EXCLUDED.display_name,
  avatar_url = EXCLUDED.avatar_url,
  bio = EXCLUDED.bio;

-- RLS Policies
ALTER TABLE system_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Basic Policies (Permissive for now to ensure visibility)
CREATE POLICY "Users can view own notifications" ON system_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON system_notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Subscribers public read" ON user_subscribers FOR SELECT USING (true);
CREATE POLICY "Users subscribe" ON user_subscribers FOR INSERT WITH CHECK (auth.uid() = subscriber_id);

CREATE POLICY "Content public read" ON content FOR SELECT USING (true);
CREATE POLICY "Likes public read" ON content_likes FOR SELECT USING (true);
CREATE POLICY "Comments public read" ON content_comments FOR SELECT USING (true);
CREATE POLICY "Connections public read" ON user_connections FOR SELECT USING (true);

CREATE POLICY "User profiles public read" ON user_profiles FOR SELECT USING (true);
