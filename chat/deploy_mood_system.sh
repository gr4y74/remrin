#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# MOOD & COGNITIVE SHIFT DEPLOYMENT SCRIPT
# ═══════════════════════════════════════════════════════════════

set -e

echo "🎭 Deploying Mood & Cognitive Shift System..."
echo ""

# Navigate to chat directory
cd /mnt/Data68/remrin/chat

# Step 1: Apply database migration
echo "📊 Step 1: Applying database migration..."
npx supabase db push

echo "✅ Database migration applied"
echo ""

# Step 2: Verify tables exist
echo "🔍 Step 2: Verifying installation..."
npx supabase db execute --query "
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'persona_mood_state';
"

echo "✅ Verification complete"
echo ""

# Step 3: Copy updated Universal Console to Supabase function
echo "📦 Step 3: Updating Supabase Edge Function..."
cp /mnt/Data68/remrin/chat/lib/chat-engine/console/universal_console_v2.ts \
   /mnt/Data68/remrin/supabase/functions/universal_console/index.ts

echo "✅ Function code updated"
echo ""

# Step 4: Deploy function
echo "🚀 Step 4: Deploying to Supabase..."
npx supabase functions deploy universal_console

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✨ Deployment Complete!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "1. Test with a persona by starting a new chat"
echo "2. Check mood state in database:"
echo "   SELECT * FROM persona_mood_state LIMIT 5;"
echo "3. Adjust cognitive_drift config per persona as needed"
echo ""
echo "To disable mood system for a persona:"
echo "   UPDATE personas SET config = config || '{\"cognitive_drift\": 0.0}'::jsonb WHERE id = 'PERSONA_ID';"
echo ""
