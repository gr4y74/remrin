-- Backfill user_profiles from existing profiles table
-- This migration creates user_profiles entries for all existing users who don't have one

INSERT INTO user_profiles (user_id, username, display_name, bio, privacy_settings, customization_json)
SELECT 
    p.user_id,
    p.username,
    p.display_name,
    COALESCE(p.bio, ''),
    '{"profile":"public","analytics":"private","badges":"public"}'::jsonb,
    '{"theme":"default","accentColor":"#eb6f92"}'::jsonb
FROM profiles p
WHERE p.user_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM user_profiles up WHERE up.user_id = p.user_id
);

-- Show how many profiles were migrated
SELECT COUNT(*) as migrated_count FROM user_profiles;
