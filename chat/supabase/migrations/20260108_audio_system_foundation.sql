-- =============================================================================
-- AUDIO SYSTEM FOUNDATION MIGRATION
-- =============================================================================
-- Version: 1.0.0
-- Created: 2026-01-08
-- Description: Sets up the complete audio system infrastructure for Remrin.ai
--              including voice settings, audio caching, and community voices
-- =============================================================================

-- ============================================
-- SECTION 1: EXTEND PERSONAS TABLE
-- ============================================

-- Add audio-related columns to personas table
ALTER TABLE personas
ADD COLUMN IF NOT EXISTS welcome_audio_url TEXT,
ADD COLUMN IF NOT EXISTS welcome_message TEXT,
ADD COLUMN IF NOT EXISTS voice_provider TEXT DEFAULT 'edge',
ADD COLUMN IF NOT EXISTS voice_id TEXT,
ADD COLUMN IF NOT EXISTS voice_settings JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS audio_enabled BOOLEAN DEFAULT true;

-- Add comments for documentation
COMMENT ON COLUMN personas.welcome_audio_url IS 'URL to pre-generated welcome audio file (stored in Supabase Storage)';
COMMENT ON COLUMN personas.welcome_message IS 'Text transcript used for welcome audio generation';
COMMENT ON COLUMN personas.voice_provider IS 'TTS provider: edge (free), kokoro (enhanced), elevenlabs (premium)';
COMMENT ON COLUMN personas.voice_id IS 'Unique identifier for the voice within the provider';
COMMENT ON COLUMN personas.voice_settings IS 'Provider-specific voice settings (speed, pitch, stability, etc.)';
COMMENT ON COLUMN personas.audio_enabled IS 'Whether TTS audio responses are enabled for this persona';

-- Add constraint for voice_provider values
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'personas_voice_provider_check'
    ) THEN
        ALTER TABLE personas ADD CONSTRAINT personas_voice_provider_check
        CHECK (voice_provider IS NULL OR voice_provider IN ('edge', 'kokoro', 'elevenlabs'));
    END IF;
END $$;

-- Index for querying personas by voice provider
CREATE INDEX IF NOT EXISTS idx_personas_voice_provider ON personas(voice_provider) WHERE voice_provider IS NOT NULL;

-- ============================================
-- SECTION 2: CREATE AUDIO CACHE TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS audio_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    text_hash TEXT UNIQUE NOT NULL,
    persona_id UUID REFERENCES personas(id) ON DELETE CASCADE,
    voice_provider TEXT NOT NULL,
    voice_id TEXT NOT NULL,
    audio_url TEXT NOT NULL,
    file_size_bytes INTEGER,
    duration_seconds DECIMAL(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
    access_count INTEGER DEFAULT 0,
    
    -- Constraint for voice provider
    CONSTRAINT audio_cache_voice_provider_check 
    CHECK (voice_provider IN ('edge', 'kokoro', 'elevenlabs'))
);

-- Add comments for documentation
COMMENT ON TABLE audio_cache IS 'Caches generated audio files to avoid redundant TTS API calls';
COMMENT ON COLUMN audio_cache.id IS 'Unique identifier for the cache entry';
COMMENT ON COLUMN audio_cache.text_hash IS 'MD5 hash of (text + voice_id + voice_settings) for deduplication';
COMMENT ON COLUMN audio_cache.persona_id IS 'Reference to the persona this audio was generated for';
COMMENT ON COLUMN audio_cache.voice_provider IS 'TTS provider used: edge, kokoro, or elevenlabs';
COMMENT ON COLUMN audio_cache.voice_id IS 'Voice identifier within the provider';
COMMENT ON COLUMN audio_cache.audio_url IS 'URL to the cached audio file in Supabase Storage';
COMMENT ON COLUMN audio_cache.file_size_bytes IS 'Size of the audio file for storage quota tracking';
COMMENT ON COLUMN audio_cache.duration_seconds IS 'Duration of the audio for UI display';
COMMENT ON COLUMN audio_cache.created_at IS 'When this cache entry was created';
COMMENT ON COLUMN audio_cache.last_accessed_at IS 'Last time this cached audio was served (for LRU eviction)';
COMMENT ON COLUMN audio_cache.access_count IS 'Number of times this cached audio was served (for popularity metrics)';

