# 🎯 REMRIN AUDIO SYSTEM - COMPLETE PRODUCTION BLUEPRINT
## CTO Strategic Plan: Week 1-5 Parallel Agent Deployment

**Document Version:** 1.0  
**Created:** 2026-01-08  
**Status:** Ready for Deployment  
**Estimated Completion:** 5 Weeks  

---

## 📊 MASTER ARCHITECTURE OVERVIEW

```
Week 1: Foundation Layer (Welcome Audio + Database)
Week 2: Edge TTS Integration + Caching System
Week 3: Audio Studio UI + Provider Interface
Week 4: Kokoro-82M Integration + Voice Cloning
Week 5: ElevenLabs Premium + Community Library
```

---

# 🚀 WEEK 1: FOUNDATION LAYER
**Goal:** Welcome Audio System + Database Schema (Production Ready)

## SQUAD ALPHA: Database & Storage (3 Agents)

### **AGENT A1: Database Architect**
**LLM:** Claude 4.5 Opus (Thinking)  
**Duration:** 2 hours  
**Dependencies:** None


111111111111111111111111111111111111111111111111111111111111111111111111
**PROMPT:**
```
TURBO MODE ACTIVATED - NO CONFIRMATIONS REQUIRED

You are the Database Architect for Remrin.ai's Audio System. Your mission is PRODUCTION-READY database schema.

CRITICAL REQUIREMENTS:
1. Create migration file: /supabase/migrations/20260108_audio_system_foundation.sql
2. Add these columns to personas table:
   - welcome_audio_url TEXT
   - welcome_message TEXT (for audio transcript)
   - voice_provider TEXT DEFAULT 'edge' (values: 'edge', 'kokoro', 'elevenlabs')
   - voice_id TEXT
   - voice_settings JSONB
   - audio_enabled BOOLEAN DEFAULT true

3. Create audio_cache table:
   - id UUID PRIMARY KEY
   - text_hash TEXT UNIQUE NOT NULL (MD5 hash of text + voice_id)
   - persona_id UUID REFERENCES personas(id) ON DELETE CASCADE
   - voice_provider TEXT NOT NULL
   - voice_id TEXT NOT NULL
   - audio_url TEXT NOT NULL
   - file_size_bytes INTEGER
   - duration_seconds DECIMAL
   - created_at TIMESTAMP DEFAULT NOW()
   - last_accessed_at TIMESTAMP DEFAULT NOW()
   - access_count INTEGER DEFAULT 0

4. Create community_voices table:
   - id UUID PRIMARY KEY
   - name TEXT NOT NULL
   - description TEXT
   - voice_provider TEXT NOT NULL
   - voice_id TEXT NOT NULL
   - sample_audio_url TEXT
   - created_by_user_id UUID REFERENCES auth.users(id)
   - is_public BOOLEAN DEFAULT false
   - usage_count INTEGER DEFAULT 0
   - created_at TIMESTAMP DEFAULT NOW()

5. Add indexes for performance:
   - Index on audio_cache.text_hash
   - Index on audio_cache.persona_id
   - Index on community_voices.voice_provider
   - Index on personas.voice_provider

6. Add RLS policies for all tables
7. Add helpful comments on all columns
8. Include rollback script

DELIVERABLES:
- Complete migration SQL file
- Test queries to verify schema
- Performance optimization notes

EXECUTE IMMEDIATELY. DO NOT WAIT FOR APPROVAL.
```

---

222222222222222222222222222222222222222222222222222222222222222222222222


### **AGENT A2: Storage Bucket Engineer**
**LLM:** Claude 4.5 Sonnet  
**Duration:** 1 hour  
**Dependencies:** None (runs parallel to A1)

**PROMPT:**
```
TURBO MODE ACTIVATED - NO CONFIRMATIONS REQUIRED

You are the Storage Engineer for Remrin.ai's Audio System.

MISSION: Create and configure ALL storage buckets for audio system.

TASKS:
1. Create SQL script: /supabase/migrations/20260108_audio_storage_buckets.sql

2. Create these buckets:
   - persona_audio (for welcome messages)
   - audio_cache (for TTS generated audio)
   - voice_samples (for user-uploaded voice cloning samples)

3. For EACH bucket, create:
   - Bucket creation SQL
   - RLS policies for:
     * Public READ access
     * Authenticated UPLOAD access
     * Owner DELETE access
   - File size limits (50MB max)
   - Allowed MIME types (audio/mpeg, audio/wav, audio/ogg, audio/webm)

4. Create helper SQL functions:
   - get_audio_url(bucket_name, file_path) - returns public URL
   - delete_old_cache(days_old) - cleanup function

5. Add bucket configuration documentation

DELIVERABLES:
- Complete SQL migration file
- Bucket policy verification queries
- Cleanup script for old cached audio

EXECUTE IMMEDIATELY. DO NOT WAIT FOR APPROVAL.
```

---

333333333333333333333333333333333333333333333333333333333333333333333333

### **AGENT A3: API Route Foundation**
**LLM:** Claude 4.5 Sonnet (Thinking)  
**Duration:** 2 hours  
**Dependencies:** Waits for A1 to complete schema

**PROMPT:**
```
TURBO MODE ACTIVATED - NO CONFIRMATIONS REQUIRED

You are the API Architect for Remrin.ai's Audio System.

MISSION: Build production-ready API routes for audio management.

CREATE THESE FILES:

1. /app/api/audio/upload/route.ts
   - POST endpoint for uploading welcome audio
   - Accepts: personaId, audio file
   - Validates: file type, size, user permissions
   - Uploads to persona_audio bucket
   - Updates personas.welcome_audio_url
   - Returns: { success, audioUrl }

2. /app/api/audio/[personaId]/route.ts
   - GET: Fetch persona audio settings
   - PUT: Update voice settings (provider, voice_id, settings)
   - DELETE: Remove welcome audio

3. /app/api/audio/generate/route.ts
   - POST endpoint for TTS generation
   - Accepts: text, personaId, voiceId (optional)
   - Checks cache first (audio_cache table)
   - Returns cached audio OR generates new
   - Saves to cache if new
   - Returns: { audioUrl, cached: boolean }

4. /app/api/audio/cache/cleanup/route.ts
   - DELETE endpoint (admin only)
   - Removes cache entries older than X days
   - Deletes associated storage files
   - Returns: { deletedCount, freedBytes }

REQUIREMENTS:
- Full TypeScript types
- Comprehensive error handling
- Supabase auth verification
- Input validation with Zod
- Proper HTTP status codes
- Detailed logging
- Rate limiting considerations

DELIVERABLES:
- All 4 API route files
- Shared types file: /types/audio.ts
- API documentation in comments

EXECUTE IMMEDIATELY. DO NOT WAIT FOR APPROVAL.
```
BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB

