---
description: Run TypeScript check and lint before committing
---

# Workflow: Verify Before Commit

Run this workflow to ensure code quality before committing changes.

// turbo-all

## Steps

1. Run TypeScript type check:
```bash
cd /home/gr4y/Data68/remrin/chat && npx tsc --noEmit
```

2. Run ESLint:
```bash
cd /home/gr4y/Data68/remrin/chat && npm run lint
```

3. If both pass, proceed with /commit-deploy workflow
