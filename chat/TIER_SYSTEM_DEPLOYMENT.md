# Tier-Based Feature System - Deployment Guide

## 🎯 What Was Built

### Backend Infrastructure (✅ Complete)

1. **Database Schema**
   - `tier_features` table - Stores feature definitions per tier
   - `llm_providers` table - Stores LLM provider configurations
   - Updated `wallets` table - Added `preferred_llm_provider` and `llm_settings`
   - Updated `user_limits` table - Added `tier` column

2. **Feature Gate Middleware** (`/lib/server/feature-gates.ts`)
   - `checkFeature()` - Check if user has access to a feature
   - `getUserTier()` - Get user's subscription tier
   - `getAvailableLLMProviders()` - Get LLM providers for user's tier
   - `setUserLLMProvider()` - Update user's LLM preference
   - Feature caching (5-minute TTL) for performance

3. **API Endpoints**
   - `/api/admin/features` - Admin feature management
   - `/api/admin/llm-providers` - Admin LLM provider management
   - `/api/user/llm-providers` - User LLM provider selection

4. **Universal Console Updates**
   - Accepts `llm_provider` and `llm_model` in request payload
   - Fetches provider config from database
   - Uses dynamic API endpoint and key
   - Logs which LLM is being used

### Seeded Data

**11 Features**:
- daily_messages (limit)
- llm_provider_selection (boolean)
- max_personas (limit)
- multi_persona_chat (boolean)
- memory_search (boolean)
- soul_splicer (boolean)
- locket_limit (limit)
- custom_embeddings (boolean)
- api_access (boolean)
- priority_support (boolean)
- white_label (boolean)

**4 LLM Providers**:
- DeepSeek (wanderer+)
- OpenAI GPT-4 (soul_weaver+)
- Anthropic Claude (soul_weaver+)
- Google Gemini (soul_weaver+)

---

## 📋 Deployment Steps

### Step 1: Apply Database Migration

```bash
cd /mnt/Data68/remrin/chat

# Copy migration SQL to Supabase Dashboard
# Go to: https://supabase.com/dashboard/project/wftsctqfiqbdyllxwagi/sql/new
# Paste contents of: supabase/migrations/20241230_tier_feature_system.sql
# Click "Run"
```

### Step 2: Deploy Universal Console Function

```bash
# The function code has been updated
# Deploy via Supabase Dashboard:
# Go to: https://supabase.com/dashboard/project/wftsctqfiqbdyllxwagi/functions
# Find "universal_console" and click "Deploy"

# Or via CLI (if linked):
npx supabase functions deploy universal_console
```

### Step 3: Verify Installation

Run these queries in Supabase SQL Editor:

```sql
-- Check tables exist
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('tier_features', 'llm_providers');

-- Check features seeded
SELECT feature_key, feature_name, wanderer_enabled, soul_weaver_enabled 
FROM tier_features;

-- Check LLM providers seeded
SELECT provider_key, provider_name, min_tier_index 
FROM llm_providers WHERE is_active = true;

-- Check user tier migration
SELECT user_id, tier, requests_today 
FROM user_limits LIMIT 5;
```

Expected results:
- ✅ Both tables exist
- ✅ 11 features seeded
- ✅ 4 LLM providers seeded
- ✅ User limits have tier column

---

## 🧪 Testing

### Test 1: Feature Gate

```typescript
import { checkFeature } from '@/lib/server/feature-gates';

const gate = await checkFeature(userId, 'llm_provider_selection');
console.log(gate); // { enabled: true/false }
```

### Test 2: LLM Provider Selection

1. Navigate to `/settings/llm` (once UI is built)
2. Wanderer users should only see DeepSeek
3. Soul Weaver+ users should see all 4 providers
4. Select a provider
5. Start a new chat
6. Verify console logs show correct provider

### Test 3: Universal Console

Send request with custom provider:

```json
{
  "message": "Hello",
  "persona_ids": ["..."],
  "user_id": "...",
  "llm_provider": "openai",
  "llm_model": "gpt-4-turbo"
}
```

Check logs for: `🤖 Using LLM: OpenAI GPT-4 (gpt-4-turbo)`

---

## 🎨 Frontend TODO (Not Yet Built)

### Admin Panel
- [ ] `/app/[locale]/admin/tiers/page.tsx` - Tier management UI
- [ ] Feature toggle interface
- [ ] LLM provider configuration