---
111111111111111111111111111111111111111111111111111111111111111111111111

## SQUAD BRAVO: Media Manager UI (3 Agents)

### **AGENT B1: Media Manager Audio Upload**
**LLM:** Gemini 3 Pro (High)  
**Duration:** 3 hours  
**Dependencies:** Waits for A1 (database) and A2 (storage)

**PROMPT:**
```
TURBO MODE ACTIVATED - NO CONFIRMATIONS REQUIRED

You are the UI Engineer for Remrin.ai's Media Manager Audio Upload.

MISSION: Add audio upload functionality to /app/[locale]/admin/media/page.tsx

REQUIREMENTS:

1. Add new section to the existing Media Manager page:
   - Section title: "Welcome Audio"
   - Icon: Waveform or Speaker icon from @tabler/icons-react
   - Position: Between "Background Image" and "Living Portrait (Video)"

2. Features to implement:
   - Audio file upload (drag-drop + click)
   - Audio preview player with waveform visualization
   - Play/Pause/Stop controls
   - Volume slider
   - Duration display
   - Remove audio button (with confirmation)
   - Welcome message text input (transcript)
   - Auto-play toggle
   - Loop toggle

3. Upload flow:
   - Validate file (audio/*, max 10MB)
   - Show upload progress
   - Call /api/audio/upload
   - Update local state
   - Show success toast
   - Display audio player

4. UI Polish:
   - Match existing Rose Pine theme
   - Smooth animations
   - Loading states
   - Error handling with user-friendly messages
   - Responsive design

5. State management:
   - Add welcome_audio_url to Persona interface
   - Update handleAudioUpload function
   - Update handleRemoveAudio function

TECHNICAL REQUIREMENTS:
- Use existing UI components (Button, toast from sonner)
- TypeScript strict mode
- Proper error boundaries
- Accessibility (ARIA labels, keyboard navigation)

DELIVERABLES:
- Updated /app/[locale]/admin/media/page.tsx
- Audio player component if needed
- Updated Persona interface in the file

EXECUTE IMMEDIATELY. DO NOT WAIT FOR APPROVAL.
```

---

22222222222222222222222222222222222222222222222222222222222222222222222

### **AGENT B2: Character Page Audio Player**
**LLM:** Gemini 3 Pro (High)  
**Duration:** 3 hours  
**Dependencies:** Waits for A1 (database)

**PROMPT:**
```
TURBO MODE ACTIVATED - NO CONFIRMATIONS REQUIRED

You are the Frontend Engineer for Remrin.ai's Character Page Audio System.

MISSION: Add welcome audio player to character pages.

FIND AND UPDATE THESE FILES:
1. Character page component (likely /app/[locale]/character/[id]/page.tsx or similar)
2. Character panel/sidebar component

REQUIREMENTS:

1. Create new component: /components/audio/WelcomeAudioPlayer.tsx
   - Props: audioUrl, autoPlay, loop, onEnded
   - Features:
     * Auto-play on mount (if enabled)
     * Sync with video if present
     * Play/Mute button (floating, bottom-right)
     * Fade in/out animations
     * Volume control
     * Loading state
   - Design:
     * Minimal UI (just play/mute button visible)
     * Glassmorphic style matching site theme
     * Smooth transitions
     * Mobile responsive

2. Integration points:
   - Add to character page header/hero section
   - Position: Absolute, bottom-right of video/image
   - Show only if persona.welcome_audio_url exists
   - Respect user's audio preferences (check localStorage)

3. Audio controls:
   - Play button: Waveform icon (animated when playing)
   - Mute button: Speaker icon with slash
   - Tooltip: "Welcome message" on hover
   - Keyboard shortcut: Space to play/pause

4. State management:
   - Track playing state
   - Track muted state
   - Save mute preference to localStorage
   - Handle audio errors gracefully

5. Accessibility:
   - ARIA labels
   - Keyboard navigation
   - Screen reader announcements
   - Reduced motion support

TECHNICAL REQUIREMENTS:
- Use HTML5 Audio API
- TypeScript strict mode
- Rose Pine theme colors
- Smooth animations (framer-motion if needed)
- Error boundaries

DELIVERABLES:
- /components/audio/WelcomeAudioPlayer.tsx
- Updated character page with audio player
- Audio preferences hook if needed

EXECUTE IMMEDIATELY. DO NOT WAIT FOR APPROVAL.
```

---

333333333333333333333333333333333333333333333333333333333333333333333333

### **AGENT B3: Audio Sync System**
**LLM:** Claude 4.5 Sonnet (Thinking)  
**Duration:** 2 hours  
**Dependencies:** Waits for B2 (audio player component)

**PROMPT:**
```
TURBO MODE ACTIVATED - NO CONFIRMATIONS REQUIRED

You are the Audio Sync Engineer for Remrin.ai.

MISSION: Synchronize welcome audio with character video loops.

TASKS:

1. Create: /lib/audio/AudioSyncManager.ts
   - Class that manages audio/video synchronization
   - Methods:
     * syncAudioWithVideo(audioElement, videoElement)
     * handleVideoLoop(callback)
     * resetSync()
   - Features:
     * Detect when video loops
     * Restart audio on video loop
     * Handle audio/video timing drift
     * Graceful degradation if sync fails

2. Update WelcomeAudioPlayer component:
   - Add video sync support
   - Accept videoRef prop
   - Use AudioSyncManager
   - Handle edge cases:
     * Video loads after audio
     * Audio loads after video
     * Either fails to load
     * User seeks video

3. Create hook: /hooks/useAudioVideoSync.ts
   - Custom hook for easy integration
   - Returns: { audioRef, syncWithVideo, isPlaying, isSynced }
   - Handles cleanup on unmount

4. Testing scenarios:
   - Video loops before audio ends
   - Audio ends before video loops
   - User pauses video
   - User mutes audio
   - Network interruptions

TECHNICAL REQUIREMENTS:
- Precise timing (use requestAnimationFrame)
- Memory leak prevention
- Performance optimization
- TypeScript strict mode
- Comprehensive error handling

DELIVERABLES:
- /lib/audio/AudioSyncManager.ts
- /hooks/useAudioVideoSync.ts
- Updated WelcomeAudioPlayer component
- Sync logic documentation

EXECUTE IMMEDIATELY. DO NOT WAIT FOR APPROVAL.
```

