---
description: Regenerate Supabase types after schema changes
---

# Workflow: Regenerate Supabase Types

Run this after creating or applying database migrations.

// turbo-all

## Steps

1. Generate TypeScript types from Supabase schema:
```bash
cd /home/gr4y/Data68/remrin/chat && npx supabase gen types typescript --local > supabase/types.ts
```

2. Verify the types file was updated:
```bash
cd /home/gr4y/Data68/remrin/chat && head -50 supabase/types.ts
```

3. Run TypeScript check to ensure new types are valid:
```bash
cd /home/gr4y/Data68/remrin/chat && npx tsc --noEmit
```
