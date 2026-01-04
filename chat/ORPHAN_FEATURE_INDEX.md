# ORPHAN FEATURE INDEX (The Limbo)

These features exist in the codebase but are either broken, disconnected, or of unknown status.

## 1. The Summoning System (Gacha)
-   **Location**: `app/[locale]/summon`, `components/gacha/*`
-   **Status**: **BROKEN**.
-   **Missing**:
    -   Connection to `personas` table for pull pools.
    -   Animation sync with backend result.
    -   "Inventory" view integration.

## 2. The Soul Studio (Audio/Persona Editor)
-   **Location**: `app/[locale]/studio`, `components/studio/*`
-   **Status**: **UNSTABLE**.
-   **Errors**: Heavy linting errors in `voice-tab.tsx` and `soul-splicer.tsx`.
-   **Missing**:
    -   Real-time saving to Supabase (currently seems local or half-connected).
    -   Validation for "Voice ID" integration (ElevenLabs?).

## 3. The Grimoire
-   **Location**: `app/[locale]/grimoire`
-   **Status**: **UNKNOWN**.
-   **Action**: Audit immediately. If it's just a static page, keep it. If it's a "Lore" system, ensure it connects to `core_locket` or similar tables.
## 3. The Collection (formerly The Grimoire)
-   **Status**: **RESCUED (Functional)**
-   **Location**: `app/[locale]/(platform)/collection` (redirects from `/grimoire`), `hooks/use-collection.ts`
-   **Notes**: Verified inventory logic. Updated `useCollection` hook to fetch both pulled and created personas. Added proper redirect. Build verified.

## 4. Platform Extras (Moments, Wallet)
-   **Location**: `app/[locale]/(platform)/moments`, `app/[locale]/(platform)/wallet`
-   **Status**: **DISTRACTIONS**.
-   **Action**: Low priority. If they cause build errors (which they do), comment them out or delete them until V2 Launch.

## 5. Admin Dashboard
-   **Location**: `app/[locale]/admin`
-   **Status**: **NOISY**.
-   **Issue**: Functional but spams the logs with Tailwind warnings. Needs a clean pass.