---

## 📋 WEEK 1 VALIDATION CHECKLIST

After all Week 1 agents complete, verify:

- [ ] Database migration runs successfully
- [ ] All storage buckets created with correct policies
- [ ] API routes respond correctly
- [ ] Media Manager shows audio upload section
- [ ] Character page plays welcome audio
- [ ] Audio syncs with video loop
- [ ] All TypeScript compiles without errors
- [ ] No console errors in browser
- [ ] Mobile responsive
- [ ] Accessibility compliant

---
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
xxxxxxxxxxxxxxxxxxxxxxxxx COMPLETE WEEK 1 xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx


# 🚀 WEEK 2: EDGE TTS INTEGRATION + CACHING
**Goal:** Free TTS system with intelligent caching

## SQUAD CHARLIE: Edge TTS Core (4 Agents)

### **AGENT C1: Edge TTS Service**
**LLM:** Claude 4.5 Opus (Thinking)  
**Duration:** 4 hours  
**Dependencies:** Week 1 complete

**PROMPT:**
```
TURBO MODE ACTIVATED - NO CONFIRMATIONS REQUIRED

You are the TTS Integration Engineer for Remrin.ai.

MISSION: Implement production-ready Edge TTS integration.

CREATE THESE FILES:

1. /lib/audio/providers/EdgeTTSProvider.ts
   - Implements AudioProvider interface
   - Uses edge-tts library or direct API calls
   - Methods:
     * generateSpeech(text: string, voiceId: string): Promise<ArrayBuffer>
     * listVoices(): Promise<Voice[]>
     * getVoiceInfo(voiceId: string): Promise<VoiceInfo>
   - Features:
     * Error handling and retries
     * Rate limiting
     * Voice caching
     * SSML support for emotion/emphasis

2. /lib/audio/providers/AudioProvider.interface.ts
   - Define common interface for all TTS providers
   - Types for Voice, VoiceInfo, GenerationOptions
   - Error types

3. /lib/audio/AudioService.ts
   - Main service that routes to providers
   - Implements caching logic
   - Methods:
     * generateSpeech(text, personaId, options)
     * getCachedAudio(textHash)
     * cacheAudio(textHash, audioBuffer)
     * clearCache(olderThan)

4. Install dependencies:
   - Add to package.json: edge-tts or equivalent
   - Add crypto for text hashing

TECHNICAL REQUIREMENTS:
- Full TypeScript types
- Comprehensive error handling
- Logging for debugging
- Performance metrics
- Memory management (stream large audio)

DELIVERABLES:
- All 3 TypeScript files
- Updated package.json
- Integration tests
- Performance benchmarks

EXECUTE IMMEDIATELY. DO NOT WAIT FOR APPROVAL.
```

---

### **AGENT C2: Audio Cache Manager**
**LLM:** Claude 4.5 Sonnet (Thinking)  
**Duration:** 3 hours  
**Dependencies:** Waits for C1 (AudioService)

**PROMPT:**
```
TURBO MODE ACTIVATED - NO CONFIRMATIONS REQUIRED

You are the Cache Engineer for Remrin.ai's Audio System.

MISSION: Build intelligent audio caching system.

CREATE THESE FILES:

1. /lib/audio/AudioCacheManager.ts
   - Class for managing audio cache
   - Methods:
     * get(textHash): Promise<CachedAudio | null>
     * set(textHash, audioBuffer, metadata): Promise<void>
     * delete(textHash): Promise<void>
     * cleanup(maxAge, maxSize): Promise<CleanupStats>
     * getStats(): Promise<CacheStats>
   - Features:
     * LRU eviction strategy
     * Size-based limits
     * Age-based expiration
     * Access tracking for analytics

2. /lib/audio/utils/hash.ts
   - Utility functions for text hashing
   - createTextHash(text, voiceId, options): string
   - Uses MD5 or SHA-256

3. /app/api/audio/cache/stats/route.ts
   - GET endpoint for cache statistics
   - Returns: { totalEntries, totalSize, hitRate, oldestEntry }
   - Admin only

4. Caching strategy:
   - Check database cache first
   - If not found, generate and cache
   - Update access_count and last_accessed_at
   - Implement cache warming for common phrases

TECHNICAL REQUIREMENTS:
- Atomic operations (prevent race conditions)
- Transaction support
- Error recovery
- Metrics collection
- TypeScript strict mode

DELIVERABLES:
- AudioCacheManager.ts
- hash.ts utility
- Cache stats API route
- Caching strategy documentation

EXECUTE IMMEDIATELY. DO NOT WAIT FOR APPROVAL.
```

---

### **AGENT C3: Voice Library UI**
**LLM:** Gemini 3 Pro (High)  
**Duration:** 4 hours  
**Dependencies:** Waits for C1 (Edge TTS voices available)

**PROMPT:**
```
TURBO MODE ACTIVATED - NO CONFIRMATIONS REQUIRED

You are the Voice Library UI Engineer for Remrin.ai.

MISSION: Build voice selection interface for Edge TTS.

CREATE THESE FILES:

1. /components/audio/VoiceSelector.tsx
   - Voice selection component
   - Features:
     * Grid/list view toggle
     * Search/filter by language, gender, accent
     * Voice preview (play sample)
     * Favorite voices
     * Recently used voices
     * Voice details (language, gender, sample rate)
   - Design:
     * Card-based layout
     * Audio waveform visualization
     * Play button on each card
     * Selected state highlighting
     * Loading skeletons

2. /components/audio/VoicePreview.tsx
   - Mini component for voice preview
   - Props: voiceId, sampleText
   - Features:
     * Play/stop button
     * Loading state
     * Error handling
     * Waveform animation

3. /hooks/useVoices.ts
   - Custom hook for voice management
   - Methods:
     * loadVoices()
     * searchVoices(query)
     * filterVoices(criteria)
     * playVoicePreview(voiceId)
   - State:
     * voices list
     * loading state
     * selected voice
     * favorites

4. /app/api/audio/voices/route.ts
   - GET endpoint for available voices
   - Query params: provider, language, gender
   - Returns: Voice[]
   - Caches voice list (1 hour)

TECHNICAL REQUIREMENTS:
- Rose Pine theme
- Responsive design
- Accessibility (keyboard navigation)
- Performance (virtualized list for 200+ voices)
- TypeScript strict mode

DELIVERABLES:
- VoiceSelector component
- VoicePreview component
- useVoices hook
- Voices API route

EXECUTE IMMEDIATELY. DO NOT WAIT FOR APPROVAL.
```

