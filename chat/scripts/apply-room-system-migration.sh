#!/bin/bash
# Apply room system migration directly to Supabase

# Read the migration file
MIGRATION_SQL=$(cat supabase/migrations/20260121_room_system.sql)

# Get Supabase credentials from .env.local
SUPABASE_URL=$(grep "NEXT_PUBLIC_SUPABASE_URL" .env.local | cut -d '=' -f2)
SUPABASE_SERVICE_KEY=$(grep "SUPABASE_SERVICE_ROLE_KEY" .env.local | cut -d '=' -f2)

# Execute the migration using Supabase REST API
curl -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"$(cat supabase/migrations/20260121_room_system.sql | sed 's/"/\\"/g' | sed ':a;N;$!ba;s/\n/\\n/g')\"}"

echo "Room System Migration applied!"
