-- ============================================================================
-- REMRIN.AI SOCIAL NETWORK SCHEMA
-- Migration: 20260111_social_network_schema
-- Agent: Alpha (Database Architect)
-- Description: Complete social network features including posts, engagement,
--              analytics, highlights, notifications, and customization
-- ============================================================================

-- ============================================================================
-- POSTS & FEED SYSTEM
-- ============================================================================

-- 1. POSTS TABLE
-- User-generated content with multiple types and visibility levels
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    media_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
    post_type VARCHAR(50) DEFAULT 'text' CHECK (post_type IN ('text', 'image', 'character_showcase', 'achievement_share')),
    visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'private')),
    persona_id UUID REFERENCES personas(id) ON DELETE SET NULL,
    achievement_id UUID REFERENCES achievements(id) ON DELETE SET NULL,
    view_count BIGINT DEFAULT 0,
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for posts
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_visibility ON posts(visibility);
CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(post_type);
CREATE INDEX IF NOT EXISTS idx_posts_persona_id ON posts(persona_id);
CREATE INDEX IF NOT EXISTS idx_posts_user_created ON posts(user_id, created_at DESC);

-- ============================================================================
-- ENGAGEMENT SYSTEM
-- ============================================================================

-- 0. USER FOLLOWS
-- Social graph for user relationships
CREATE TABLE IF NOT EXISTS user_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id <> following_id)
);

-- Indexes for follows
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_created ON user_follows(created_at DESC);


-- 2. POST REACTIONS
-- Multiple reaction types per post
CREATE TABLE IF NOT EXISTS post_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reaction_type VARCHAR(20) NOT NULL CHECK (reaction_type IN ('like', 'love', 'celebrate', 'insightful')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Indexes for reactions
CREATE INDEX IF NOT EXISTS idx_post_reactions_post_id ON post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_user_id ON post_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_type ON post_reactions(reaction_type);

-- 3. POST COMMENTS
-- Nested comments with 1-level replies
CREATE TABLE IF NOT EXISTS post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    mentioned_users UUID[] DEFAULT ARRAY[]::UUID[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for comment depth
CREATE OR REPLACE FUNCTION check_comment_depth()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.parent_comment_id IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM post_comments
            WHERE id = NEW.parent_comment_id
            AND parent_comment_id IS NOT NULL
        ) THEN
            RAISE EXCEPTION 'Nesting level exceeded: Comments only support one level of replies.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_check_comment_depth
BEFORE INSERT OR UPDATE ON post_comments
FOR EACH ROW
EXECUTE FUNCTION check_comment_depth();

-- Indexes for comments
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_parent_id ON post_comments(parent_comment_id);

-- 4. POST SHARES
-- Repost/share functionality
CREATE TABLE IF NOT EXISTS post_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    commentary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Indexes for shares
CREATE INDEX IF NOT EXISTS idx_post_shares_post_id ON post_shares(post_id);
CREATE INDEX IF NOT EXISTS idx_post_shares_user_id ON post_shares(user_id, created_at DESC);

-- ============================================================================
-- ANALYTICS SYSTEM
-- ============================================================================

-- 5. PROFILE VIEWS
-- Track profile view counts with privacy
CREATE TABLE IF NOT EXISTS profile_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    viewer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    view_date DATE NOT NULL DEFAULT CURRENT_DATE,
    view_count INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(profile_user_id, viewer_user_id, view_date)
);

-- Indexes for profile views
CREATE INDEX IF NOT EXISTS idx_profile_views_profile_user ON profile_views(profile_user_id, view_date DESC);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewer ON profile_views(viewer_user_id);

-- 6. POST ANALYTICS
-- Detailed post engagement metrics
CREATE TABLE IF NOT EXISTS post_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
    views BIGINT DEFAULT 0,
    reactions BIGINT DEFAULT 0,
    comments BIGINT DEFAULT 0,
    shares BIGINT DEFAULT 0,
    engagement_rate DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, metric_date)
);

