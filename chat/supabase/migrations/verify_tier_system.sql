-- ═══════════════════════════════════════════════════════════════
-- TIER SYSTEM VERIFICATION QUERIES
-- ═══════════════════════════════════════════════════════════════

-- 1. Check all tables exist
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'tier_features', 
  'llm_providers', 
  'tier_change_history', 
  'stripe_webhook_events', 
  'tier_price_mapping'
);
-- Expected: 5 rows

-- 2. Check features seeded
SELECT COUNT(*) as feature_count FROM tier_features;
-- Expected: 11

-- 3. Check LLM providers seeded
SELECT COUNT(*) as provider_count FROM llm_providers WHERE is_active = true;
-- Expected: 4

-- 4. View all features
SELECT 
  feature_key, 
  feature_name, 
  wanderer_enabled, 
  soul_weaver_enabled, 
  architect_enabled, 
  titan_enabled
FROM tier_features
ORDER BY category, feature_name;

-- 5. View all LLM providers
SELECT 
  provider_key, 
  provider_name, 
  min_tier_index,
  default_model,
  is_active
FROM llm_providers
ORDER BY min_tier_index;

-- 6. Check functions exist
SELECT proname 
FROM pg_proc 
WHERE proname IN (
  'update_user_tier', 
  'handle_subscription_change', 
  'sync_all_user_tiers',
  'get_tier_from_price_id'
);
-- Expected: 4 rows

-- 7. Check trigger exists
SELECT tgname 
FROM pg_trigger 
WHERE tgname = 'auto_update_tier_on_subscription';
-- Expected: 1 row

-- 8. Check wallets columns added
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'wallets' 
AND column_name IN ('preferred_llm_provider', 'llm_settings');
-- Expected: 2 rows

-- 9. Check user_limits tier column
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'user_limits' 
AND column_name = 'tier';
-- Expected: 1 row

-- 10. Check price mappings
SELECT 
  stripe_price_id, 
  tier, 
  tier_name, 
  is_active 
FROM tier_price_mapping;
-- Expected: 4 rows

-- ═══════════════════════════════════════════════════════════════
-- ALL CHECKS PASSED = TIER SYSTEM READY! 🎉
-- ═══════════════════════════════════════════════════════════════
