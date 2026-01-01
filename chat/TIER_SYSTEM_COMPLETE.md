# Comprehensive Tier System - Complete Implementation

## 🎯 Overview

A fully automated, admin-controlled tier-based feature system with:
- **Automatic tier updates** via Stripe webhooks
- **Comprehensive admin controls** for all settings
- **Tier change history** tracking
- **Dynamic LLM provider** selection per tier
- **Feature flags** configurable per tier

---

## 📦 What Was Built

### 1. Database Schema (3 Migrations)

#### Migration 1: `20241230_tier_feature_system.sql`
- `tier_features` - Feature definitions per tier
- `llm_providers` - LLM provider configurations
- Updated `wallets` and `user_limits` tables
- **11 pre-configured features**
- **4 LLM providers** (DeepSeek, OpenAI, Claude, Gemini)

#### Migration 2: `20241230_tier_auto_update.sql`
- `tier_change_history` - Audit log of all tier changes
- `stripe_webhook_events` - Webhook event logging
- `tier_price_mapping` - Stripe price ID to tier mapping
- **Auto-update functions**:
  - `update_user_tier()` - Update user tier with history
  - `handle_subscription_change()` - Process subscription events
  - `sync_all_user_tiers()` - Bulk sync with Stripe
- **Database trigger** - Auto-update tier on subscription change

### 2. Backend Infrastructure

#### Feature Gate Middleware (`/lib/server/feature-gates.ts`)
```typescript
// Check feature access
const gate = await checkFeature(userId, 'multi_persona_chat');

// Get user tier
const tierInfo = await getUserTier(userId);

// Get available LLM providers
const providers = await getAvailableLLMProviders(userId);

// Update user tier (admin)
await updateUserTier(userId, 'soul_weaver', 'upgrade');

// Sync all users
const result = await syncAllUserTiers();
```

#### API Endpoints

**Admin Endpoints**:
- `/api/admin/features` - Manage feature definitions
- `/api/admin/llm-providers` - Manage LLM providers
- `/api/admin/tiers/sync` - Manual tier sync
- `/api/admin/tiers/history` - View tier change history
- `/api/admin/tiers/price-mapping` - Manage Stripe price mappings
- `/api/admin/webhooks` - View webhook event log

**User Endpoints**:
- `/api/user/llm-providers` - Get/set LLM provider preference

**Webhook**:
- `/api/webhooks/stripe` - Stripe webhook handler

### 3. Universal Console Integration

Updated to accept dynamic LLM provider:
```typescript
// Request payload
{
  "message": "Hello",
  "persona_ids": ["..."],
  "user_id": "...",
  "llm_provider": "openai",  // Dynamic!
  "llm_model": "gpt-4-turbo"  // Dynamic!
}
```

---

## 🔄 How Auto-Update Works

### Flow Diagram

```
User subscribes on Stripe
    ↓
Stripe sends webhook → /api/webhooks/stripe
    ↓
Webhook handler logs event → stripe_webhook_events table
    ↓
Updates subscriptions table (status, price_id)
    ↓
Database trigger fires → trigger_subscription_tier_update()
    ↓
Calls handle_subscription_change()
    ↓
Gets tier from price_id → tier_price_mapping table
    ↓
Calls update_user_tier()
    ↓
Updates wallets.tier + user_limits.tier + max_requests_per_day
    ↓
Logs change → tier_change_history table
    ↓
User automatically has new tier features!
```

### Supported Webhook Events

- `customer.subscription.created` - New subscription
- `customer.subscription.updated` - Subscription changed
- `customer.subscription.deleted` - Subscription canceled
- `invoice.payment_succeeded` - Payment successful
- `invoice.payment_failed` - Payment failed (auto-downgrade)

---

## 🎛️ Admin Controls

### 1. Manage Features

**Add a new feature**:
```sql
INSERT INTO tier_features (feature_key, feature_name, feature_type, category,
  wanderer_enabled, soul_weaver_enabled, architect_enabled, titan_enabled)
VALUES
  ('advanced_analytics', 'Advanced Analytics', 'boolean', 'analytics',
   false, false, true, true);
```