-- Indexes for post analytics
CREATE INDEX IF NOT EXISTS idx_post_analytics_post_id ON post_analytics(post_id, metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_post_analytics_date ON post_analytics(metric_date DESC);

-- 7. FOLLOWER GROWTH
-- Historical follower count tracking
CREATE TABLE IF NOT EXISTS follower_growth (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    growth_date DATE NOT NULL DEFAULT CURRENT_DATE,
    follower_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    net_change INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, growth_date)
);

-- Indexes for follower growth
CREATE INDEX IF NOT EXISTS idx_follower_growth_user_date ON follower_growth(user_id, growth_date DESC);

-- 8. ACTIVITY HEATMAP
-- User activity patterns by hour and day
CREATE TABLE IF NOT EXISTS activity_heatmap (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_date DATE NOT NULL,
    hour_of_day INTEGER NOT NULL CHECK (hour_of_day >= 0 AND hour_of_day <= 23),
    activity_count INTEGER DEFAULT 0,
    activity_types JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, activity_date, hour_of_day)
);

-- Indexes for activity heatmap
CREATE INDEX IF NOT EXISTS idx_activity_heatmap_user_date ON activity_heatmap(user_id, activity_date DESC);

-- ============================================================================
-- HIGHLIGHTS SYSTEM
-- ============================================================================

-- 9. PINNED POSTS
-- User-selected pinned posts (max 3)
CREATE TABLE IF NOT EXISTS pinned_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0 CHECK (display_order >= 0 AND display_order <= 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, post_id),
    UNIQUE(user_id, display_order)
);

-- Indexes for pinned posts
CREATE INDEX IF NOT EXISTS idx_pinned_posts_user ON pinned_posts(user_id, display_order);

-- 10. FEATURED ACHIEVEMENTS
-- Showcase specific achievements (extends user_achievements)
CREATE TABLE IF NOT EXISTS featured_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, achievement_id),
    UNIQUE(user_id, display_order)
);

-- Indexes for featured achievements
CREATE INDEX IF NOT EXISTS idx_featured_achievements_user ON featured_achievements(user_id, display_order);

-- 11. SHOWCASE ITEMS
-- Generic showcase system for polymorphic content
CREATE TABLE IF NOT EXISTS showcase_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('post', 'achievement', 'persona', 'custom')),
    item_id UUID NOT NULL,
    title VARCHAR(200),
    description TEXT,
    thumbnail_url TEXT,
    display_order INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, item_type, item_id)
);

-- Indexes for showcase items
CREATE INDEX IF NOT EXISTS idx_showcase_items_user ON showcase_items(user_id, display_order);
CREATE INDEX IF NOT EXISTS idx_showcase_items_type ON showcase_items(item_type);

-- ============================================================================
-- NOTIFICATIONS SYSTEM
-- ============================================================================

-- 12. NOTIFICATIONS
-- Unified notification system
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN (
        'follow', 'post_reaction', 'comment', 'mention', 'share', 
        'achievement_earned', 'post_comment_reply', 'milestone'
    )),
    entity_type VARCHAR(50),
    entity_id UUID,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    action_url TEXT,
    is_read BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);

-- 13. NOTIFICATION PREFERENCES
-- User-configurable notification settings
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    email_enabled BOOLEAN DEFAULT false,
    push_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, notification_type)
);

-- Indexes for notification preferences
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id);

-- ============================================================================
-- CUSTOMIZATION SYSTEM
-- ============================================================================

-- 14. CUSTOM THEMES (extends profile_themes)
-- Enhanced theme customization
CREATE TABLE IF NOT EXISTS custom_themes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    theme_name VARCHAR(100) NOT NULL,
    primary_color VARCHAR(7),
    secondary_color VARCHAR(7),
    accent_color VARCHAR(7),
    background_color VARCHAR(7),
    text_color VARCHAR(7),
    font_family VARCHAR(100),
    custom_css TEXT,
    is_active BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false,
    use_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for custom themes
