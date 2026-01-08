# 🎙️ Remrin.ai Audio System Documentation

> Complete guide for the Audio System, including TTS providers, caching, voice cloning, and API reference.

**Version:** 1.0  
**Last Updated:** 2026-01-08  
**Status:** Production Ready

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [TTS Providers](#tts-providers)
4. [Audio Caching](#audio-caching)
5. [Tier Management](#tier-management)
6. [Voice Cloning](#voice-cloning)
7. [API Reference](#api-reference)
8. [Audio Studio UI](#audio-studio-ui)
9. [Configuration](#configuration)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The Remrin.ai Audio System provides comprehensive text-to-speech (TTS) functionality for character personas, featuring:

- **Multiple TTS Providers**: Edge TTS (free), Kokoro-82M (premium), ElevenLabs (enterprise)
- **Intelligent Caching**: Database + storage caching with LRU eviction
- **Tier-Based Access**: Feature gating based on subscription tier
- **Voice Cloning**: Custom voice creation (premium feature)
- **Analytics Dashboard**: Usage tracking and cost monitoring

### Quick Start

```typescript
import { getAudioService } from '@/lib/audio/AudioService';

const audioService = getAudioService();

// Generate speech
const result = await audioService.generateSpeech({
    text: 'Hello, welcome to Remrin!',
    personaId: 'your-persona-id',
    userId: 'user-id',
});

console.log('Audio URL:', result.audioUrl);
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Audio System                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │   API       │───▶│   Audio     │───▶│     Providers       │  │
│  │   Routes    │    │   Service   │    │  Edge/Kokoro/Labs   │  │
│  └─────────────┘    └─────────────┘    └─────────────────────┘  │
│         │                  │                                     │
│         │                  ▼                                     │
│         │          ┌─────────────┐                              │
│         │          │   Cache     │                              │
│         │          │   Manager   │                              │
│         │          └─────────────┘                              │
│         │                  │                                     │
│         ▼                  ▼                                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │   Access    │    │  Supabase   │    │      Storage        │  │
│  │   Control   │    │  Database   │    │    (audio_cache)    │  │
│  └─────────────┘    └─────────────┘    └─────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Core Components

| Component | File | Description |
|-----------|------|-------------|
| AudioService | `lib/audio/AudioService.ts` | Main service orchestrating TTS generation |
| AudioCacheManager | `lib/audio/AudioCacheManager.ts` | Cache management with LRU eviction |
| ProviderFactory | `lib/audio/providers/ProviderFactory.ts` | Provider instantiation and selection |
| AccessControl | `lib/audio/access/AccessControl.ts` | Tier-based feature access |
| AudioUsageService | `lib/audio/quota/AudioUsageService.ts` | Usage tracking and quota enforcement |

---

## TTS Providers

### Edge TTS (Default - Free)

Microsoft's Edge TTS provides high-quality neural voices for free.

**Features:**
- 300+ neural voices across 70+ languages
- SSML support for emotion and emphasis
- No API key required
- Rate limiting: ~100 requests/minute

**Configuration:**
```typescript
import { EdgeTTSProvider } from '@/lib/audio/providers';

const provider = new EdgeTTSProvider({
    retryAttempts: 3,
    retryDelayMs: 1000,
});

const result = await provider.generateSpeech(
    'Hello world!',
    'en-US-JennyNeural',
    { rate: 1.0, pitch: 1.0 }
);
```

**Available Voices (Sample):**
| Voice ID | Language | Gender | Style |
|----------|----------|--------|-------|
| en-US-JennyNeural | English (US) | Female | Friendly |
| en-US-GuyNeural | English (US) | Male | Professional |
| en-GB-LibbyNeural | English (UK) | Female | Warm |
| ja-JP-NanamiNeural | Japanese | Female | Natural |

---

### Kokoro-82M (Premium)

High-quality local TTS model with expressive voices.

**Features:**
- Extremely high-quality audio
- Low latency (local inference)
- Voice cloning support
- Custom voice training

**Requirements:**
- Kokoro server running on port 8880
- Premium tier subscription (Architect+)

**Setup:**
```bash
# Start Kokoro server (Docker)
docker-compose -f docker-compose.kokoro.yml up -d
```

**Configuration:**
```typescript
import { KokoroProvider } from '@/lib/audio/providers';

const provider = new KokoroProvider({
    apiUrl: 'http://localhost:8880/v1',
    maxConcurrentRequests: 3,
    queueSize: 10,
});
```

**Voice Mapping:**
| Kokoro Voice | Fallback Edge Voice |
|--------------|---------------------|
| af_sarah | en-US-SaraNeural |
| am_michael | en-US-GuyNeural |
| bf_emma | en-GB-LibbyNeural |

---

### ElevenLabs (Enterprise)

Premium voice synthesis with the highest quality.

**Features:**
- Studio-quality voices
- Voice cloning from samples
- Emotion control
- Multi-language support

**Requirements:**
- ElevenLabs API key
- Titan tier subscription

**Configuration:**
```env
ELEVENLABS_API_KEY=your-api-key
```

---

## Audio Caching

### Cache Strategy

The caching system uses a two-tier approach:

1. **Database (audio_cache table)**: Metadata and lookup
2. **Storage (audio_cache bucket)**: Actual audio files

### Cache Key Generation

```typescript
import { createTextHash } from '@/lib/audio/utils/hash';

const hash = createTextHash(
    'Hello world',           // Text
    'en-US-JennyNeural',    // Voice ID
    { rate: 1.0 }           // Options
);
// Result: sha256 hash like "a1b2c3d4..."
```

### Cache Configuration

```typescript
import { getAudioCache } from '@/lib/audio/AudioCacheManager';

const cache = getAudioCache({
    maxEntries: 10000,           // Max cached items
    maxSizeBytes: 5 * 1024**3,   // 5GB max size
    maxAgeHours: 24 * 30,        // 30 days retention
});
```

### Cache Operations

```typescript
// Get cached audio
const cached = await cache.get('text-hash-123');
if (cached) {
    console.log('Cache hit!', cached.audioUrl);
}

// Store audio
await cache.set('text-hash-456', 'https://url/audio.mp3', {
    voiceId: 'en-US-JennyNeural',
    voiceProvider: 'edge',
    fileSize: 50000,
    duration: 5.5,
});

// Cleanup old entries
const stats = await cache.cleanup(30, 2 * 1024**3);
console.log(`Deleted ${stats.deletedCount} entries, freed ${stats.freedBytes} bytes`);
```

---

## Tier Management

### Subscription Tiers & Limits

| Feature | Wanderer (Free) | Soul Weaver | Architect | Titan |
|---------|-----------------|-------------|-----------|-------|
| Monthly Generations | 50 | 500 | 2,000 | 10,000 |
| Providers | Edge only | Edge | Edge + Kokoro | All |
| Voice Cloning | ❌ | ❌ | ✅ (3 voices) | ✅ (10 voices) |
| Storage | 50MB | 500MB | 2GB | 10GB |
| Analytics | Basic | Basic | Advanced | Full |

### Feature Access Check

```typescript
import { AudioAccessControl, AUDIO_TIER_LIMITS } from '@/lib/audio/access/AccessControl';

// Check specific feature
const canUseKokoro = await AudioAccessControl.checkFeatureAccess(userId, 'kokoro');
const canClone = await AudioAccessControl.checkFeatureAccess(userId, 'cloning');

// Get all limits
const limits = await AudioAccessControl.getLimits(userId);
console.log('Monthly limit:', limits.monthlyGenerationLimit);
```

### Quota Enforcement

```typescript
import { AudioUsageService } from '@/lib/audio/quota/AudioUsageService';

// Check before generation
const hasQuota = await AudioUsageService.checkQuota(userId);
if (!hasQuota) {
    throw new Error('Monthly generation limit reached');
}

// Track usage after generation
await AudioUsageService.trackGeneration(
    userId,
    'edge',
    'en-US-JennyNeural',
    characterCount,
    durationSeconds
);
```

---

## Voice Cloning

### Prerequisites

- Architect or Titan subscription tier
- Audio sample (10-60 seconds, clear speech)

### Cloning Process

1. **Upload Sample**: User uploads voice sample
2. **Process**: System sends to Kokoro for training
3. **Store**: Cloned voice ID saved to `community_voices` table
4. **Use**: Voice available for TTS generation

### API Usage

```typescript
// POST /api/audio/clone
const response = await fetch('/api/audio/clone', {
    method: 'POST',
    body: formData, // Includes audio file
});

const { voiceId, name } = await response.json();
```

### Database Schema

```sql
CREATE TABLE community_voices (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    voice_provider TEXT NOT NULL DEFAULT 'kokoro',
    voice_id TEXT NOT NULL,
    sample_audio_url TEXT,
    created_by_user_id UUID REFERENCES auth.users(id),
    is_public BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## API Reference

### Generate TTS

**POST** `/api/audio/generate`

Generate text-to-speech audio with caching.

```typescript
// Request
{
    text: string;           // Required: Text to convert
    personaId: string;      // Required: Persona UUID
    voiceId?: string;       // Optional: Override persona voice
    provider?: 'edge' | 'kokoro' | 'elevenlabs';
    settings?: {
        rate?: number;      // 0.5 - 2.0
        pitch?: number;     // 0.5 - 2.0
        volume?: number;    // 0.0 - 1.0
    }
}

// Response
{
    success: boolean;
    audioUrl: string;
    cached: boolean;
    duration?: number;
    error?: string;
}
```

---

### List Voices

**GET** `/api/audio/voices`

Get available voices for a provider.

```typescript
// Query params
?provider=edge&language=en&gender=Female

// Response
[
    {
        id: 'en-US-JennyNeural',
        name: 'Jenny',
        gender: 'Female',
        language: 'English',
        locale: 'en-US',
        provider: 'edge',
        previewUrl: '...'
    }
]
```

---

### Upload Welcome Audio

**POST** `/api/audio/upload`

Upload a custom welcome audio for a persona.

```typescript
// Request (FormData)
file: File           // Audio file (max 50MB)
personaId: string    // Persona UUID

// Response
{
    success: boolean;
    audioUrl: string;
    error?: string;
}
```

---

### Get Persona Audio Settings

**GET** `/api/audio/[personaId]`

Get audio settings for a persona.

```typescript
// Response
{
    voice_provider: 'edge' | 'kokoro' | 'elevenlabs';
    voice_id: string;
    voice_settings: object;
    welcome_audio_url: string | null;
}
```

---

### Update Persona Audio Settings

**PUT** `/api/audio/[personaId]`

Update audio settings for a persona.

```typescript
// Request
{
    voice_provider?: 'edge' | 'kokoro' | 'elevenlabs';
    voice_id?: string;
    voice_settings?: object;
}
```

---

### Cache Statistics

**GET** `/api/audio/cache/stats`

Get cache statistics (admin only).

```typescript
// Response
{
    success: boolean;
    stats: {
        totalEntries: number;
        totalSize: number;
        totalSizeFormatted: string;
        hitRate: string;
        oldestEntry: string | null;
        topVoices: Array<{ voiceId: string; count: number }>;
    }
}
```

---

### Cache Cleanup

**DELETE** `/api/audio/cache/cleanup`

Clean up old cache entries (admin only).

```typescript
// Request
{
    olderThanDays?: number;  // Default: 30
    minHitCount?: number;    // Default: 0
}

// Response
{
    success: boolean;
    deletedCount: number;
    freedBytes: number;
}
```

---

### Kokoro Health Check

**GET** `/api/audio/kokoro/health`

Check Kokoro TTS server status.

```typescript
// Response
{
    status: 'healthy' | 'degraded' | 'unavailable';
    uptime?: number;
    queueSize?: number;
    message?: string;
}
```

---

### Audio Analytics

**GET** `/api/audio/analytics`

Get audio usage analytics (admin only).

```typescript
// Query params
?from=2026-01-01&to=2026-01-31

// Response
{
    success: boolean;
    data: {
        totalGenerations: number;
        totalDuration: number;
        byProvider: Record<string, number>;
        byDay: Array<{ date: string; count: number }>;
        topVoices: Array<{ voiceId: string; count: number }>;
        cacheHitRate: number;
    }
}
```

---

## Audio Studio UI

### Components

| Component | Path | Description |
|-----------|------|-------------|
| AudioStudioLayout | `components/studio/AudioStudioLayout.tsx` | Main layout wrapper |
| ProviderSelector | `components/studio/ProviderSelector.tsx` | Provider selection |
| VoiceConfigurator | `components/studio/VoiceConfigurator.tsx` | Voice settings |
| VoiceTester | `components/studio/VoiceTester.tsx` | Preview and test |
| VoiceCloner | `components/studio/VoiceCloner.tsx` | Voice cloning UI |
| VoiceLibrary | `components/studio/VoiceLibrary.tsx` | Community voices |
| AudioAnalytics | `components/studio/AudioAnalytics.tsx` | Usage dashboard |

### Hooks

| Hook | Path | Purpose |
|------|------|---------|
| useVoices | `hooks/useVoices.ts` | Voice list management |
| useAudioGeneration | `hooks/useAudioGeneration.ts` | TTS generation |
| useAudioVideoSync | `hooks/useAudioVideoSync.ts` | Audio/video sync |
| useElevenLabsVoices | `hooks/useElevenLabsVoices.ts` | ElevenLabs voices |

---

## Configuration

### Environment Variables

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Kokoro (Optional - Premium)
KOKORO_API_URL=http://localhost:8880/v1

# ElevenLabs (Optional - Enterprise)
ELEVENLABS_API_KEY=your-api-key
```

### Database Migrations

Required migrations in order:
1. `20260108_audio_system_foundation.sql` - Core schema
2. `20260108_audio_storage_buckets.sql` - Storage buckets
3. `20260108_audio_usage_tracking.sql` - Usage tracking

### Storage Buckets

| Bucket | Purpose | Max Size | Public |
|--------|---------|----------|--------|
| persona_audio | Welcome messages | 50MB | ✅ Read |
| audio_cache | TTS cache | 50MB | ✅ Read |
| voice_samples | Clone samples | 50MB | ❌ |

---

## Troubleshooting

### Common Issues

#### "Supabase configuration missing"
```bash
# Ensure environment variables are set
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
```

#### "Provider not available"
```typescript
// Check provider registration
const service = getAudioService();
console.log('Providers:', service.providers.keys());
```

#### "Monthly generation limit reached"
- User needs to upgrade subscription tier
- Check current usage in Admin Dashboard

#### "Kokoro server unavailable"
```bash
# Check if Kokoro is running
curl http://localhost:8880/health

# Check Docker
docker-compose -f docker-compose.kokoro.yml ps
```

#### Cache not working
```typescript
// Check cache stats
const cache = getAudioCache();
const stats = await cache.getStats();
console.log('Cache entries:', stats.totalEntries);
```

### Logging

Enable debug logging:
```typescript
// In AudioService
console.log('[AudioService] Generate speech request | User:', userId);
console.log('[AudioService] Cache HIT | Hash:', textHash);
console.log('[AudioService] Cache MISS | Generating with', provider);
```

### Performance Optimization

1. **Cache Hit Rate**: Aim for >70% hit rate
2. **API Response Time**: <500ms cached, <3s uncached
3. **Cache Size**: Monitor and clean up regularly
4. **Concurrent Requests**: Limit to 3-5 per user

---

## Production Readiness Checklist

- [x] All API routes implemented and tested
- [x] Database migrations applied
- [x] Storage buckets configured with RLS
- [x] Tier-based access control working
- [x] Quota enforcement active
- [x] Caching system operational
- [x] Provider fallback logic implemented
- [x] Error handling comprehensive
- [x] Logging in place
- [x] Integration tests passing
- [ ] Load testing completed
- [ ] Monitoring dashboards configured
- [ ] Backup strategy defined

---

## Support

For issues or feature requests, contact the engineering team or create an issue in the repository.
