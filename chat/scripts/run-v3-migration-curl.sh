#!/bin/bash
# Apply Phase 1 migration directly to Supabase via CURL

# Get Supabase credentials from .env.local
SUPABASE_URL=$(grep "NEXT_PUBLIC_SUPABASE_URL" .env.local | cut -d '=' -f2)
SUPABASE_SERVICE_KEY=$(grep "SUPABASE_SERVICE_ROLE_KEY" .env.local | cut -d '=' -f2)

# Execute the migration using Supabase REST API
# Using 'query' as the parameter name as found in apply_migration.sh
SQL_CONTENT=$(cat scripts/v3-phase1-db.sql)
# Escape double quotes and newlines for JSON
ESCAPED_SQL=$(echo "$SQL_CONTENT" | sed 's/"/\\"/g' | awk '{printf "%s\\n", $0}' | sed 's/\\n$/ /')

curl -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"$ESCAPED_SQL\"}"

echo -e "\nMigration attempt finished."