-- Performance indexes for audio_cache
CREATE INDEX IF NOT EXISTS idx_audio_cache_text_hash ON audio_cache(text_hash);
CREATE INDEX IF NOT EXISTS idx_audio_cache_persona_id ON audio_cache(persona_id);
CREATE INDEX IF NOT EXISTS idx_audio_cache_last_accessed ON audio_cache(last_accessed_at);
CREATE INDEX IF NOT EXISTS idx_audio_cache_voice_provider ON audio_cache(voice_provider);

-- ============================================
-- SECTION 3: CREATE COMMUNITY VOICES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS community_voices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    voice_provider TEXT NOT NULL,
    voice_id TEXT NOT NULL,
    sample_audio_url TEXT,
    created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint for voice provider
    CONSTRAINT community_voices_voice_provider_check 
    CHECK (voice_provider IN ('edge', 'kokoro', 'elevenlabs')),
    
    -- Prevent duplicate voice entries
    CONSTRAINT community_voices_unique_voice 
    UNIQUE (voice_provider, voice_id)
);

-- Add comments for documentation
COMMENT ON TABLE community_voices IS 'Community-shared voice configurations that users can apply to their personas';
COMMENT ON COLUMN community_voices.id IS 'Unique identifier for the community voice';
COMMENT ON COLUMN community_voices.name IS 'Display name for the voice (e.g., "Warm British Narrator")';
COMMENT ON COLUMN community_voices.description IS 'Description of the voice characteristics and recommended use cases';
COMMENT ON COLUMN community_voices.voice_provider IS 'TTS provider: edge, kokoro, or elevenlabs';
COMMENT ON COLUMN community_voices.voice_id IS 'Voice identifier within the provider';
COMMENT ON COLUMN community_voices.sample_audio_url IS 'URL to a sample audio demonstrating this voice';
COMMENT ON COLUMN community_voices.created_by_user_id IS 'User who submitted this voice configuration';
COMMENT ON COLUMN community_voices.is_public IS 'Whether this voice is visible to all users in the community library';
COMMENT ON COLUMN community_voices.usage_count IS 'Number of personas currently using this voice (for popularity ranking)';
COMMENT ON COLUMN community_voices.created_at IS 'When this voice was added to the community library';

-- Performance indexes for community_voices
CREATE INDEX IF NOT EXISTS idx_community_voices_voice_provider ON community_voices(voice_provider);
CREATE INDEX IF NOT EXISTS idx_community_voices_is_public ON community_voices(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_community_voices_usage_count ON community_voices(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_community_voices_created_by ON community_voices(created_by_user_id);

-- ============================================
-- SECTION 4: CREATE STORAGE BUCKETS
-- ============================================

-- Create audio_cache storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'audio_cache', 
    'audio_cache', 
    true,
    10485760, -- 10MB max per file
    ARRAY['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/mp3']
)
ON CONFLICT (id) DO NOTHING;

-- Create welcome_audio storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'welcome_audio', 
    'welcome_audio', 
    true,
    10485760, -- 10MB max per file
    ARRAY['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/mp3']
)
ON CONFLICT (id) DO NOTHING;

-- Create voice_samples storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'voice_samples', 
    'voice_samples', 
    true,
    5242880, -- 5MB max per file
    ARRAY['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/mp3']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- SECTION 5: ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on audio_cache
ALTER TABLE audio_cache ENABLE ROW LEVEL SECURITY;

-- audio_cache policies
CREATE POLICY "Audio cache is readable by authenticated users"
ON audio_cache FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Audio cache can be created by authenticated users"
ON audio_cache FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Audio cache can be updated by system"
ON audio_cache FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Audio cache can be deleted by admins"
ON audio_cache FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.user_id = auth.uid() 
        AND profiles.membership = 'admin'
    )
);