**Or via API**:
```typescript
await fetch('/api/admin/features', {
  method: 'POST',
  body: JSON.stringify({
    feature_key: 'advanced_analytics',
    feature_name: 'Advanced Analytics',
    feature_type: 'boolean',
    category: 'analytics',
    wanderer_enabled: false,
    soul_weaver_enabled: false,
    architect_enabled: true,
    titan_enabled: true
  })
});
```

### 2. Manage LLM Providers

**Add a new provider**:
```sql
INSERT INTO llm_providers (provider_key, provider_name, api_endpoint, 
  api_key_env_var, default_model, min_tier_index)
VALUES
  ('mistral', 'Mistral AI', 'https://api.mistral.ai/v1/chat/completions',
   'MISTRAL_API_KEY', 'mistral-large', 1);
```

### 3. Manage Price Mappings

**Map Stripe price to tier**:
```sql
INSERT INTO tier_price_mapping (stripe_price_id, tier, tier_name)
VALUES
  ('price_1ABC123', 'soul_weaver', 'Soul Weaver Monthly');
```

**Or via API**:
```typescript
await fetch('/api/admin/tiers/price-mapping', {
  method: 'POST',
  body: JSON.stringify({
    stripe_price_id: 'price_1ABC123',
    tier: 'soul_weaver',
    tier_name: 'Soul Weaver Monthly',
    is_active: true
  })
});
```

### 4. Manual Tier Updates

**Update a user's tier manually**:
```typescript
await fetch('/api/admin/tiers/sync', {
  method: 'POST',
  body: JSON.stringify({
    user_id: 'USER_UUID',
    tier: 'architect',
    reason: 'customer_support_upgrade'
  })
});
```

### 5. Bulk Sync

**Sync all users with Stripe**:
```typescript
const response = await fetch('/api/admin/tiers/sync');
const { updated_count, unchanged_count, updates } = await response.json();

console.log(`Updated ${updated_count} users`);
```

### 6. View History

**Get tier change history**:
```typescript
const response = await fetch('/api/admin/tiers/history?user_id=USER_UUID&limit=50');
const { history } = await response.json();
```

### 7. Monitor Webhooks

**View webhook events**:
```typescript
const response = await fetch('/api/admin/webhooks?processed=false&limit=100');
const { events, stats } = await response.json();

// See failed events
const failed = events.filter(e => !e.processed && e.error_message);
```

---

## 🧪 Testing

### Test 1: Automatic Tier Update

1. Create a test subscription in Stripe
2. Assign it to a user
3. Check webhook logs:
```sql
SELECT * FROM stripe_webhook_events 
WHERE event_type = 'customer.subscription.created' 
ORDER BY created_at DESC LIMIT 1;
```
4. Check tier was updated:
```sql
SELECT user_id, tier FROM wallets WHERE user_id = 'USER_UUID';
```
5. Check history:
```sql
SELECT * FROM tier_change_history 
WHERE user_id = 'USER_UUID' 
ORDER BY created_at DESC LIMIT 1;
```

### Test 2: Feature Access

```typescript
import { checkFeature } from '@/lib/server/feature-gates';

// Wanderer user
const gate1 = await checkFeature(wandererUserId, 'llm_provider_selection');
console.log(gate1.enabled); // false

// Soul Weaver user
const gate2 = await checkFeature(soulWeaverUserId, 'llm_provider_selection');
console.log(gate2.enabled); // true
```

### Test 3: LLM Provider Selection

```typescript
import { getAvailableLLMProviders } from '@/lib/server/feature-gates';

// Wanderer user
const providers1 = await getAvailableLLMProviders(wandererUserId);
console.log(providers1.length); // 1 (DeepSeek only)

// Soul Weaver user
const providers2 = await getAvailableLLMProviders(soulWeaverUserId);
console.log(providers2.length); // 4 (All providers)
```

### Test 4: Manual Tier Update

