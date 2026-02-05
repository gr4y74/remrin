---
name: Database Schema
description: Workflow for Supabase schema updates, migrations, and type generation
---

# Database Schema Management Skill

Use this skill when modifying the Supabase database schema or creating migrations.

## Workflow Overview

1. Plan schema changes
2. Create SQL migration file
3. Apply migration to Supabase
4. Regenerate TypeScript types
5. Update application code
6. Test changes

## 1. Planning Schema Changes

### Before Making Changes
- [ ] Document the purpose of the change
- [ ] Identify affected tables/columns
- [ ] Plan for backward compatibility
- [ ] Consider data migration needs
- [ ] Check for foreign key constraints

### Naming Conventions
- **Tables**: Lowercase, plural, snake_case (`chat_rooms`, `user_profiles`)
- **Columns**: Lowercase, snake_case (`created_at`, `user_id`)
- **Indexes**: `idx_tablename_columnname`
- **Foreign Keys**: `fk_tablename_columnname`

## 2. Creating Migration Files

### Location
```
/mnt/Data68/remrin/chat/supabase/migrations/
```

### File Naming Convention
```
YYYYMMDD_descriptive_name.sql

Examples:
20260204_add_creativity_score.sql
20260204_create_chat_rooms_table.sql
20260204_update_personas_schema.sql
```

### Migration Template
```sql
-- Migration: [Description of changes]
-- Created: [Date]
-- Purpose: [Why this change is needed]

-- ============================================
-- UP Migration
-- ============================================

-- Add new table
CREATE TABLE IF NOT EXISTS new_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_new_table_user_id ON new_table(user_id);

-- Add RLS policies
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own records"
    ON new_table FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own records"
    ON new_table FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- DOWN Migration (Rollback)
-- ============================================

-- Uncomment to enable rollback:
-- DROP TABLE IF EXISTS new_table CASCADE;
```

## 3. Common Schema Patterns

### User-Related Table
```sql
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for lookups
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_username ON user_profiles(username);

-- RLS Policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
    ON user_profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update their own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = user_id);
```

### Relationship Table (Many-to-Many)
```sql
CREATE TABLE user_followers (
    follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- Indexes for both directions
CREATE INDEX idx_user_followers_follower ON user_followers(follower_id);
CREATE INDEX idx_user_followers_following ON user_followers(following_id);
```

### Timestamp Columns (Auto-update)
```sql
-- Create updated_at trigger function (once per database)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to table
CREATE TRIGGER update_table_name_updated_at
    BEFORE UPDATE ON table_name
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## 4. Row Level Security (RLS)

### Always Enable RLS
```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

### Common RLS Policies

#### Public Read, Owner Write
```sql
CREATE POLICY "Anyone can read"
    ON table_name FOR SELECT
    USING (true);

CREATE POLICY "Owner can update"
    ON table_name FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Owner can delete"
    ON table_name FOR DELETE
    USING (auth.uid() = user_id);
```

#### Private by Default
```sql
CREATE POLICY "Users can only access their own data"
    ON table_name FOR ALL
    USING (auth.uid() = user_id);
```

## 5. Applying Migrations

### Using Supabase CLI
```bash
# Login to Supabase
supabase login

# Link to project
supabase link --project-ref [PROJECT_REF]

# Apply migration
supabase db push

# Or apply specific migration
supabase migration up --file 20260204_migration_name.sql
```

### Manual Application (Supabase Dashboard)
1. Go to Supabase Dashboard → SQL Editor
2. Copy migration SQL
3. Run query
4. Verify changes in Table Editor

## 6. Regenerating TypeScript Types

### Using Workflow
```bash
# From chat directory
npm run regen-types
```

Or manually:
```bash
supabase gen types typescript --project-id [PROJECT_ID] > types/supabase.ts
```

### After Type Generation
- [ ] Check for type errors: `npm run type-check`
- [ ] Update imports in affected files
- [ ] Verify types match database schema

## 7. Testing Schema Changes

### Verification Checklist
- [ ] Tables created successfully
- [ ] Indexes exist (`\d table_name` in psql)
- [ ] RLS policies are active
- [ ] Foreign keys enforce constraints
- [ ] Triggers fire correctly
- [ ] TypeScript types match schema

### Testing Queries
```sql
-- Test insert
INSERT INTO table_name (column1, column2) VALUES ('value1', 'value2');

-- Test select with RLS
SELECT * FROM table_name;

-- Test foreign key constraints
-- (Try inserting invalid foreign key - should fail)

-- Check indexes
SELECT * FROM pg_indexes WHERE tablename = 'table_name';
```

## 8. Common Issues & Solutions

### Issue: RLS blocks all access
**Solution**: Check auth.uid() is being set correctly. For service role queries, RLS is bypassed.

### Issue: Foreign key constraint violation
**Solution**: Ensure referenced record exists before inserting.

### Issue: Types not updating
**Solution**: 
1. Clear Next.js cache: `rm -rf .next`
2. Regenerate types: `npm run regen-types`
3. Restart dev server

### Issue: Migration conflicts
**Solution**: Check migration history in `supabase_migrations` table.

## 9. Migration Checklist

Before committing migration:
- [ ] Migration file is named correctly (YYYYMMDD_description.sql)
- [ ] Includes UP and DOWN sections
- [ ] All tables have RLS enabled
- [ ] Indexes are added for foreign keys
- [ ] Types regenerated successfully
- [ ] No type errors in application
- [ ] Tested in local/staging environment

## 10. Rollback Procedure

If migration causes issues:

```sql
-- Run the DOWN migration section
-- Or use Supabase CLI
supabase migration down

-- Then fix migration and reapply
supabase db push
```

## Example: Complete Migration Flow

```bash
# 1. Create migration file
touch supabase/migrations/20260204_add_personas_tags.sql

# 2. Write migration SQL
# (add table, indexes, RLS policies)

# 3. Apply migration
supabase db push

# 4. Regenerate types
npm run regen-types

# 5. Update code to use new types
# 6. Test changes
npm run type-check

# 7. Commit changes
git add .
git commit -m "Add personas tags table"
```