-- Enable RLS on community_voices
ALTER TABLE community_voices ENABLE ROW LEVEL SECURITY;

-- community_voices policies
CREATE POLICY "Public community voices are readable by everyone"
ON community_voices FOR SELECT
TO authenticated
USING (is_public = true OR created_by_user_id = auth.uid());

CREATE POLICY "Authenticated users can create community voices"
ON community_voices FOR INSERT
TO authenticated
WITH CHECK (created_by_user_id = auth.uid());

CREATE POLICY "Users can update their own community voices"
ON community_voices FOR UPDATE
TO authenticated
USING (created_by_user_id = auth.uid())
WITH CHECK (created_by_user_id = auth.uid());

CREATE POLICY "Users can delete their own community voices"
ON community_voices FOR DELETE
TO authenticated
USING (created_by_user_id = auth.uid());

CREATE POLICY "Admins can manage all community voices"
ON community_voices FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.user_id = auth.uid() 
        AND profiles.membership = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.user_id = auth.uid() 
        AND profiles.membership = 'admin'
    )
);

-- Storage RLS policies for audio buckets
CREATE POLICY "Audio cache files are publicly readable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'audio_cache');

CREATE POLICY "Authenticated users can upload to audio cache"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'audio_cache');

CREATE POLICY "Welcome audio files are publicly readable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'welcome_audio');

CREATE POLICY "Authenticated users can upload welcome audio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'welcome_audio');

CREATE POLICY "Voice samples are publicly readable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'voice_samples');

CREATE POLICY "Authenticated users can upload voice samples"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'voice_samples');

-- ============================================
-- SECTION 6: HELPER FUNCTIONS
-- ============================================

-- Function to update access tracking for audio cache
CREATE OR REPLACE FUNCTION update_audio_cache_access()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_accessed_at = NOW();
    NEW.access_count = COALESCE(OLD.access_count, 0) + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to clean old cache entries (LRU eviction)
CREATE OR REPLACE FUNCTION cleanup_audio_cache(max_entries INTEGER DEFAULT 10000)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    WITH entries_to_delete AS (
        SELECT id FROM audio_cache
        ORDER BY last_accessed_at ASC
        OFFSET max_entries
    )
    DELETE FROM audio_cache WHERE id IN (SELECT id FROM entries_to_delete);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to increment community voice usage count
CREATE OR REPLACE FUNCTION increment_voice_usage(voice_id_param UUID)
RETURNS void AS $$
BEGIN
    UPDATE community_voices 
    SET usage_count = usage_count + 1 
    WHERE id = voice_id_param;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_audio_cache_access() IS 'Trigger function to update access tracking on audio cache entries';
COMMENT ON FUNCTION cleanup_audio_cache(INTEGER) IS 'Removes oldest cache entries to maintain size limit (LRU eviction)';
COMMENT ON FUNCTION increment_voice_usage(UUID) IS 'Increments the usage counter for a community voice';

-- ============================================
-- SECTION 7: VERIFICATION QUERIES
-- ============================================

-- These queries can be used to verify the schema was created correctly:

/*
-- Verify personas columns
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'personas' 
AND column_name IN ('welcome_audio_url', 'welcome_message', 'voice_provider', 'voice_id', 'voice_settings', 'audio_enabled');

-- Verify audio_cache table
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'audio_cache' 
ORDER BY ordinal_position;

-- Verify community_voices table
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'community_voices' 
ORDER BY ordinal_position;

-- Verify indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('audio_cache', 'community_voices', 'personas')
AND indexname LIKE 'idx_%';

-- Verify RLS policies
SELECT tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename IN ('audio_cache', 'community_voices');

-- Verify storage buckets
SELECT id, name, public 
FROM storage.buckets 
WHERE id IN ('audio_cache', 'welcome_audio', 'voice_samples');
*/

