-- ============================================================================
-- PROFILE SYSTEM VERIFICATION SCRIPT
-- Run this in Supabase SQL Editor to verify the migration was applied
-- ============================================================================

-- Check if all tables exist
SELECT 
  'user_profiles' as table_name,
  EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_profiles') as exists
UNION ALL
SELECT 
  'achievements',
  EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'achievements')
UNION ALL
SELECT 
  'user_achievements',
  EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_achievements')
UNION ALL
SELECT 
  'profile_analytics',
  EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profile_analytics')
UNION ALL
SELECT 
  'profile_themes',
  EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profile_themes')
UNION ALL
SELECT 
  'featured_creations',
  EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'featured_creations')
UNION ALL
SELECT 
  'social_links',
  EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'social_links');

-- Check achievement count
SELECT 
  'Total Achievements' as metric,
  COUNT(*)::text as value
FROM achievements;

-- List all achievements by category
SELECT 
  category,
  COUNT(*) as count,
  array_agg(name ORDER BY rarity DESC) as achievement_names
FROM achievements
GROUP BY category
ORDER BY category;

-- Check RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN (
  'user_profiles', 
  'achievements', 
  'user_achievements', 
  'profile_analytics', 
  'profile_themes', 
  'featured_creations', 
  'social_links'
)
ORDER BY tablename;

-- Count policies per table
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN (
  'user_profiles', 
  'achievements', 
  'user_achievements', 
  'profile_analytics', 
  'profile_themes', 
  'featured_creations', 
  'social_links'
)
GROUP BY tablename
ORDER BY tablename;

-- Check indexes
SELECT 
  tablename,
  indexname
FROM pg_indexes
WHERE tablename IN (
  'user_profiles', 
  'achievements', 
  'user_achievements', 
  'profile_analytics', 
  'profile_themes', 
  'featured_creations', 
  'social_links'
)
ORDER BY tablename, indexname;
