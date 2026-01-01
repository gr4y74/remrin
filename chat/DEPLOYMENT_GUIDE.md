# Quick Deployment Guide

## ✅ Step 1: Update Edge Function (COMPLETE)

The Universal Console Edge Function has been updated with mood logic:
- File: `/supabase/functions/universal_console/index.ts`
- Status: ✅ Updated

## 📊 Step 2: Apply Database Migration (MANUAL)

### Option A: Via Supabase Dashboard (Recommended)

1. Open Supabase Dashboard: https://supabase.com/dashboard/project/wftsctqfiqbdyllxwagi/sql/new

2. Copy the entire contents of this file:
   `/mnt/Data68/remrin/chat/supabase/migrations/20241230_mood_cognitive_system.sql`

3. Paste into the SQL Editor

4. Click "Run" to execute

### Option B: Via Command Line (If you link Supabase)

```bash
cd /mnt/Data68/remrin/chat
supabase link --project-ref wftsctqfiqbdyllxwagi
npx supabase db push
```

## 🚀 Step 3: Deploy Edge Function

### Via Supabase Dashboard:

1. Go to: https://supabase.com/dashboard/project/wftsctqfiqbdyllxwagi/functions

2. Find "universal_console" function

3. Click "Deploy" or "Redeploy"

### Via Command Line (If linked):

```bash
npx supabase functions deploy universal_console
```

## ✅ Step 4: Verify Installation

Run these queries in SQL Editor to verify:

```sql
-- Check table exists
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'persona_mood_state';

-- Check functions exist
SELECT proname FROM pg_proc 
WHERE proname IN ('get_or_create_mood_state', 'update_mood_after_interaction');

-- Check personas have mood config
SELECT id, name, config->'cognitive_drift' as drift 
FROM personas LIMIT 5;
```

Expected results:
- ✅ Table `persona_mood_state` exists
- ✅ Both helper functions exist
- ✅ Personas have `cognitive_drift` = 0.3

## 🎯 Done!

Your mood system is now deployed. Start a new chat to test it!
