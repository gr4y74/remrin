# Agent 6: Deep Bug Testing & Deployment Fix

**Recommended Model:** Claude Sonnet 4.5 (thinking) - Best for debugging complex issues

## Objective
Find and fix all build errors, broken links, and runtime issues preventing Vercel deployment.

## Phase 1: Build Error Analysis

1. **Run production build:**
   ```bash
   npm run build 2>&1 | tee build-output.txt
   ```

2. **Categorize errors:**
   - TypeScript errors (fix immediately)
   - ESLint errors (fix immediately)
   - Tailwind warnings (can ignore)
   - Runtime errors (investigate)

3. **Common issues to check:**
   - Missing imports
   - Type mismatches
   - Undefined variables
   - Invalid JSX
   - Missing dependencies

## Phase 2: Link Verification

1. **Check all navigation links:**
   - Sidebar links in `sidebar-switcher.tsx`
   - Header links
   - Footer links (if any)

2. **Verify page routes exist:**
   ```
   /login
   /[workspaceid]/chat
   /discover
   /marketplace
   /moments
   /summon
   /collection
   ```

3. **Check API routes:**
   ```
   /api/chat/*
   /api/auth/*
   ```

## Phase 3: Runtime Testing

1. **Test critical flows:**
   - Login → Dashboard
   - New Chat creation
   - Message sending
   - Sidebar navigation

2. **Check console for errors:**
   - React warnings
   - Failed network requests
   - Hydration errors

## Phase 4: Vercel-Specific Fixes

1. **Environment variables:**
   - Verify all NEXT_PUBLIC_* vars are set
   - Check Supabase connection strings

2. **Build configuration:**
   - Check `next.config.js`
   - Verify image domains
   - Check rewrites/redirects

## Verification
```bash
# Local build must pass
npm run build

# Type check
npx tsc --noEmit

# Lint check
npm run lint
```

## Success Criteria
- [ ] `npm run build` exits with code 0
- [ ] No TypeScript errors
- [ ] No ESLint errors (warnings OK)
- [ ] All pages render without crash
- [ ] All links navigate correctly
- [ ] Ready for Vercel deployment
