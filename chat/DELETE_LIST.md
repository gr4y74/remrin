# DELETE LIST (Technical Debt)

The following files and directories are identified as "Trash" or "Dead Code" and should be removed to clear confusion.

## Direct Deletions
- [ ] `components/_deprecated_chat/` (Entire directory)
- [ ] `components/chat-enhanced/` (Entire directory - appears to be a failed/incomplete branch)
- [ ] `lib/legacy-constants.ts`
- [ ] `lib/export-old-data.ts`

## Review for Deletion (High Probability)
- [ ] `app/[locale]/(platform)/moments/` (If not core functionality)
- [ ] `app/[locale]/(platform)/wallet/` (If not core functionality)

## Refactor/Cleanup Candidates
- [ ] `components/chat-v2/MemorySearchModal.tsx` (Needs Hook Cleanup)
- [ ] `components/knowledge/MemoryVault.tsx` (Contains unescaped entities)
- [ ] `app/[locale]/studio/components/voice-tab.tsx` (Heavy linting errors)