### User Settings
- [ ] `/app/[locale]/settings/llm/page.tsx` - LLM provider selector
- [ ] Display available providers based on tier
- [ ] Show upgrade prompts for locked features

### Chat Interface
- [ ] Pass `llm_provider` and `llm_model` to Universal Console
- [ ] Get user's preferred provider from wallet
- [ ] Display current LLM in chat UI

---

## 🔧 How to Use (For Now)

### For Developers

1. **Check if user has access to a feature:**

```typescript
import { checkFeature } from '@/lib/server/feature-gates';

const canUseMultiPersona = await checkFeature(userId, 'multi_persona_chat');
if (!canUseMultiPersona.enabled) {
  // Show upgrade prompt
}
```

2. **Get user's LLM provider:**

```typescript
import { getUserLLMProvider } from '@/lib/server/feature-gates';

const { provider, settings } = await getUserLLMProvider(userId);
// Use provider.provider_key and provider.default_model in request
```

3. **Send chat request with LLM provider:**

```typescript
const response = await fetch('/api/universal-console', {
  method: 'POST',
  body: JSON.stringify({
    message: userMessage,
    persona_ids: [personaId],
    user_id: userId,
    llm_provider: provider.provider_key,
    llm_model: provider.default_model
  })
});
```

### For Admins

1. **Add a new feature:**

```bash
# Via SQL Editor
INSERT INTO tier_features (feature_key, feature_name, feature_type, category,
  wanderer_enabled, soul_weaver_enabled, architect_enabled, titan_enabled)
VALUES
  ('new_feature', 'New Feature Name', 'boolean', 'chat',
   false, true, true, true);
```

2. **Add a new LLM provider:**

```bash
INSERT INTO llm_providers (provider_key, provider_name, api_endpoint, 
  api_key_env_var, default_model, min_tier_index)
VALUES
  ('custom_llm', 'Custom LLM', 'https://api.custom.com/v1/chat',
   'CUSTOM_API_KEY', 'custom-model', 2);
```

---

## 🚀 Next Steps

1. **Build Admin UI** - Create tier management interface
2. **Build User Settings** - Create LLM provider selector
3. **Update Chat Interface** - Pass LLM provider to Universal Console
4. **Add Feature Gates** - Wrap features with tier checks
5. **Test Thoroughly** - Verify all tiers work correctly

---

## 📊 Architecture Overview

```
User Request
    ↓
Frontend checks tier → Feature Gate Middleware
    ↓                        ↓
Gets user's LLM provider    Checks feature access
    ↓                        ↓
Sends to Universal Console  Returns enabled/limit
    ↓
Fetches provider config from DB
    ↓
Calls dynamic LLM API
    ↓
Streams response back
```

---

## 🎯 Key Benefits

1. **Flexible** - Add/remove features without code changes
2. **Scalable** - Feature cache for performance
3. **User-Friendly** - Clear tier boundaries
4. **LLM Agnostic** - Support any OpenAI-compatible API
5. **Admin-Controlled** - Manage everything via database

---

## ⚠️ Important Notes

- Feature cache refreshes every 5 minutes
- LLM provider requires API key in environment variables
- Tier hierarchy: wanderer (0) < soul_weaver (1) < architect (2) < titan (3)
- Default provider is DeepSeek for all tiers

---

## 🐛 Troubleshooting

**Issue**: "Invalid LLM provider" error  
**Solution**: Check provider exists in `llm_providers` table and `is_active = true`

**Issue**: "API key not configured" error  
**Solution**: Add API key to environment variables (e.g., `OPENAI_API_KEY`)

**Issue**: Feature not showing for tier  
**Solution**: Check `tier_features` table, ensure `{tier}_enabled = true`

**Issue**: User can't access provider  
**Solution**: Check `min_tier_index` in `llm_providers` table

---

## ✅ Deployment Checklist

- [ ] Apply database migration
- [ ] Verify tables and seed data
- [ ] Deploy Universal Console function
- [ ] Test feature gates
- [ ] Test LLM provider selection
- [ ] Build admin UI (future)
- [ ] Build user settings UI (future)
- [ ] Update chat interface (future)

---

**Status**: Backend infrastructure complete ✅  
**Next**: Build frontend UI components