-- =============================================================================
-- ROLLBACK SCRIPT
-- =============================================================================
-- To rollback this migration, run the following SQL:
/*

-- Drop storage policies first
DROP POLICY IF EXISTS "Audio cache files are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to audio cache" ON storage.objects;
DROP POLICY IF EXISTS "Welcome audio files are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload welcome audio" ON storage.objects;
DROP POLICY IF EXISTS "Voice samples are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload voice samples" ON storage.objects;

-- Drop functions
DROP FUNCTION IF EXISTS update_audio_cache_access();
DROP FUNCTION IF EXISTS cleanup_audio_cache(INTEGER);
DROP FUNCTION IF EXISTS increment_voice_usage(UUID);

-- Drop RLS policies on community_voices
DROP POLICY IF EXISTS "Public community voices are readable by everyone" ON community_voices;
DROP POLICY IF EXISTS "Authenticated users can create community voices" ON community_voices;
DROP POLICY IF EXISTS "Users can update their own community voices" ON community_voices;
DROP POLICY IF EXISTS "Users can delete their own community voices" ON community_voices;
DROP POLICY IF EXISTS "Admins can manage all community voices" ON community_voices;

-- Drop RLS policies on audio_cache
DROP POLICY IF EXISTS "Audio cache is readable by authenticated users" ON audio_cache;
DROP POLICY IF EXISTS "Audio cache can be created by authenticated users" ON audio_cache;
DROP POLICY IF EXISTS "Audio cache can be updated by system" ON audio_cache;
DROP POLICY IF EXISTS "Audio cache can be deleted by admins" ON audio_cache;

-- Drop tables
DROP TABLE IF EXISTS community_voices;
DROP TABLE IF EXISTS audio_cache;

-- Drop indexes on personas
DROP INDEX IF EXISTS idx_personas_voice_provider;

-- Drop constraint on personas
ALTER TABLE personas DROP CONSTRAINT IF EXISTS personas_voice_provider_check;

-- Drop columns from personas
ALTER TABLE personas 
DROP COLUMN IF EXISTS welcome_audio_url,
DROP COLUMN IF EXISTS welcome_message,
DROP COLUMN IF EXISTS voice_provider,
DROP COLUMN IF EXISTS voice_id,
DROP COLUMN IF EXISTS voice_settings,
DROP COLUMN IF EXISTS audio_enabled;

-- Drop storage buckets (WARNING: This will delete all files in these buckets!)
-- DELETE FROM storage.buckets WHERE id IN ('audio_cache', 'welcome_audio', 'voice_samples');

*/

-- =============================================================================
-- PERFORMANCE OPTIMIZATION NOTES
-- =============================================================================
/*
PERFORMANCE CONSIDERATIONS:

1. AUDIO CACHE TABLE:
   - text_hash index enables O(log n) lookups for cache hits
   - persona_id index speeds up cascade deletes and persona-specific queries
   - last_accessed_at index supports efficient LRU eviction
   - Consider partitioning if table exceeds 10M rows

2. COMMUNITY VOICES TABLE:
   - voice_provider index enables fast filtering by provider
   - is_public partial index reduces index size (only public voices)
   - usage_count DESC index supports popularity-based sorting

3. CACHE EVICTION STRATEGY:
   - Use cleanup_audio_cache() via pg_cron for periodic cleanup
   - Recommended schedule: CALL cleanup_audio_cache(10000) every 6 hours
   - Monitor with: SELECT pg_size_pretty(pg_total_relation_size('audio_cache'));

4. STORAGE OPTIMIZATION:
   - Audio files are stored in Supabase Storage with CDN caching
   - 10MB limit per file prevents abuse
   - Consider lifecycle policies to auto-delete old files

5. QUERY PATTERNS TO OPTIMIZE FOR:
   - Cache lookup: SELECT * FROM audio_cache WHERE text_hash = $1;
   - Voice listing: SELECT * FROM community_voices WHERE is_public = true ORDER BY usage_count DESC;
   - Persona voice: SELECT voice_provider, voice_id, voice_settings FROM personas WHERE id = $1;

6. RECOMMENDED MAINTENANCE:
   - VACUUM ANALYZE audio_cache; -- Run weekly
   - REINDEX INDEX CONCURRENTLY idx_audio_cache_text_hash; -- Run monthly
*/
