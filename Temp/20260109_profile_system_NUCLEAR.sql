-- NUCLEAR OPTION: Drop everything first to ensure a clean slate
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS profile_analytics CASCADE;
DROP TABLE IF EXISTS profile_themes CASCADE;
DROP TABLE IF EXISTS featured_creations CASCADE;
DROP TABLE IF EXISTS social_links CASCADE;

-- Now recreate everything from scratch
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  bio TEXT,
  pronouns VARCHAR(50),
  location VARCHAR(100),
  website_url TEXT,
  hero_image_url TEXT,
  banner_url TEXT,
  qr_code_url TEXT,
  customization_json JSONB DEFAULT '{}'::jsonb,
  privacy_settings JSONB DEFAULT '{"profile": "public", "analytics": "public", "badges": "public"}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color_gradient VARCHAR(100),
  category VARCHAR(50) NOT NULL,
  rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  criteria_json JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_date TIMESTAMPTZ DEFAULT NOW(),
  is_displayed BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  UNIQUE(user_id, achievement_id)
);

CREATE TABLE profile_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_type VARCHAR(50) NOT NULL,
  value BIGINT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  date DATE NOT NULL,
  aggregation_period VARCHAR(20) DEFAULT 'daily' CHECK (aggregation_period IN ('daily', 'weekly', 'monthly')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, metric_type, date, aggregation_period)
);

CREATE TABLE profile_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme_name VARCHAR(100),
  settings_json JSONB NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE featured_creations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, persona_id)
);

CREATE TABLE social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  handle VARCHAR(100),
  url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_username ON user_profiles(username);
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_achievements_category ON achievements(category);
CREATE INDEX idx_achievements_rarity ON achievements(rarity);
CREATE INDEX idx_achievements_badge_id ON achievements(badge_id);
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_earned_date ON user_achievements(earned_date DESC);
CREATE INDEX idx_profile_analytics_user_date ON profile_analytics(user_id, date DESC);
CREATE INDEX idx_profile_analytics_metric ON profile_analytics(metric_type);
CREATE INDEX idx_featured_creations_user ON featured_creations(user_id, display_order);
CREATE INDEX idx_social_links_user ON social_links(user_id, display_order);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE featured_creations ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" ON user_profiles FOR SELECT USING (privacy_settings->>'profile' = 'public');
CREATE POLICY "Users can view their own profile" ON user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own profile" ON user_profiles FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Public badges are viewable by everyone" ON user_achievements FOR SELECT USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.user_id = user_achievements.user_id AND privacy_settings->>'badges' = 'public'));
CREATE POLICY "Users can view their own achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own achievement display" ON user_achievements FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Public analytics are viewable by everyone" ON profile_analytics FOR SELECT USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.user_id = profile_analytics.user_id AND privacy_settings->>'analytics' = 'public'));
CREATE POLICY "Users can view their own analytics" ON profile_analytics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own analytics" ON profile_analytics FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own themes" ON profile_themes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own themes" ON profile_themes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own themes" ON profile_themes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own themes" ON profile_themes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Featured creations are viewable by everyone" ON featured_creations FOR SELECT USING (true);
CREATE POLICY "Users can manage their own featured creations" ON featured_creations FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Social links are viewable by everyone" ON social_links FOR SELECT USING (true);
CREATE POLICY "Users can manage their own social links" ON social_links FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Achievements are viewable by everyone" ON achievements FOR SELECT USING (is_active = true);

CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profile_themes_updated_at ON profile_themes;
CREATE TRIGGER update_profile_themes_updated_at BEFORE UPDATE ON profile_themes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

