-- ═══════════════════════════════════════════════════════════════
-- FIX SUPABASE SECURITY VULNERABILITIES
-- Date: 2026-03-25
-- ═══════════════════════════════════════════════════════════════
-- Fixes 6 issues flagged by Supabase database linter:
--   1. SECURITY DEFINER views: audio_bucket_status, audio_bucket_stats
--   2. RLS disabled: documents, persona_access, persona_lockets, personas
-- ═══════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════
-- SECTION 1: DROP UNUSED SECURITY DEFINER VIEWS
-- ═══════════════════════════════════════════════════════════════
-- These views are not referenced in application code.

DROP VIEW IF EXISTS public.audio_bucket_status;
DROP VIEW IF EXISTS public.audio_bucket_stats;


-- ═══════════════════════════════════════════════════════════════
-- SECTION 2: ENABLE RLS ON `documents` TABLE
-- ═══════════════════════════════════════════════════════════════
-- This table is not used by the application but exists in the public
-- schema. Enable RLS with no anon policies to block external access.
-- Service role (used by all API routes) bypasses RLS.

ALTER TABLE IF EXISTS public.documents ENABLE ROW LEVEL SECURITY;

-- Allow service_role full access (already implicit, but explicit for clarity)
DROP POLICY IF EXISTS "Service role has full access to documents" ON public.documents;
CREATE POLICY "Service role has full access to documents"
    ON public.documents
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');


-- ═══════════════════════════════════════════════════════════════
-- SECTION 3: ENABLE RLS ON `persona_access` TABLE
-- ═══════════════════════════════════════════════════════════════
-- Migration 20241229 had this but it didn't apply on live DB.

ALTER TABLE public.persona_access ENABLE ROW LEVEL SECURITY;

-- Users can view their own access records
DROP POLICY IF EXISTS "Users can view own persona access" ON public.persona_access;
CREATE POLICY "Users can view own persona access"
    ON public.persona_access
    FOR SELECT
    USING (user_id = auth.uid()::text);

-- Users can manage their own access records
DROP POLICY IF EXISTS "Users can manage own persona access" ON public.persona_access;
CREATE POLICY "Users can manage own persona access"
    ON public.persona_access
    FOR ALL
    USING (user_id = auth.uid()::text)
    WITH CHECK (user_id = auth.uid()::text);


-- ═══════════════════════════════════════════════════════════════
-- SECTION 4: ENABLE RLS ON `persona_lockets` TABLE
-- ═══════════════════════════════════════════════════════════════
-- Migration 20241229 had this but it didn't apply on live DB.

ALTER TABLE public.persona_lockets ENABLE ROW LEVEL SECURITY;

-- Users can read lockets for personas they own
DROP POLICY IF EXISTS "Users can read own persona lockets" ON public.persona_lockets;
CREATE POLICY "Users can read own persona lockets"
    ON public.persona_lockets
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.personas p
            WHERE p.id = persona_lockets.persona_id
            AND (p.creator_id::text = auth.uid()::text OR p.owner_id = auth.uid()::text)
        )
    );

-- Users can insert/update/delete lockets for personas they own
DROP POLICY IF EXISTS "Users can manage own persona lockets" ON public.persona_lockets;
CREATE POLICY "Users can manage own persona lockets"
    ON public.persona_lockets
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.personas p
            WHERE p.id = persona_lockets.persona_id
            AND (p.creator_id::text = auth.uid()::text OR p.owner_id = auth.uid()::text)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.personas p
            WHERE p.id = persona_lockets.persona_id
            AND (p.creator_id::text = auth.uid()::text OR p.owner_id = auth.uid()::text)
        )
    );


-- ═══════════════════════════════════════════════════════════════
-- SECTION 5: ENABLE RLS ON `personas` TABLE
-- ═══════════════════════════════════════════════════════════════
-- This is the most critical table. Policies:
--   SELECT: PUBLIC personas visible to all, PRIVATE only to owner
--   INSERT/UPDATE/DELETE: Only owner (creator_id) can modify

ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;

-- Anyone can read PUBLIC or SYSTEM personas (discover, feed, profiles)
DROP POLICY IF EXISTS "Public personas are visible to everyone" ON public.personas;
CREATE POLICY "Public personas are visible to everyone"
    ON public.personas
    FOR SELECT
    USING (
        visibility IN ('PUBLIC', 'SYSTEM')
        OR creator_id::text = auth.uid()::text
        OR owner_id = auth.uid()::text
    );

-- Only the creator/owner can insert personas
DROP POLICY IF EXISTS "Users can create personas" ON public.personas;
CREATE POLICY "Users can create personas"
    ON public.personas
    FOR INSERT
    WITH CHECK (
        creator_id::text = auth.uid()::text
        OR owner_id = auth.uid()::text
    );

-- Only the creator/owner can update their personas
DROP POLICY IF EXISTS "Users can update own personas" ON public.personas;
CREATE POLICY "Users can update own personas"
    ON public.personas
    FOR UPDATE
    USING (
        creator_id::text = auth.uid()::text
        OR owner_id = auth.uid()::text
    )
    WITH CHECK (
        creator_id::text = auth.uid()::text
        OR owner_id = auth.uid()::text
    );

-- Only the creator/owner can delete their personas
DROP POLICY IF EXISTS "Users can delete own personas" ON public.personas;
CREATE POLICY "Users can delete own personas"
    ON public.personas
    FOR DELETE
    USING (
        creator_id::text = auth.uid()::text
        OR owner_id = auth.uid()::text
    );


-- ═══════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES
-- ═══════════════════════════════════════════════════════════════
-- Run these after applying to confirm fixes:

-- 1. Verify views are dropped:
-- SELECT viewname FROM pg_views WHERE schemaname = 'public' AND viewname LIKE 'audio_bucket%';
-- Expected: 0 rows

-- 2. Verify RLS is enabled on all tables:
-- SELECT tablename, rowsecurity FROM pg_tables 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('documents', 'persona_access', 'persona_lockets', 'personas');
-- Expected: all show rowsecurity = true

-- 3. Verify policies exist:
-- SELECT tablename, policyname FROM pg_policies 
-- WHERE schemaname = 'public'
-- AND tablename IN ('documents', 'persona_access', 'persona_lockets', 'personas');