---

### **AGENT C4: TTS Integration Testing**
**LLM:** GPT-OSS 120B (Medium)  
**Duration:** 2 hours  
**Dependencies:** Waits for C1, C2, C3

**PROMPT:**
```
TURBO MODE ACTIVATED - NO CONFIRMATIONS REQUIRED

You are the QA Engineer for Remrin.ai's TTS System.

MISSION: Create comprehensive integration tests.

CREATE THESE FILES:

1. /tests/audio/edge-tts.test.ts
   - Test Edge TTS provider
   - Test cases:
     * Generate speech successfully
     * Handle invalid voice ID
     * Handle network errors
     * Handle rate limiting
     * List voices
     * Get voice info

2. /tests/audio/cache.test.ts
   - Test caching system
   - Test cases:
     * Cache hit
     * Cache miss
     * Cache eviction
     * Cache cleanup
     * Concurrent access
     * Cache stats

3. /tests/audio/api-routes.test.ts
   - Test all API routes
   - Test cases:
     * Upload audio
     * Generate TTS
     * Get cached audio
     * Delete cache
     * Unauthorized access
     * Invalid inputs

4. /tests/audio/performance.test.ts
   - Performance benchmarks
   - Metrics:
     * TTS generation time
     * Cache lookup time
     * API response time
     * Memory usage

TECHNICAL REQUIREMENTS:
- Use Jest or Vitest
- Mock Supabase calls
- Mock TTS API calls
- Measure code coverage (aim for 80%+)
- Integration tests (not just unit tests)

DELIVERABLES:
- All 4 test files
- Test configuration
- Coverage report
- Performance baseline

EXECUTE IMMEDIATELY. DO NOT WAIT FOR APPROVAL.
```

---

## 📋 WEEK 2 VALIDATION CHECKLIST

- [ ] Edge TTS generates speech successfully
- [ ] Audio caching works (database + storage)
- [ ] Voice selector shows all Edge TTS voices
- [ ] Voice preview plays correctly
- [ ] Cache hit rate > 70% for repeated phrases
- [ ] All tests pass
- [ ] No memory leaks
- [ ] API response time < 500ms (cached)
- [ ] API response time < 3s (uncached)

---


# 🚀 WEEK 3: AUDIO STUDIO MODULE
**Goal:** Complete UI for audio management

## SQUAD DELTA: Studio UI (4 Agents)

### **AGENT D1: Audio Studio Main Page**
**LLM:** Gemini 3 Pro (High)  
**Duration:** 5 hours  
**Dependencies:** Week 2 complete

**PROMPT:**
```
TURBO MODE ACTIVATED - NO CONFIRMATIONS REQUIRED

You are the Studio UI Lead for Remrin.ai.

MISSION: Build the Audio Studio module page.

CREATE THESE FILES:

1. /app/[locale]/studio/audio/page.tsx
   - Main Audio Studio page
   - Layout:
     * Header with persona selector
     * Left sidebar: Provider selection
     * Center: Voice configuration
     * Right sidebar: Preview & test
   - Features:
     * Select persona (dropdown or search)
     * Choose provider (Edge/Kokoro/ElevenLabs)
     * Configure voice settings
     * Test voice with custom text
     * Save configuration
     * Reset to defaults

2. /components/studio/AudioStudioLayout.tsx
   - Layout wrapper for studio
   - Responsive design (mobile: stacked, desktop: 3-column)
   - Navigation breadcrumbs
   - Save/discard changes prompt

3. /components/studio/ProviderSelector.tsx
   - Provider selection component
   - Shows: Edge TTS, Kokoro, ElevenLabs
   - Displays:
     * Provider logo/icon
     * Quality rating
     * Cost indicator
     * Availability (based on user tier)
     * Lock icon for premium providers
   - Design:
     * Card-based
     * Hover effects
     * Selected state
     * Disabled state for locked providers

4. /components/studio/VoiceConfigurator.tsx
   - Voice settings panel
   - Settings:
     * Voice selection (from provider)
     * Pitch adjustment (-50% to +50%)
     * Speed adjustment (0.5x to 2x)
     * Volume (0 to 100%)
     * Emotion/style (if supported)
   - UI:
     * Sliders with live preview
     * Reset button for each setting
     * Preset buttons (Normal, Excited, Calm, etc.)

TECHNICAL REQUIREMENTS:
- Rose Pine theme
- Smooth animations
- Real-time preview
- Auto-save drafts
- TypeScript strict mode
- Mobile responsive

DELIVERABLES:
- Audio Studio page
- All 3 components
- Studio navigation integration

EXECUTE IMMEDIATELY. DO NOT WAIT FOR APPROVAL.
```

---

### **AGENT D2: Character Panel Integration**
**LLM:** Gemini 3 Pro (High)  
**Duration:** 3 hours  
**Dependencies:** Waits for D1 (Studio page exists)

