#!/bin/bash

# Load environment variables
source .env.local

# Apply moments video reactions migration
echo "Applying moments video reactions migration..."
curl -X POST \
  "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d @- << 'EOF'
{
  "query": "$(cat supabase/migrations/20260107_moments_video_reactions.sql)"
}
EOF

echo -e "\n\nApplying moments storage buckets migration..."
curl -X POST \
  "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d @- << 'EOF'
{
  "query": "$(cat supabase/migrations/20260107_moments_storage_buckets.sql)"
}
EOF

echo -e "\n\n✅ Migrations applied!"
