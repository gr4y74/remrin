-- SudoDodo - User Intelligence & Profile Metadata

-- 1. SudoDodo User Meta (Extends Remrin Profiles)
CREATE TABLE IF NOT EXISTS sudododo_user_meta (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  experience_level TEXT DEFAULT 'newcomer', -- 'newcomer', 'hopper', 'expert'
  primary_distro TEXT,
  hardware_summary JSONB DEFAULT '{}'::jsonb,
  karma_score INT DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  specialist_access BOOLEAN DEFAULT true, -- Allows access to The Dodo
  is_verified_linux_user BOOLEAN DEFAULT false
);

-- RLS
ALTER TABLE sudododo_user_meta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own meta" 
ON sudododo_user_meta FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own meta" 
ON sudododo_user_meta FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Public can view karma/level" 
ON sudododo_user_meta FOR SELECT 
USING (true);