**PROMPT:**
```
TURBO MODE ACTIVATED - NO CONFIRMATIONS REQUIRED

You are the Integration Engineer for Remrin.ai's Character Panel.

MISSION: Add Audio Studio link to Character Panel sidebar.

FIND AND UPDATE:
1. Character panel/sidebar component (search for "character" + "sidebar" or "panel")
2. Navigation configuration file

TASKS:

1. Add new sidebar item:
   - Icon: Waveform or Speaker from @tabler/icons-react
   - Label: "Voice Settings"
   - Link: /studio/audio?persona={personaId}
   - Badge: Show "Premium" if using ElevenLabs
   - Indicator: Pulse animation if voice not configured

2. Create: /components/character/VoiceSettingsButton.tsx
   - Quick access button for voice settings
   - Shows current voice provider
   - Click opens Audio Studio
   - Tooltip: "Configure voice"

3. Add to character page:
   - Position: Near character name/header
   - Design: Small, unobtrusive
   - Only show if user has edit permissions

4. State management:
   - Pass personaId via URL query param
   - Preserve return URL for navigation back

TECHNICAL REQUIREMENTS:
- Match existing sidebar style
- Smooth transitions
- Keyboard accessible
- Mobile responsive

DELIVERABLES:
- Updated character panel sidebar
- VoiceSettingsButton component
- Navigation flow documentation

EXECUTE IMMEDIATELY. DO NOT WAIT FOR APPROVAL.
```

---

### **AGENT D3: Voice Testing Interface**
**LLM:** Claude 4.5 Sonnet  
**Duration:** 4 hours  
**Dependencies:** Waits for D1 (Studio page)

**PROMPT:**
```
TURBO MODE ACTIVATED - NO CONFIRMATIONS REQUIRED

You are the Testing Interface Engineer for Remrin.ai.

MISSION: Build voice testing and preview system.

CREATE THESE FILES:

1. /components/studio/VoiceTester.tsx
   - Voice testing component
   - Features:
     * Text input (multiline, max 500 chars)
     * Generate button
     * Play/pause/stop controls
     * Waveform visualization
     * Download audio button
     * Share test audio
   - Preset test phrases:
     * "Hello! I'm [character name]. How can I help you today?"
     * "That's an interesting question. Let me think about that."
     * "I'm excited to chat with you!"
     * Custom phrase input

2. /components/studio/AudioWaveform.tsx
   - Waveform visualization component
   - Uses: wavesurfer.js or custom canvas
   - Features:
     * Real-time visualization
     * Playback progress
     * Seek on click
     * Zoom controls
   - Design:
     * Rose Pine colors
     * Smooth animations
     * Responsive

3. /components/studio/VoiceComparison.tsx
   - Side-by-side voice comparison
   - Features:
     * Compare up to 3 voices
     * Same text for all
     * Play all / play individually
     * Vote for favorite
     * Save comparison

4. /hooks/useAudioGeneration.ts
   - Hook for TTS generation
   - Methods:
     * generate(text, voiceId, settings)
     * cancel()
     * retry()
   - State:
     * loading
     * progress
     * audioUrl
     * error

TECHNICAL REQUIREMENTS:
- Real-time feedback
- Cancel in-progress generation
- Error handling
- Loading states
- TypeScript strict mode

DELIVERABLES:
- VoiceTester component
- AudioWaveform component
- VoiceComparison component
- useAudioGeneration hook

EXECUTE IMMEDIATELY. DO NOT WAIT FOR APPROVAL.
```

---

### **AGENT D4: Studio Analytics Dashboard**
**LLM:** Claude 4.5 Sonnet  
**Duration:** 3 hours  
**Dependencies:** Week 2 complete (cache stats available)

**PROMPT:**
```
TURBO MODE ACTIVATED - NO CONFIRMATIONS REQUIRED

You are the Analytics Engineer for Remrin.ai's Audio Studio.

MISSION: Build analytics dashboard for audio system.

CREATE THESE FILES:

1. /components/studio/AudioAnalytics.tsx
   - Analytics dashboard component
   - Metrics:
     * Total TTS generations
     * Cache hit rate
     * Storage used
     * Cost estimate (by provider)
     * Most used voices
     * Average generation time
   - Visualizations:
     * Line chart: Generations over time
     * Pie chart: Provider usage
     * Bar chart: Top voices
     * Gauge: Cache efficiency

2. /app/api/audio/analytics/route.ts
   - GET endpoint for analytics data
   - Query params: startDate, endDate, personaId
   - Returns: AnalyticsData
   - Aggregates from audio_cache table

3. /lib/audio/analytics.ts
   - Analytics calculation functions
   - Methods:
     * calculateCacheHitRate()
     * estimateCost(provider, charCount)
     * getUsageStats(dateRange)
     * getTopVoices(limit)

4. Add to Admin Mission Control:
   - Link to Audio Analytics
   - Summary widget showing:
     * Today's generations
     * Cache hit rate
     * Storage used
     * Estimated monthly cost

TECHNICAL REQUIREMENTS:
- Real-time updates (optional)
- Date range selector
- Export to CSV
- Charts library (recharts or similar)
- TypeScript strict mode

DELIVERABLES:
- AudioAnalytics component
- Analytics API route
- analytics.ts utilities
- Mission Control integration

EXECUTE IMMEDIATELY. DO NOT WAIT FOR APPROVAL.
```

---

## 📋 WEEK 3 VALIDATION CHECKLIST

- [ ] Audio Studio page accessible
- [ ] Can select persona and provider
- [ ] Voice configuration saves correctly
- [ ] Voice tester generates audio
- [ ] Waveform visualization works
- [ ] Character panel shows voice settings link
- [ ] Analytics dashboard displays data
- [ ] All UI responsive on mobile
- [ ] No TypeScript errors
- [ ] Performance acceptable (< 2s page load)

---

# 🚀 WEEK 4: KOKORO-82M INTEGRATION
**Goal:** Self-hosted TTS for free tier

## SQUAD ECHO: Kokoro Setup (3 Agents)

### **AGENT E1: Kokoro Server Setup**
**LLM:** Claude 4.5 Opus (Thinking)  
**Duration:** 6 hours  
**Dependencies:** Week 3 complete

