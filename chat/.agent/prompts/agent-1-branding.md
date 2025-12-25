# Agent 1: Branding Sweep

**Recommended Model:** Gemini 3 Flash (fast search/replace, straightforward task)

## Objective
Replace all Remrin.ai branding with Remrin.ai across the codebase.

## Tasks

1. **Search for all Remrin.ai references:**
   ```bash
   grep -ri "chatbotui\|remrin\|chatbot ui" --include="*.tsx" --include="*.ts" --include="*.json" --include="*.md" .
   ```

2. **Replace text references:**
   - "Remrin.ai" → "Remrin.ai"
   - "Remrin.ai" → "Remrin.ai"
   - "remrin" → "remrin" (for technical references)

3. **Update logo references:**
   - Find all image/logo components
   - Ensure they use `/logo.svg`
   - Update alt text to "Remrin"

4. **Update metadata:**
   - Page titles in layout.tsx files
   - Meta descriptions
   - OpenGraph images/text
   - package.json name and description

5. **Files to check:**
   - `components/ui/brand.tsx`
   - `app/[locale]/layout.tsx`
   - `app/[locale]/login/page.tsx`
   - All `page.tsx` files
   - `README.md`
   - `package.json`

## Verification
```bash
# Check no Remrin.ai references remain
grep -ri "chatbotui" --include="*.tsx" --include="*.ts" .

# Build test
npm run build
```

## Success Criteria
- [ ] No "Remrin.ai" text in any file
- [ ] All logos point to `/logo.svg`
- [ ] Build passes
- [ ] Visual check shows Remrin branding
