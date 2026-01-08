-- =============================================================================
-- AUDIO SYSTEM VERIFICATION QUERIES
-- =============================================================================
-- Run these queries after applying 20260108_audio_system_foundation.sql
-- to verify the schema was created correctly
-- =============================================================================

-- ============================================
-- 1. VERIFY PERSONAS COLUMNS
-- ============================================
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name = 'personas' 
AND column_name IN (
    'welcome_audio_url', 
    'welcome_message', 
    'voice_provider', 
    'voice_id', 
    'voice_settings', 
    'audio_enabled',
    'background_url',
    'is_default_media_set'
)
ORDER BY column_name;

-- Expected: 6 rows with correct types and defaults

-- ============================================
-- 2. VERIFY AUDIO_CACHE TABLE STRUCTURE
-- ============================================
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default 
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name = 'audio_cache' 
ORDER BY ordinal_position;

-- Expected: 11 columns (id, text_hash, persona_id, voice_provider, voice_id, 
--           audio_url, file_size_bytes, duration_seconds, created_at, 
--           last_accessed_at, access_count)

-- ============================================
-- 3. VERIFY COMMUNITY_VOICES TABLE STRUCTURE
-- ============================================
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default 
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name = 'community_voices' 
ORDER BY ordinal_position;

-- Expected: 10 columns (id, name, description, voice_provider, voice_id,
--           sample_audio_url, created_by_user_id, is_public, usage_count, created_at)

-- ============================================
-- 4. VERIFY INDEXES
-- ============================================
SELECT 
    schemaname,
    tablename, 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN ('audio_cache', 'community_voices', 'personas')
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Expected indexes:
-- - idx_audio_cache_last_accessed
-- - idx_audio_cache_persona_id
-- - idx_audio_cache_text_hash
-- - idx_audio_cache_voice_provider
-- - idx_community_voices_created_by
-- - idx_community_voices_is_public
-- - idx_community_voices_usage_count
-- - idx_community_voices_voice_provider
-- - idx_personas_voice_provider

-- ============================================
-- 5. VERIFY RLS POLICIES
-- ============================================
SELECT 
    schemaname,
    tablename, 
    policyname, 
    permissive, 
    roles::text, 
    cmd 
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('audio_cache', 'community_voices')
ORDER BY tablename, policyname;

-- Expected: Multiple policies for each table

-- ============================================
-- 6. VERIFY STORAGE BUCKETS
-- ============================================
SELECT 
    id, 
    name, 
    public,
    file_size_limit,
    allowed_mime_types::text
FROM storage.buckets 
WHERE id IN ('audio_cache', 'welcome_audio', 'voice_samples', 'persona_backgrounds')
ORDER BY id;

-- Expected: 3 buckets with correct settings

-- ============================================
-- 7. VERIFY CONSTRAINTS
-- ============================================
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    tc.table_name,
    kcu.column_name,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.check_constraints cc
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
AND tc.table_name IN ('audio_cache', 'community_voices', 'personas')
AND tc.constraint_name LIKE '%voice_provider%' OR tc.constraint_name LIKE '%unique%'
ORDER BY tc.table_name, tc.constraint_name;

-- Expected: voice_provider CHECK constraints on all 3 tables

-- ============================================
-- 8. VERIFY FUNCTIONS
-- ============================================
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'update_audio_cache_access',
    'cleanup_audio_cache',
    'increment_voice_usage'
)
ORDER BY routine_name;

-- Expected: 3 functions

-- ============================================
-- 9. TEST INSERT (Non-destructive)
-- ============================================

-- Test audio_cache insert (will rollback)
BEGIN;
INSERT INTO audio_cache (text_hash, voice_provider, voice_id, audio_url)
VALUES ('test_hash_123', 'edge', 'en-US-JennyNeural', 'https://example.com/test.mp3');
SELECT 'audio_cache INSERT: OK' as test_result;
ROLLBACK;

-- Test community_voices insert (will rollback)
BEGIN;
INSERT INTO community_voices (name, voice_provider, voice_id, is_public)
VALUES ('Test Voice', 'edge', 'test-voice-id', false);
SELECT 'community_voices INSERT: OK' as test_result;
ROLLBACK;

-- ============================================
-- 10. SUMMARY REPORT
-- ============================================
SELECT 
    'SUMMARY' as section,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_name = 'personas' 
     AND column_name IN ('welcome_audio_url', 'welcome_message', 'voice_provider', 'voice_id', 'voice_settings', 'audio_enabled', 'background_url', 'is_default_media_set')
    ) as personas_new_columns,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'audio_cache') as audio_cache_columns,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'community_voices') as community_voices_columns,
    (SELECT COUNT(*) FROM pg_indexes WHERE tablename IN ('audio_cache', 'community_voices', 'personas') AND indexname LIKE 'idx_%') as total_indexes,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename IN ('audio_cache', 'community_voices')) as total_rls_policies,
    (SELECT COUNT(*) FROM storage.buckets WHERE id IN ('audio_cache', 'welcome_audio', 'voice_samples', 'persona_backgrounds')) as storage_buckets;

-- Expected summary:
-- personas_audio_columns: 6
-- audio_cache_columns: 11
-- community_voices_columns: 10
-- total_indexes: 9+
-- total_rls_policies: 9+
-- storage_buckets: 3
