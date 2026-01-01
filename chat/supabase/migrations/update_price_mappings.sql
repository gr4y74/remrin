-- ═══════════════════════════════════════════════════════════════
-- UPDATE STRIPE PRICE MAPPINGS
-- ═══════════════════════════════════════════════════════════════
--
-- Replace the placeholder price IDs with your actual Stripe price IDs
-- Get these from: https://dashboard.stripe.com/products
--
-- ═══════════════════════════════════════════════════════════════

-- Update existing mappings with your actual Stripe price IDs
UPDATE tier_price_mapping 
SET stripe_price_id = 'price_YOUR_FREE_TIER_ID'  -- Replace this
WHERE tier = 'wanderer';

UPDATE tier_price_mapping 
SET stripe_price_id = 'price_YOUR_PRO_TIER_ID'  -- Replace this
WHERE tier = 'soul_weaver';

UPDATE tier_price_mapping 
SET stripe_price_id = 'price_YOUR_PREMIUM_TIER_ID'  -- Replace this
WHERE tier = 'architect';

UPDATE tier_price_mapping 
SET stripe_price_id = 'price_YOUR_ENTERPRISE_TIER_ID'  -- Replace this
WHERE tier = 'titan';

-- Or add new price mappings (for multiple billing periods)
-- Example: Monthly and Annual pricing

INSERT INTO tier_price_mapping (stripe_price_id, tier, tier_name, is_active)
VALUES
  -- Soul Weaver (Pro)
  ('price_YOUR_PRO_MONTHLY_ID', 'soul_weaver', 'Soul Weaver Monthly', true),
  ('price_YOUR_PRO_ANNUAL_ID', 'soul_weaver', 'Soul Weaver Annual', true),
  
  -- Architect (Premium)
  ('price_YOUR_PREMIUM_MONTHLY_ID', 'architect', 'Architect Monthly', true),
  ('price_YOUR_PREMIUM_ANNUAL_ID', 'architect', 'Architect Annual', true),
  
  -- Titan (Enterprise)
  ('price_YOUR_ENTERPRISE_MONTHLY_ID', 'titan', 'Titan Monthly', true),
  ('price_YOUR_ENTERPRISE_ANNUAL_ID', 'titan', 'Titan Annual', true)
ON CONFLICT (stripe_price_id) 
DO UPDATE SET 
  tier = EXCLUDED.tier,
  tier_name = EXCLUDED.tier_name,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- View current mappings
SELECT 
  stripe_price_id, 
  tier, 
  tier_name, 
  is_active,
  created_at
FROM tier_price_mapping
ORDER BY tier, tier_name;