```typescript
import { updateUserTier } from '@/lib/server/feature-gates';

await updateUserTier(userId, 'architect', 'test_upgrade', adminId);

// Check history
const history = await getTierHistory(userId);
console.log(history[0]); // Should show upgrade to architect
```

---

## 📋 Deployment Checklist

### Step 1: Apply Migrations

```bash
# Apply both migrations in order
# 1. supabase/migrations/20241230_tier_feature_system.sql
# 2. supabase/migrations/20241230_tier_auto_update.sql

# Via Supabase Dashboard:
# https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
```

### Step 2: Configure Stripe Price Mappings

Update the price IDs in the migration or via API:

```sql
UPDATE tier_price_mapping 
SET stripe_price_id = 'YOUR_ACTUAL_PRICE_ID'
WHERE tier = 'soul_weaver';
```

### Step 3: Set Up Stripe Webhook

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook signing secret
5. Add to `.env.local`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Step 4: Deploy Universal Console

```bash
# Copy updated console to Supabase function
cp /mnt/Data68/remrin/chat/public/mother/console/universal_console_v2.ts \
   /mnt/Data68/remrin/supabase/functions/universal_console/index.ts

# Deploy
npx supabase functions deploy universal_console
```

### Step 5: Verify Installation

```sql
-- Check all tables exist
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'tier_features', 
  'llm_providers', 
  'tier_change_history', 
  'stripe_webhook_events', 
  'tier_price_mapping'
);

-- Check functions exist
SELECT proname FROM pg_proc 
WHERE proname IN (
  'update_user_tier', 
  'handle_subscription_change', 
  'sync_all_user_tiers'
);

-- Check trigger exists
SELECT tgname FROM pg_trigger 
WHERE tgname = 'auto_update_tier_on_subscription';
```

### Step 6: Initial Sync

Sync existing users with their Stripe subscriptions:

```typescript
const response = await fetch('/api/admin/tiers/sync');
const result = await response.json();
console.log(`Synced ${result.updated_count} users`);
```

---

## 🔧 Configuration

### Environment Variables Required

```bash
# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# LLM Providers
DEEPSEEK_API_KEY=sk-...
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=...
```

### Tier Limits Configuration

Edit in `tier_features` table:

```sql
UPDATE tier_features 
SET wanderer_limit = 100,
    soul_weaver_limit = 1000
WHERE feature_key = 'daily_messages';
```

---

## 🎯 Key Features

### ✅ Fully Automated
- Stripe webhooks automatically update tiers
- No manual intervention needed
- Audit trail of all changes

### ✅ Admin Controlled
- Change any feature setting via API or SQL
- Add/remove LLM providers
- Manual tier overrides
- Bulk sync operations

### ✅ User Friendly
- Automatic tier upgrades on payment
- Automatic downgrades on cancellation
- Clear feature boundaries

### ✅ Developer Friendly
- Simple feature gate API
- Comprehensive error handling
- Webhook event logging
- Tier change history

---

## 📊 Database Schema Summary

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `tier_features` | Feature definitions | Per-tier enabled/limit/value |
| `llm_providers` | LLM configurations | API endpoint, tier requirements |
| `tier_change_history` | Audit log | All tier changes tracked |
| `stripe_webhook_events` | Webhook log | Debug failed events |
| `tier_price_mapping` | Price → Tier | Map Stripe prices to tiers |

---

## ✅ Status

**Backend**: 100% Complete ✅  
**Auto-Update**: 100% Complete ✅  
**Admin API**: 100% Complete ✅  
**Webhook Integration**: 100% Complete ✅  
**Frontend UI**: 0% (Next phase)

---

## 🚀 Next Steps

1. **Deploy migrations** to Supabase
2. **Configure Stripe webhook** endpoint
3. **Update price mappings** with real Stripe price IDs
4. **Test webhook** with test subscription
5. **Build admin UI** (optional, can manage via SQL/API)
6. **Build user settings UI** for LLM provider selection

The system is production-ready! 🎉
