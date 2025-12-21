---
description: Auto-commit, sync, and deploy changes after completing work
---

# Workflow: Commit & Deploy

Use this workflow after completing a set of changes to automatically commit and push to the repository.

// turbo-all

## Steps

1. Check git status to see what changed:
```bash
cd /home/gr4y/Data68/remrin/chat && git status --short
```

2. Stage all changes:
```bash
cd /home/gr4y/Data68/remrin/chat && git add -A
```

3. Commit with a descriptive message (replace MESSAGE with your summary):
```bash
cd /home/gr4y/Data68/remrin/chat && git commit -m "feat: MESSAGE"
```

4. Push to remote:
```bash
cd /home/gr4y/Data68/remrin/chat && git push origin main
```

5. Verify deployment status (if using Vercel):
```bash
cd /home/gr4y/Data68/remrin/chat && vercel --prod
```

## Commit Message Conventions

- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code refactoring
- `style:` - Styling changes
- `docs:` - Documentation
- `chore:` - Build/config changes

## Notes

- The `// turbo-all` annotation enables auto-running all commands in this workflow
- Each agent should run this workflow when completing their tasks
- Make sure all TypeScript checks pass before committing
