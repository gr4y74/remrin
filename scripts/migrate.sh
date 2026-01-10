#!/bin/bash

# Run Supabase Migrations
# This script pushes local migrations to the remote Supabase project

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== Running Supabase Migrations ===${NC}"

# Check for Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}Error: Supabase CLI is not installed.${NC}"
    echo "Please install it: npm install -g supabase"
    exit 1
fi

# Load env vars if present
if [ -f .env ]; then
    set -o allexport
    source .env
    set +o allexport
fi

# Check for required env vars
MISSING_VARS=0
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo -e "${YELLOW}Warning: SUPABASE_ACCESS_TOKEN not set.${NC}"
    MISSING_VARS=1
fi

if [ -z "$SUPABASE_DB_PASSWORD" ]; then
    echo -e "${YELLOW}Warning: SUPABASE_DB_PASSWORD not set.${NC}"
    MISSING_VARS=1
fi

if [ $MISSING_VARS -eq 1 ]; then
    echo -e "${YELLOW}Automated auth might fail. You can run 'npm run setup:db:auth' to configure credentials.${NC}"
    echo "Attempting to run with current CLI session..."
fi

# Run the migration
echo "Pushing database changes..."
supabase db push

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Migrations applied successfully!${NC}"
else
    echo -e "${RED}✗ Migration failed.${NC}"
    exit 1
fi