CREATE INDEX IF NOT EXISTS idx_custom_themes_user ON custom_themes(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_themes_public ON custom_themes(is_public, use_count DESC);

-- 15. LAYOUT PREFERENCES
-- User layout customization
CREATE TABLE IF NOT EXISTS layout_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    layout_type VARCHAR(50) DEFAULT 'grid' CHECK (layout_type IN ('grid', 'list', 'masonry')),
    section_order JSONB DEFAULT '["posts", "achievements", "creations", "analytics"]'::jsonb,
    visible_sections JSONB DEFAULT '{"posts": true, "achievements": true, "creations": true, "analytics": true}'::jsonb,
    posts_per_page INTEGER DEFAULT 10 CHECK (posts_per_page >= 5 AND posts_per_page <= 50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Indexes for layout preferences
CREATE INDEX IF NOT EXISTS idx_layout_preferences_user ON layout_preferences(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE follower_growth ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_heatmap ENABLE ROW LEVEL SECURITY;
ALTER TABLE pinned_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE featured_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE showcase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE layout_preferences ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POSTS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Public posts are viewable by everyone" ON posts;
DROP POLICY IF EXISTS "Follower posts are viewable by followers" ON posts;
DROP POLICY IF EXISTS "Users can view their own posts" ON posts;
DROP POLICY IF EXISTS "Users can create their own posts" ON posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;

CREATE POLICY "Public posts are viewable by everyone"
    ON posts FOR SELECT
    USING (visibility = 'public');

CREATE POLICY "Follower posts are viewable by followers"
    ON posts FOR SELECT
    USING (
        visibility = 'followers' AND (
            user_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM user_follows
                WHERE follower_id = auth.uid() AND following_id = posts.user_id
            )
        )
    );

CREATE POLICY "Users can view their own posts"
    ON posts FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can create their own posts"
    ON posts FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own posts"
    ON posts FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own posts"
    ON posts FOR DELETE
    USING (user_id = auth.uid());

-- ============================================================================
-- USER FOLLOWS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view follows" ON user_follows;
DROP POLICY IF EXISTS "Users can follow others" ON user_follows;
DROP POLICY IF EXISTS "Users can unfollow others" ON user_follows;

CREATE POLICY "Anyone can view follows" ON user_follows FOR SELECT USING (true);
CREATE POLICY "Users can follow others" ON user_follows FOR INSERT WITH CHECK (follower_id = auth.uid());
CREATE POLICY "Users can unfollow others" ON user_follows FOR DELETE USING (follower_id = auth.uid());

-- ============================================================================
-- POST REACTIONS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view reactions" ON post_reactions;
DROP POLICY IF EXISTS "Users can add reactions" ON post_reactions;
DROP POLICY IF EXISTS "Users can delete their own reactions" ON post_reactions;

CREATE POLICY "Anyone can view reactions"
    ON post_reactions FOR SELECT
    USING (true);

CREATE POLICY "Users can add reactions"
    ON post_reactions FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own reactions"
    ON post_reactions FOR DELETE
    USING (user_id = auth.uid());

-- ============================================================================
-- POST COMMENTS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view comments on visible posts" ON post_comments;
DROP POLICY IF EXISTS "Users can create comments" ON post_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON post_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON post_comments;

CREATE POLICY "Anyone can view comments on visible posts"
    ON post_comments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM posts
            WHERE posts.id = post_comments.post_id
            AND (
                posts.visibility = 'public' OR
                posts.user_id = auth.uid() OR
                (posts.visibility = 'followers' AND EXISTS (
                    SELECT 1 FROM user_follows
                    WHERE follower_id = auth.uid() AND following_id = posts.user_id
                ))
            )
        )
    );

CREATE POLICY "Users can create comments"
    ON post_comments FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own comments"
    ON post_comments FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments"
    ON post_comments FOR DELETE
    USING (user_id = auth.uid());

-- ============================================================================
-- POST SHARES POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view shares" ON post_shares;
DROP POLICY IF EXISTS "Users can create shares" ON post_shares;
DROP POLICY IF EXISTS "Users can delete their own shares" ON post_shares;

