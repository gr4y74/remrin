-- Check existing achievements
SELECT id, name, description, icon, rarity, color_gradient 
FROM achievements 
ORDER BY created_at DESC 
LIMIT 10;

-- If no achievements exist, insert some sample ones
INSERT INTO achievements (name, description, icon, rarity, color_gradient, criteria_json)
VALUES 
    ('First Steps', 'Created your first character', '🎭', 'common', '#4A90E2 #2E5C8A', '{"type": "character_count", "value": 1}'),
    ('Character Creator', 'Created 5 characters', '✨', 'rare', '#9B59B6 #6C3483', '{"type": "character_count", "value": 5}'),
    ('Master Creator', 'Created 10 characters', '🌟', 'epic', '#E74C3C #C0392B', '{"type": "character_count", "value": 10}'),
    ('Profile Complete', 'Filled out your complete profile', '📝', 'common', '#27AE60 #1E8449', '{"type": "profile_complete"}'),
    ('Social Butterfly', 'Added 3 social links', '🦋', 'rare', '#3498DB #2874A6', '{"type": "social_links", "value": 3}'),
    ('Early Adopter', 'Joined during beta', '🚀', 'legendary', '#F39C12 #D68910', '{"type": "early_adopter"}')
ON CONFLICT (name) DO NOTHING;

-- Get your user ID (replace with actual UUID)
-- Your user ID: 2059bfbd-a3aa-4300-ac04-8ee379573da9

-- Update your user_profiles with sample data
UPDATE user_profiles 
SET 
    bio = 'AI enthusiast and character creator. Building the future of conversational AI, one persona at a time. 🤖✨',
    pronouns = 'they/them',
    location = 'San Francisco, CA',
    website_url = 'https://remrin.ai',
    banner_url = 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1500&h=500&fit=crop'
WHERE user_id = '2059bfbd-a3aa-4300-ac04-8ee379573da9';

-- Award some achievements to your profile
INSERT INTO user_achievements (user_id, achievement_id, earned_date, is_displayed, display_order)
SELECT 
    '2059bfbd-a3aa-4300-ac04-8ee379573da9',
    id,
    NOW() - (random() * interval '30 days'),
    true,
    ROW_NUMBER() OVER (ORDER BY random())
FROM achievements
LIMIT 5
ON CONFLICT (user_id, achievement_id) DO NOTHING;

-- Add some social links
INSERT INTO social_links (user_id, platform, url, handle, display_order)
VALUES 
    ('2059bfbd-a3aa-4300-ac04-8ee379573da9', 'github', 'https://github.com/remrin', '@remrin', 0),
    ('2059bfbd-a3aa-4300-ac04-8ee379573da9', 'twitter', 'https://twitter.com/remrin', '@remrin', 1),
    ('2059bfbd-a3aa-4300-ac04-8ee379573da9', 'discord', 'https://discord.gg/remrin', 'remrin#1234', 2)
ON CONFLICT (user_id, platform) DO UPDATE 
SET url = EXCLUDED.url, handle = EXCLUDED.handle;

-- Feature your top 6 personas (you'll need to get actual persona IDs)
-- First, let's see what personas you have:
SELECT id, name, description 
FROM personas 
WHERE user_id = '2059bfbd-a3aa-4300-ac04-8ee379573da9'
ORDER BY created_at DESC
LIMIT 10;
