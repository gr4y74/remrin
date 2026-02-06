---
name: Database Schema
description: Workflow for Supabase schema updates, migrations, and type generation
---

# Database Schema Skill

## Key Column Conventions

### User-Created Content (Personas)

> [!IMPORTANT]
> **Always use `creator_id` when querying user-created personas**, NOT `user_id`.

The `personas` table uses `creator_id` to identify the user who created the persona:

```typescript
// ✅ CORRECT - Use creator_id for persona ownership
const { data } = await supabase
    .from('personas')
    .select('*')
    .eq('creator_id', userId)

// ❌ WRONG - user_id does not exist on personas table
const { data } = await supabase
    .from('personas')
    .select('*')
    .eq('user_id', userId)  // This will fail with 400 error
```

### User Profiles

The application uses **two profile tables** for historical reasons:

| Table | Primary Key | Username Field | Purpose |
|-------|-------------|----------------|---------|
| `user_profiles` | `user_id` | `username` | **Primary** - Social profile data (bio, location, website, images) |
| `profiles` | `user_id` | `username` | **Legacy** - Internal/fallback profile data |

> [!WARNING]
> Ensure **both tables have matching `username`** values, otherwise URL-based profile lookups (e.g., `/profile/sosu`) will fail to find data from one table.

### Profile Lookup Pattern

When looking up by username from URL:

```typescript
// Check if it's a UUID or username
const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.userId)

// Query with appropriate column
const { data } = await supabase
    .from('user_profiles')
    .select('*')
    .eq(isUuid ? 'user_id' : 'username', params.userId)
```

## Schema Reference

### personas table - Key columns

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `creator_id` | uuid | **User who created this persona** |
| `name` | string | Persona name |
| `image_url` | string | Avatar image |
| `video_url` | string | Living portrait video |
| `visibility` | string | PUBLIC, PRIVATE, etc. |

### user_profiles table - Key columns

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | uuid | Primary key (foreign key to auth.users) |
| `username` | string | URL-safe username for profile URLs |
| `display_name` | string | Shown on profile |
| `bio` | string | User bio |
| `location` | string | User location |
| `website_url` | string | User website |
| `hero_image_url` | string | Avatar/profile image |
| `banner_url` | string | Profile banner image |

## Type Generation

After schema changes, regenerate types:

```bash
npx supabase gen types typescript --project-id wftsctqfiqbdyllxwagi > supabase/types.ts
```
