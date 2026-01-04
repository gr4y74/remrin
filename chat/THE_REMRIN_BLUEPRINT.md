# THE REMRIN BLUEPRINT: A-to-Z Path to Production

**Priority**: STABILITY > AESTHETICS > FEATURES

## PHASE 1: The Purge (Days 1-2)
1.  **[CRITICAL] Operation Type-Zero**:
    -   Run `npm run lint --fix` to auto-sort Tailwind classes.
    -   Manually fix all `react/no-unescaped-entities` errors (Search & Replace).
    -   Address `react-hooks/exhaustive-deps` (Verify dependency arrays).
    -   **GOAL**: A clean `npm run build` with ZERO warnings.
2.  **Take out the Trash**:
    -   Delete `components/_deprecated_chat`.
    -   Delete `components/chat-enhanced`.
    -   Delete `lib/legacy-constants.ts`, `lib/export-old-data.ts`.
    -   Archive/Disable `(platform)/moments` and `(platform)/wallet` if they aren't critical.

## PHASE 2: Core Engine Stabilization (Days 3-5)
3.  **Lock Chat V2**:
    -   Verify `ChatEngine.tsx` state management (fix the stalling issues).
    -   Ensure `SearchManager` is fully integrated and error-handled.
    -   Freeze `components/chat-v2` from major architectural changes.
4.  **Profile & Auth Hardening**:
    -   Verify `profiles` table syncing on login.
    -   Ensure `MiniProfile.tsx` reads/writes correctly to Supabase.

## PHASE 3: The Feature Bridge (Days 6-10)
5.  **Revive the Studio**:
    -   Connect `SoulSplicer.tsx` to `personas` table (Upsert logic).
    -   Fix Validation in `VoiceTab`.
6.  **Fix the Gacha**:
    -   Wire `app/[locale]/summon` to the `gacha` backend logic.
    -   Ensure "Pulled" souls appear in the user's "My Souls" list.

## PHASE 4: Polish & Ship (Days 11-14)
7.  **Admin & Analytics**:
    -   Finalize the Admin Dashboard (already mostly done, just confirm security).
8.  **SEO & Metadata**:
    -   Update `layout.tsx` metadata.
    -   Generate `sitemap.xml`.
9.  **Performance Pass**:
    -   Enable image optimization (`next/image`) where `<img>` tags are used (flagged in audit).
    -   Code splitting check.
10. **LAUNCH**:
    -   Deploy to Vercel (Production Environment).
    -   Verify Stripe Webhooks.