CREATE POLICY "Anyone can view shares"
    ON post_shares FOR SELECT
    USING (true);

CREATE POLICY "Users can create shares"
    ON post_shares FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own shares"
    ON post_shares FOR DELETE
    USING (user_id = auth.uid());

-- ============================================================================
-- PROFILE VIEWS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own profile views" ON profile_views;
DROP POLICY IF EXISTS "System can insert profile views" ON profile_views;

CREATE POLICY "Users can view their own profile views"
    ON profile_views FOR SELECT
    USING (profile_user_id = auth.uid());

CREATE POLICY "System can insert profile views"
    ON profile_views FOR INSERT
    WITH CHECK (true);

-- ============================================================================
-- POST ANALYTICS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Post owners can view analytics" ON post_analytics;
DROP POLICY IF EXISTS "System can manage analytics" ON post_analytics;

CREATE POLICY "Post owners can view analytics"
    ON post_analytics FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM posts
            WHERE posts.id = post_analytics.post_id
            AND posts.user_id = auth.uid()
        )
    );

CREATE POLICY "System can manage analytics"
    ON post_analytics FOR ALL
    USING (true);

-- ============================================================================
-- FOLLOWER GROWTH POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own growth" ON follower_growth;
DROP POLICY IF EXISTS "System can manage growth data" ON follower_growth;

CREATE POLICY "Users can view their own growth"
    ON follower_growth FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "System can manage growth data"
    ON follower_growth FOR ALL
    USING (true);

-- ============================================================================
-- ACTIVITY HEATMAP POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own activity" ON activity_heatmap;
DROP POLICY IF EXISTS "System can manage activity data" ON activity_heatmap;

CREATE POLICY "Users can view their own activity"
    ON activity_heatmap FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "System can manage activity data"
    ON activity_heatmap FOR ALL
    USING (true);

-- ============================================================================
-- PINNED POSTS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view pinned posts" ON pinned_posts;
DROP POLICY IF EXISTS "Users can manage their own pinned posts" ON pinned_posts;

CREATE POLICY "Anyone can view pinned posts"
    ON pinned_posts FOR SELECT
    USING (true);

CREATE POLICY "Users can manage their own pinned posts"
    ON pinned_posts FOR ALL
    USING (user_id = auth.uid());

-- ============================================================================
-- FEATURED ACHIEVEMENTS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view featured achievements" ON featured_achievements;
DROP POLICY IF EXISTS "Users can manage their own featured achievements" ON featured_achievements;

CREATE POLICY "Anyone can view featured achievements"
    ON featured_achievements FOR SELECT
    USING (true);

CREATE POLICY "Users can manage their own featured achievements"
    ON featured_achievements FOR ALL
    USING (user_id = auth.uid());

-- ============================================================================
-- SHOWCASE ITEMS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view showcase items" ON showcase_items;
DROP POLICY IF EXISTS "Users can manage their own showcase items" ON showcase_items;

CREATE POLICY "Anyone can view showcase items"
    ON showcase_items FOR SELECT
    USING (true);

CREATE POLICY "Users can manage their own showcase items"
    ON showcase_items FOR ALL
    USING (user_id = auth.uid());

-- ============================================================================
-- NOTIFICATIONS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;

CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
    ON notifications FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications"
    ON notifications FOR DELETE
    USING (user_id = auth.uid());

-- ============================================================================
-- NOTIFICATION PREFERENCES POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can manage their own preferences" ON notification_preferences;

CREATE POLICY "Users can view their own preferences"
    ON notification_preferences FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own preferences"
    ON notification_preferences FOR ALL
    USING (user_id = auth.uid());

-- ============================================================================
-- CUSTOM THEMES POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view public themes" ON custom_themes;
DROP POLICY IF EXISTS "Users can view their own themes" ON custom_themes;
DROP POLICY IF EXISTS "Users can manage their own themes" ON custom_themes;

CREATE POLICY "Users can view public themes"
    ON custom_themes FOR SELECT
    USING (is_public = true);