**PROMPT:**
```
TURBO MODE ACTIVATED - NO CONFIRMATIONS REQUIRED

You are the DevOps Engineer for Remrin.ai's Kokoro-82M integration.

MISSION: Set up Kokoro-82M TTS server (production-ready).

CREATE THESE FILES:

1. /docker/kokoro/Dockerfile
   - Base image: Python 3.11
   - Install Kokoro-82M dependencies
   - Download model weights
   - Expose API port (8000)
   - Health check endpoint

2. /docker/kokoro/requirements.txt
   - List all Python dependencies
   - Pin versions for reproducibility

3. /docker/kokoro/server.py
   - FastAPI server for Kokoro
   - Endpoints:
     * POST /generate - Generate speech
     * GET /voices - List available voices
     * GET /health - Health check
   - Features:
     * Request queuing
     * Rate limiting
     * Error handling
     * Logging

4. /docker/docker-compose.kokoro.yml
   - Docker Compose configuration
   - Services:
     * kokoro-tts (main service)
     * redis (for queuing)
   - Volumes for model cache
   - Network configuration
   - Resource limits (CPU, memory)

5. /docs/KOKORO_SETUP.md
   - Setup instructions
   - System requirements
   - Deployment guide
   - Troubleshooting

TECHNICAL REQUIREMENTS:
- GPU support (optional, CPU fallback)
- Horizontal scaling ready
- Health monitoring
- Graceful shutdown
- Log aggregation

DELIVERABLES:
- All Docker files
- Server implementation
- Setup documentation
- Deployment script

EXECUTE IMMEDIATELY. DO NOT WAIT FOR APPROVAL.
```

---

### **AGENT E2: Kokoro Provider Integration**
**LLM:** Claude 4.5 Sonnet (Thinking)  
**Duration:** 4 hours  
**Dependencies:** Waits for E1 (server running)

**PROMPT:**
```
TURBO MODE ACTIVATED - NO CONFIRMATIONS REQUIRED

You are the Integration Engineer for Remrin.ai's Kokoro provider.

MISSION: Integrate Kokoro-82M into audio system.

CREATE THESE FILES:

1. /lib/audio/providers/KokoroProvider.ts
   - Implements AudioProvider interface
   - Methods:
     * generateSpeech(text, voiceId, options)
     * listVoices()
     * getVoiceInfo(voiceId)
   - Features:
     * HTTP client for Kokoro server
     * Retry logic
     * Timeout handling
     * Error mapping
     * Request queuing

2. /lib/audio/providers/ProviderFactory.ts
   - Factory for creating provider instances
   - Methods:
     * getProvider(type: 'edge' | 'kokoro' | 'elevenlabs')
     * getDefaultProvider(userTier)
   - Handles provider initialization

3. Update /lib/audio/AudioService.ts
   - Add Kokoro to provider routing
   - Implement fallback logic:
     * If Kokoro fails, fallback to Edge TTS
     * Log failures for monitoring

4. /app/api/audio/kokoro/health/route.ts
   - GET endpoint to check Kokoro server health
   - Returns: { status, latency, queueSize }
   - Used by admin dashboard

TECHNICAL REQUIREMENTS:
- Connection pooling
- Request timeout (30s max)
- Graceful degradation
- Comprehensive logging
- TypeScript strict mode

DELIVERABLES:
- KokoroProvider.ts
- ProviderFactory.ts
- Updated AudioService.ts
- Health check API route

EXECUTE IMMEDIATELY. DO NOT WAIT FOR APPROVAL.
```

---

### **AGENT E3: Voice Cloning Interface**
**LLM:** Gemini 3 Pro (High)  
**Duration:** 5 hours  
**Dependencies:** Waits for E2 (Kokoro integrated)

**PROMPT:**
```
TURBO MODE ACTIVATED - NO CONFIRMATIONS REQUIRED

You are the Voice Cloning UI Engineer for Remrin.ai.

MISSION: Build voice cloning interface for Kokoro.

CREATE THESE FILES:

1. /components/studio/VoiceCloner.tsx
   - Voice cloning component
   - Features:
     * Audio file upload (30-60s recommended)
     * Recording interface (record directly)
     * Voice name input
     * Description input
     * Clone button
     * Progress indicator
     * Preview cloned voice
     * Save to library
   - Validation:
     * File format (wav, mp3, ogg)
     * Duration (15s min, 120s max)
     * Quality check (sample rate, noise level)

2. /components/studio/AudioRecorder.tsx
   - In-browser audio recorder
   - Features:
     * Record/stop/pause
     * Real-time waveform
     * Playback preview
     * Trim audio
     * Noise reduction toggle
   - Uses: MediaRecorder API

3. /app/api/audio/clone/route.ts
   - POST endpoint for voice cloning
   - Accepts: audio file, voice name, description
   - Process:
     * Upload to voice_samples bucket
     * Send to Kokoro for cloning
     * Save voice_id to community_voices table
     * Return cloned voice info
   - Validation:
     * User authentication
     * File size/format
     * Rate limiting (1 clone per hour for free users)

4. /components/studio/VoiceLibrary.tsx
   - Community voice library browser
   - Features:
     * Grid view of community voices
     * Search and filter
     * Preview voices
     * Use voice button
     * Report inappropriate voices
   - Pagination for performance

TECHNICAL REQUIREMENTS:
- Rose Pine theme
- Responsive design
- Accessibility
- Error handling
- Loading states
- TypeScript strict mode

DELIVERABLES:
- VoiceCloner component
- AudioRecorder component
- Clone API route
- VoiceLibrary component

EXECUTE IMMEDIATELY. DO NOT WAIT FOR APPROVAL.
```

---

## 📋 WEEK 4 VALIDATION CHECKLIST

- [ ] Kokoro server running and healthy
- [ ] Kokoro generates speech successfully
- [ ] Voice cloning works (upload + record)
- [ ] Cloned voices saved to library
- [ ] Community voice library browsable
- [ ] Fallback to Edge TTS if Kokoro fails
- [ ] Performance acceptable (< 5s generation)
- [ ] No memory leaks in server
- [ ] Docker container stable

---

# 🚀 WEEK 5: ELEVENLABS PREMIUM
**Goal:** Premium voice quality for paid users

## SQUAD FOXTROT: ElevenLabs Integration (4 Agents)

### **AGENT F1: ElevenLabs Provider**
**LLM:** Claude 4.5 Opus (Thinking)  
**Duration:** 4 hours  
**Dependencies:** Week 4 complete