INSERT INTO achievements (badge_id, name, description, icon, color_gradient, category, rarity, criteria_json) VALUES
('early_adopter', 'Early Adopter', 'Joined within first 100 users', 'Rocket', 'linear-gradient(180deg, #1E88E5 0%, #1565C0 100%)', 'time_based', 'rare', '{"type": "user_rank", "max_rank": 100}'),
('6_month_veteran', '6 Month Veteran', 'Active for 6 months', 'Shield', 'linear-gradient(180deg, #42A5F5 0%, #1976D2 100%)', 'time_based', 'common', '{"type": "account_age", "days": 180}'),
('1_year_anniversary', '1 Year Anniversary', 'Active for 1 year', 'Crown', 'linear-gradient(180deg, #2196F3 0%, #0D47A1 100%)', 'time_based', 'epic', '{"type": "account_age", "days": 365}'),
('legacy_member', 'Legacy Member', 'Active for 2+ years', 'Star', 'linear-gradient(180deg, #0D47A1 0%, #01579B 100%)', 'time_based', 'legendary', '{"type": "account_age", "days": 730}'),
('bug_hunter', 'Bug Hunter', 'Reported 5+ valid bugs', 'Bug', 'linear-gradient(180deg, #43A047 0%, #2E7D32 100%)', 'contribution', 'rare', '{"type": "bug_reports", "count": 5}'),
('feature_pioneer', 'Feature Pioneer', 'Suggested accepted feature', 'Lightbulb', 'linear-gradient(180deg, #66BB6A 0%, #388E3C 100%)', 'contribution', 'epic', '{"type": "feature_suggestions", "count": 1}'),
('community_helper', 'Community Helper', 'Helped 50+ users', 'Heart', 'linear-gradient(180deg, #81C784 0%, #43A047 100%)', 'contribution', 'rare', '{"type": "help_count", "count": 50}'),
('diamond_status', 'Diamond Status', 'Staff awarded for exceptional contribution', 'Diamond', 'linear-gradient(180deg, #9C27B0 0%, #6A1B9A 100%)', 'special', 'legendary', '{"type": "staff_awarded"}'),
('beta_tester', 'Beta Tester', 'Participated in beta testing', 'Flask', 'linear-gradient(180deg, #AB47BC 0%, #7B1FA2 100%)', 'special', 'epic', '{"type": "beta_participant"}'),
('content_creator', 'Content Creator', 'Created 100+ quality characters', 'Palette', 'linear-gradient(180deg, #BA68C8 0%, #8E24AA 100%)', 'special', 'rare', '{"type": "creation_count", "count": 100}'),
('first_steps', 'First Steps', 'Created first character', 'Footprints', 'linear-gradient(180deg, #FFA726 0%, #F57C00 100%)', 'activity', 'common', '{"type": "creation_count", "count": 1}'),
('prolific_creator', 'Prolific Creator', '100+ creations', 'Sparkles', 'linear-gradient(180deg, #FF9800 0%, #E65100 100%)', 'activity', 'epic', '{"type": "creation_count", "count": 100}'),
('social_butterfly', 'Social Butterfly', '1000+ messages sent', 'Users', 'linear-gradient(180deg, #FFB74D 0%, #FB8C00 100%)', 'activity', 'rare', '{"type": "message_count", "count": 1000}'),
('dedicated_user', 'Dedicated User', 'Logged in 100+ days', 'Calendar', 'linear-gradient(180deg, #FFCC80 0%, #F57C00 100%)', 'activity', 'rare', '{"type": "login_days", "count": 100}'),
('trendsetter', 'Trendsetter', 'Creation reached 10k views', 'Flame', 'linear-gradient(180deg, #EF5350 0%, #C62828 100%)', 'engagement', 'epic', '{"type": "creation_views", "count": 10000}'),
('beloved_creator', 'Beloved Creator', 'Received 1000+ favorites', 'Heart', 'linear-gradient(180deg, #EC407A 0%, #C2185B 100%)', 'engagement', 'legendary', '{"type": "favorites_received", "count": 1000}'),
('influencer', 'Influencer', '1000+ followers', 'Megaphone', 'linear-gradient(180deg, #F48FB1 0%, #D81B60 100%)', 'engagement', 'epic', '{"type": "follower_count", "count": 1000}'),
('viral_creator', 'Viral Creator', 'Creation reached 100k views', 'TrendingUp', 'linear-gradient(180deg, #F06292 0%, #AD1457 100%)', 'engagement', 'legendary', '{"type": "creation_views", "count": 100000}'),
('10_creations', '10 Creations', 'Created 10 characters', 'CheckCircle', 'linear-gradient(180deg, #26C6DA 0%, #00ACC1 100%)', 'milestone', 'common', '{"type": "creation_count", "count": 10}'),
('50_creations', '50 Creations', 'Created 50 characters', 'Award', 'linear-gradient(180deg, #00BCD4 0%, #0097A7 100%)', 'milestone', 'rare', '{"type": "creation_count", "count": 50}'),
('200_creations', '200 Creations', 'Created 200 characters', 'Trophy', 'linear-gradient(180deg, #00ACC1 0%, #006064 100%)', 'milestone', 'legendary', '{"type": "creation_count", "count": 200}')
ON CONFLICT (badge_id) DO NOTHING;