CREATE POLICY "Users can view their own themes"
    ON custom_themes FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own themes"
    ON custom_themes FOR ALL
    USING (user_id = auth.uid());

-- ============================================================================
-- LAYOUT PREFERENCES POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own layout" ON layout_preferences;
DROP POLICY IF EXISTS "Users can manage their own layout" ON layout_preferences;

CREATE POLICY "Users can view their own layout"
    ON layout_preferences FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own layout"
    ON layout_preferences FOR ALL
    USING (user_id = auth.uid());

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Apply updated_at triggers to all tables with updated_at column
DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_post_comments_updated_at ON post_comments;
CREATE TRIGGER update_post_comments_updated_at
    BEFORE UPDATE ON post_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_post_analytics_updated_at ON post_analytics;
CREATE TRIGGER update_post_analytics_updated_at
    BEFORE UPDATE ON post_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_activity_heatmap_updated_at ON activity_heatmap;
CREATE TRIGGER update_activity_heatmap_updated_at
    BEFORE UPDATE ON activity_heatmap
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_showcase_items_updated_at ON showcase_items;
CREATE TRIGGER update_showcase_items_updated_at
    BEFORE UPDATE ON showcase_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_custom_themes_updated_at ON custom_themes;
CREATE TRIGGER update_custom_themes_updated_at
    BEFORE UPDATE ON custom_themes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_layout_preferences_updated_at ON layout_preferences;
CREATE TRIGGER update_layout_preferences_updated_at
    BEFORE UPDATE ON layout_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to increment post view count
CREATE OR REPLACE FUNCTION increment_post_views(post_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE posts
    SET view_count = view_count + 1
    WHERE id = post_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get post engagement metrics
CREATE OR REPLACE FUNCTION get_post_engagement(post_uuid UUID)
RETURNS TABLE(
    reactions_count BIGINT,
    comments_count BIGINT,
    shares_count BIGINT,
    total_engagement BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM post_reactions WHERE post_id = post_uuid),
        (SELECT COUNT(*) FROM post_comments WHERE post_id = post_uuid),
        (SELECT COUNT(*) FROM post_shares WHERE post_id = post_uuid),
        (SELECT COUNT(*) FROM post_reactions WHERE post_id = post_uuid) +
        (SELECT COUNT(*) FROM post_comments WHERE post_id = post_uuid) +
        (SELECT COUNT(*) FROM post_shares WHERE post_id = post_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user follower counts
CREATE OR REPLACE FUNCTION get_follower_counts(user_uuid UUID)
RETURNS TABLE(
    followers BIGINT,
    following BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM user_follows WHERE following_id = user_uuid),
        (SELECT COUNT(*) FROM user_follows WHERE follower_id = user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS & DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE posts IS 'User-generated posts with multiple types and visibility levels';
COMMENT ON TABLE post_reactions IS 'Reactions to posts (like, love, celebrate, insightful)';
COMMENT ON TABLE post_comments IS 'Comments on posts with 1-level nested replies';
COMMENT ON TABLE post_shares IS 'Post shares/reposts with optional commentary';
COMMENT ON TABLE profile_views IS 'Profile view tracking with daily aggregation';
COMMENT ON TABLE post_analytics IS 'Post engagement analytics and metrics';
COMMENT ON TABLE follower_growth IS 'Historical follower count tracking';
COMMENT ON TABLE activity_heatmap IS 'User activity patterns by hour and day';
COMMENT ON TABLE pinned_posts IS 'User-selected pinned posts (max 3)';
COMMENT ON TABLE featured_achievements IS 'Showcase specific achievements';
COMMENT ON TABLE showcase_items IS 'Generic showcase system for polymorphic content';
COMMENT ON TABLE notifications IS 'Unified notification system';
COMMENT ON TABLE notification_preferences IS 'User notification settings';
COMMENT ON TABLE custom_themes IS 'User-customizable profile themes';
COMMENT ON TABLE layout_preferences IS 'User layout customization preferences';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