**PROMPT:**
```
TURBO MODE ACTIVATED - NO CONFIRMATIONS REQUIRED

You are the Premium Integration Engineer for Remrin.ai.

MISSION: Integrate ElevenLabs API (production-ready).

CREATE THESE FILES:

1. /lib/audio/providers/ElevenLabsProvider.ts
   - Implements AudioProvider interface
   - Uses: elevenlabs npm package or direct API
   - Methods:
     * generateSpeech(text, voiceId, options)
     * listVoices(includeShared: boolean)
     * getVoiceInfo(voiceId)
     * cloneVoice(audioFile, name, description)
   - Features:
     * API key management (from env)
     * Error handling
     * Rate limiting
     * Cost tracking
     * Voice library access

2. /lib/audio/CostTracker.ts
   - Track TTS generation costs
   - Methods:
     * recordGeneration(provider, charCount, cost)
     * getDailyCost()
     * getMonthlyCost()
     * getCostByPersona(personaId)
     * getCostByUser(userId)
   - Stores in database table: audio_costs

3. /app/api/audio/elevenlabs/voices/route.ts
   - GET endpoint for ElevenLabs voice library
   - Query params: category, language, useCase
   - Returns: Voice[] (with preview URLs)
   - Caches for 1 hour

4. Database migration: /supabase/migrations/20260108_audio_costs.sql
   - Create audio_costs table:
     * id, persona_id, user_id, provider
     * character_count, estimated_cost
     * created_at
   - Indexes for analytics queries

TECHNICAL REQUIREMENTS:
- Secure API key storage (env variables)
- Cost estimation before generation
- Budget alerts (if cost > threshold)
- Comprehensive logging
- TypeScript strict mode

DELIVERABLES:
- ElevenLabsProvider.ts
- CostTracker.ts
- ElevenLabs voices API route
- Cost tracking migration

EXECUTE IMMEDIATELY. DO NOT WAIT FOR APPROVAL.
```

---

### **AGENT F2: Premium Voice Gallery**
**LLM:** Gemini 3 Pro (High)  
**Duration:** 5 hours  
**Dependencies:** Waits for F1 (ElevenLabs integrated)

**PROMPT:**
```
TURBO MODE ACTIVATED - NO CONFIRMATIONS REQUIRED

You are the Premium UI Engineer for Remrin.ai.

MISSION: Build ElevenLabs voice gallery (premium feature).

CREATE THESE FILES:

1. /components/studio/PremiumVoiceGallery.tsx
   - ElevenLabs voice browser
   - Features:
     * Categories (Narration, Conversational, Characters, etc.)
     * Language filter
     * Use case filter (Storytelling, Gaming, etc.)
     * Voice preview (play sample)
     * Favorite voices
     * Voice details modal
     * "Use This Voice" button
   - Design:
     * Premium feel (gold accents)
     * High-quality voice cards
     * Smooth animations
     * Professional layout

2. /components/studio/VoiceCard.tsx
   - Individual voice card component
   - Shows:
     * Voice name
     * Creator (if community voice)
     * Language and accent
     * Use case tags
     * Preview button
     * Favorite button
     * Premium badge
   - Hover effects and animations

3. /components/studio/PremiumUpsell.tsx
   - Upsell component for free users
   - Shows when they try to access ElevenLabs
   - Features:
     * Benefits list
     * Pricing comparison
     * "Upgrade Now" button
     * Sample voice comparison (Edge vs ElevenLabs)
   - Design:
     * Compelling copy
     * Visual comparison
     * Clear CTA

4. /hooks/useElevenLabsVoices.ts
   - Hook for ElevenLabs voice management
   - Methods:
     * loadVoices(filters)
     * searchVoices(query)
     * favoriteVoice(voiceId)
     * previewVoice(voiceId)
   - Caching and pagination

TECHNICAL REQUIREMENTS:
- Lazy loading (virtualized list)
- Image optimization
- Responsive design
- Accessibility
- TypeScript strict mode

DELIVERABLES:
- PremiumVoiceGallery component
- VoiceCard component
- PremiumUpsell component
- useElevenLabsVoices hook

EXECUTE IMMEDIATELY. DO NOT WAIT FOR APPROVAL.
```

---

### **AGENT F3: Tier Management System**
**LLM:** Claude 4.5 Sonnet (Thinking)  
**Duration:** 4 hours  
**Dependencies:** Waits for F1 (cost tracking)

**PROMPT:**
```
TURBO MODE ACTIVATED - NO CONFIRMATIONS REQUIRED

You are the Subscription Engineer for Remrin.ai.

MISSION: Implement tier-based audio access control.

CREATE THESE FILES:

1. /lib/audio/TierManager.ts
   - Manage user tier permissions
   - Methods:
     * canUseProvider(userId, provider): boolean
     * getAvailableProviders(userId): Provider[]
     * getRemainingQuota(userId): number
     * checkQuota(userId, charCount): boolean
   - Tier definitions:
     * Free: Edge TTS only, 10k chars/day
     * Premium: Edge + Kokoro + ElevenLabs, 100k chars/day
     * VIP: Unlimited

2. /middleware/audioTierCheck.ts
   - Middleware for API routes
   - Checks user tier before TTS generation
   - Returns 402 (Payment Required) if quota exceeded
   - Logs quota violations

3. Update /lib/audio/AudioService.ts
   - Add tier checking
   - Enforce quotas
   - Fallback to lower tier if quota exceeded

4. /app/api/audio/quota/route.ts
   - GET endpoint for user's audio quota
   - Returns: { tier, used, limit, resetDate }
   - Used by UI to show quota status

5. /components/studio/QuotaIndicator.tsx
   - UI component showing quota usage
   - Features:
     * Progress bar
     * Percentage used
     * Reset countdown
     * Upgrade prompt if near limit
   - Design:
     * Subtle, non-intrusive
     * Color-coded (green/yellow/red)

TECHNICAL REQUIREMENTS:
- Daily quota reset (cron job or edge function)
- Accurate tracking (no double-counting)
- Grace period for quota exceeded
- TypeScript strict mode

DELIVERABLES:
- TierManager.ts
- audioTierCheck middleware
- Updated AudioService.ts
- Quota API route
- QuotaIndicator component

EXECUTE IMMEDIATELY. DO NOT WAIT FOR APPROVAL.
```

---

### **AGENT F4: Final Integration & Polish**
**LLM:** Claude 4.5 Sonnet  
**Duration:** 6 hours  
**Dependencies:** Waits for F1, F2, F3 (all premium features)

