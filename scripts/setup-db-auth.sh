#!/bin/bash

# Setup Supabase DB Auth
# This script helps set up the necessary environment variables for automated migrations

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Supabase DB Auth Setup ===${NC}"
echo "To enable automated migrations, we need to set a few environment variables."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env file..."
    touch .env
fi

# Function to update or add env var
update_env() {
    local key=$1
    local value=$2
    
    if grep -q "^$key=" .env; then
        # Replace existing
        sed -i "s|^$key=.*|$key=\"$value\"|" .env
    else
        # Append new
        echo "$key=\"$value\"" >> .env
    fi
}

echo "Please enter your Supabase Access Token (https://supabase.com/dashboard/account/tokens):"
read -s ACCESS_TOKEN
if [ ! -z "$ACCESS_TOKEN" ]; then
    update_env "SUPABASE_ACCESS_TOKEN" "$ACCESS_TOKEN"
    echo -e "${GREEN}✓ SUPABASE_ACCESS_TOKEN set${NC}"
else
    echo "Skipping Access Token..."
fi

echo ""
echo "Please enter your Database Password:"
read -s DB_PASSWORD
if [ ! -z "$DB_PASSWORD" ]; then
    update_env "SUPABASE_DB_PASSWORD" "$DB_PASSWORD"
    echo -e "${GREEN}✓ SUPABASE_DB_PASSWORD set${NC}"
else
    echo "Skipping DB Password..."
fi

echo ""
echo -e "${GREEN}Setup complete! You can now run 'npm run migrate' to push migrations.${NC}"
