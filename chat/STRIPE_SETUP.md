# Stripe Integration Setup Guide

## 🔑 Environment Variables

Add these to your `.env.local`:

```bash
# Stripe Keys (you already have these)
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# LLM Provider Keys (add if you want to enable them)
DEEPSEEK_API_KEY=sk-...
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=...
```

---

## 🪝 Stripe Webhook Setup

### Step 1: Create Webhook Endpoint

1. Go to: https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. **Endpoint URL**: `https://yourdomain.com/api/webhooks/stripe`
   - For local testing: Use ngrok or similar
4. **Events to send**:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click "Add endpoint"
6. Copy the **Signing secret** (starts with `whsec_`)
7. Add to `.env.local` as `STRIPE_WEBHOOK_SECRET`

### Step 2: Test Webhook (Local Development)

```bash
# Install Stripe CLI
brew install stripe/stripe-brew/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# This will give you a webhook secret starting with whsec_
# Add it to .env.local
```

---

## 💰 Update Price Mappings

You need to map your actual Stripe price IDs to tiers.

### Step 1: Get Your Stripe Price IDs

1. Go to: https://dashboard.stripe.com/products
2. Click on each product
3. Copy the **Price ID** (starts with `price_`)

### Step 2: Update Database

Run this SQL in Supabase SQL Editor:

```sql
-- Update with your actual Stripe price IDs
UPDATE tier_price_mapping 
SET stripe_price_id = 'price_YOUR_ACTUAL_FREE_PRICE_ID'
WHERE tier = 'wanderer';

UPDATE tier_price_mapping 
SET stripe_price_id = 'price_YOUR_ACTUAL_PRO_PRICE_ID'
WHERE tier = 'soul_weaver';

UPDATE tier_price_mapping 
SET stripe_price_id = 'price_YOUR_ACTUAL_PREMIUM_PRICE_ID'
WHERE tier = 'architect';

UPDATE tier_price_mapping 
SET stripe_price_id = 'price_YOUR_ACTUAL_ENTERPRISE_PRICE_ID'
WHERE tier = 'titan';
```

Or add new ones:

```sql
INSERT INTO tier_price_mapping (stripe_price_id, tier, tier_name, is_active)
VALUES
  ('price_ABC123', 'soul_weaver', 'Soul Weaver Monthly', true),
  ('price_DEF456', 'architect', 'Architect Monthly', true)
ON CONFLICT (stripe_price_id) 
DO UPDATE SET 
  tier = EXCLUDED.tier,
  tier_name = EXCLUDED.tier_name,
  is_active = EXCLUDED.is_active;
```

---

## ✅ Verify Setup

### Test 1: Webhook Receives Events

```bash
# In Stripe Dashboard → Webhooks → Your endpoint
# Click "Send test webhook"
# Choose "customer.subscription.created"
# Check your webhook logs at /admin/webhooks
```

### Test 2: Create Test Subscription

```bash
# Use Stripe test mode
# Create a test subscription
# Check tier_change_history table:
SELECT * FROM tier_change_history ORDER BY created_at DESC LIMIT 5;
```

### Test 3: Manual Tier Update

```bash
# Via admin dashboard at /admin/tiers
# Or via API:
curl -X POST http://localhost:3000/api/admin/tiers/sync \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "USER_UUID",
    "tier": "soul_weaver",
    "reason": "test"
  }'
```

---

## 🎯 Quick Checklist

- [ ] Add `STRIPE_WEBHOOK_SECRET` to `.env.local`
- [ ] Create webhook endpoint in Stripe Dashboard
- [ ] Update price mappings with real Stripe price IDs
- [ ] Test webhook with Stripe CLI or test event
- [ ] Verify tier updates in `tier_change_history`
- [ ] Test admin dashboard at `/admin/tiers`

---

## 🔍 Troubleshooting

**Webhook not receiving events?**
- Check endpoint URL is correct
- Verify webhook secret in `.env.local`
- Check `/admin/webhooks` for error messages

**Tier not updating?**
- Check price mapping exists for that price ID
- Verify subscription status is 'active'
- Check `tier_change_history` for logs

**User still on free tier?**
- Run bulk sync: `GET /api/admin/tiers/sync`
- Check `subscriptions` table has correct data

---

Ready to go! 🚀