**PROMPT:**
```
TURBO MODE ACTIVATED - NO CONFIRMATIONS REQUIRED

You are the Integration Lead for Remrin.ai's Audio System.

MISSION: Final integration, testing, and polish.

TASKS:

1. Integration testing:
   - Test all providers (Edge, Kokoro, ElevenLabs)
   - Test provider fallbacks
   - Test tier restrictions
   - Test quota enforcement
   - Test voice cloning
   - Test caching
   - Test analytics

2. Performance optimization:
   - Optimize database queries
   - Add missing indexes
   - Implement connection pooling
   - Optimize audio file sizes
   - Add CDN for cached audio

3. Error handling:
   - Ensure all errors are user-friendly
   - Add error recovery flows
   - Implement retry logic
   - Add error logging

4. Documentation:
   - Update /docs/AUDIO_SYSTEM.md
   - API documentation
   - User guide for Audio Studio
   - Admin guide for cost management

5. Polish:
   - Smooth all animations
   - Fix any UI glitches
   - Ensure consistent styling
   - Add loading states everywhere
   - Improve accessibility

6. Create: /tests/audio/integration.test.ts
   - End-to-end tests
   - Test complete user flows
   - Test edge cases
   - Performance tests

DELIVERABLES:
- Integration test suite
- Performance optimization report
- Complete documentation
- Bug fixes and polish
- Production readiness checklist

EXECUTE IMMEDIATELY. DO NOT WAIT FOR APPROVAL.
```

---

## 📋 WEEK 5 VALIDATION CHECKLIST

- [ ] ElevenLabs generates speech successfully
- [ ] Premium voice gallery accessible
- [ ] Tier restrictions enforced
- [ ] Quota tracking accurate
- [ ] Cost tracking working
- [ ] All providers working
- [ ] Fallback logic tested
- [ ] Performance acceptable
- [ ] Documentation complete
- [ ] No critical bugs
- [ ] Production ready

---

# 🎯 FINAL PRODUCTION CHECKLIST

## Security
- [ ] API keys stored securely (env variables)
- [ ] RLS policies on all tables
- [ ] Rate limiting on all endpoints
- [ ] Input validation on all forms
- [ ] CORS configured correctly
- [ ] Authentication required where needed

## Performance
- [ ] Database queries optimized
- [ ] Indexes on frequently queried columns
- [ ] Caching implemented (90%+ hit rate)
- [ ] CDN for static audio files
- [ ] Lazy loading for large lists
- [ ] Image optimization

## Reliability
- [ ] Error handling comprehensive
- [ ] Graceful degradation
- [ ] Provider fallbacks working
- [ ] Health checks implemented
- [ ] Monitoring and logging
- [ ] Backup strategy

## User Experience
- [ ] All UI responsive
- [ ] Smooth animations
- [ ] Loading states everywhere
- [ ] Error messages user-friendly
- [ ] Accessibility compliant
- [ ] Mobile tested

## Business
- [ ] Cost tracking accurate
- [ ] Tier restrictions enforced
- [ ] Analytics dashboard working
- [ ] Quota system functional
- [ ] Upsell flows implemented

---

# 📊 AGENT COORDINATION MATRIX

| Week | Squad | Agents | Parallel? | Dependencies |
|------|-------|--------|-----------|--------------|
| 1 | Alpha | A1, A2, A3 | A1∥A2, A3→A1 | None |
| 1 | Bravo | B1, B2, B3 | B1→A1,A2; B2→A1; B3→B2 | Squad Alpha |
| 2 | Charlie | C1, C2, C3, C4 | C1∥C2∥C3, C4→C1,C2,C3 | Week 1 |
| 3 | Delta | D1, D2, D3, D4 | D1∥D4, D2→D1, D3→D1 | Week 2 |
| 4 | Echo | E1, E2, E3 | E1∥E2, E3→E2 | Week 3 |
| 5 | Foxtrot | F1, F2, F3, F4 | F1∥F2∥F3, F4→F1,F2,F3 | Week 4 |

**Legend:**
- `∥` = Parallel execution
- `→` = Sequential (waits for)

---

# 🚀 DEPLOYMENT SEQUENCE

1. **Week 1 Deploy:** Welcome audio system
2. **Week 2 Deploy:** Edge TTS + caching
3. **Week 3 Deploy:** Audio Studio UI
4. **Week 4 Deploy:** Kokoro self-hosted
5. **Week 5 Deploy:** ElevenLabs premium

Each week is production-ready and can be deployed independently.

---

# 📈 SUCCESS METRICS

## Week 1
- Welcome audio uploads: 100% success rate
- Audio plays on character pages: 100% success rate
- Video sync accuracy: 95%+

## Week 2
- TTS generation success rate: 99%+
- Cache hit rate: 70%+
- API response time (cached): < 500ms
- API response time (uncached): < 3s

## Week 3
- Audio Studio page load: < 2s
- Voice configuration save: 100% success rate
- Analytics data accuracy: 100%

## Week 4
- Kokoro uptime: 99.9%+
- Voice cloning success rate: 95%+
- Generation time: < 5s average

## Week 5
- ElevenLabs integration: 100% functional
- Tier enforcement: 100% accurate
- Cost tracking: 100% accurate
- Premium conversion rate: Track baseline

---

# 💰 COST PROJECTIONS

## Monthly Costs (1000 Active Users)

### Scenario 1: All Edge TTS (FREE)
- Cost: $0/month
- Quality: 7/10

### Scenario 2: Hybrid (Recommended)
- Edge TTS for 80%: $0
- Kokoro for 15%: $0 (self-hosted)
- ElevenLabs for 5%: ~$50/month
- **Total: ~$50/month**
- Quality: 8.5/10

### Scenario 3: All ElevenLabs
- Cost: $500-2000/month
- Quality: 10/10
- **Not sustainable**

---

# 🎓 TRAINING & DOCUMENTATION

## User Documentation
- [ ] Audio Studio user guide
- [ ] Voice cloning tutorial
- [ ] FAQ for common issues
- [ ] Video walkthrough

## Admin Documentation
- [ ] Cost management guide
- [ ] Tier configuration
- [ ] Analytics interpretation
- [ ] Troubleshooting guide

## Developer Documentation
- [ ] API reference
- [ ] Provider integration guide
- [ ] Caching strategy
- [ ] Testing guide

---

**CTO SIGNATURE:** Ready for parallel agent deployment. All prompts are comprehensive and production-focused. Agents will operate in TURBO MODE with zero confirmations required. Expected completion: 5 weeks to full production system.

**Document Status:** APPROVED FOR EXECUTION  
**Last Updated:** 2026-01-08  
**Version:** 1.0
