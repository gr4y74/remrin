# Talkie Clone - Parallel Agent Prompts
## Session 2: Discovery & Voice Integration

**Date:** December 22, 2024  
**Objective:** Build the Discovery Feed, add Voice TTS playback, and integrate Session 1 components

---

## ⚙️ Turbo Workflows Available

All agents can use these slash commands:

| Command | Description |
|---------|-------------|
| `/verify` | Run TypeScript check + lint |
| `/commit-deploy` | Auto-commit, push, and deploy |
| `/regen-types` | Regenerate Supabase types |
| `/dev` | Start development server |

**Tell each agent:** "When you complete your tasks, run `/verify` then `/commit-deploy`"

---

## 🔵 Agent Delta: Discovery Feed Page

Copy this entire prompt into a new Antigravity session:

```
=== AGENT DELTA - DISCOVERY FEED ===
Session: 2
Workspace: /home/gr4y/Data68/remrin/chat

Role: You are a Senior Frontend Engineer specializing in React, Next.js 14, and Tailwind CSS with expertise in infinite scroll and grid layouts.

Objective: Build the Discovery Feed page - a Talkie-style character browse experience with category tabs, character cards, and trending sections.

Context: You are working on the Remrin Remrin.ai project at /home/gr4y/Data68/remrin/chat. Session 1 already created:
- `/components/profile/CharacterCard.tsx` (if exists, reuse it; if not, create it)
- Database tables: `personas` (with category, tags, is_featured, status columns), `persona_stats`, `categories`

Your Tasks:

1. Create directory: /home/gr4y/Data68/remrin/chat/components/discovery/

2. Build DiscoveryFeed.tsx:
   - Main container component
   - Fetches paginated personas from Supabase
   - Filters by category, shows only status='approved'
   - Infinite scroll or "Load More" pattern
   - Grid layout: 3 columns on desktop, 2 on tablet, 1 on mobile

3. Build CategoryTabs.tsx:
   - Horizontal scrollable tabs
   - Fetches categories from `categories` table
   - Each tab shows icon + name (e.g., "🌟 General", "💕 Romance")
   - Active tab highlighted with gradient underline
   - "All" tab as default

4. Build TrendingCarousel.tsx:
   - Horizontal scrollable row of featured personas
   - Filters: is_featured=true OR high trending_score
   - Larger cards than regular grid
   - Smooth scroll with arrow buttons

5. Build CharacterCard.tsx (if not exists in /components/profile/):
   - Vertical card with large portrait image
   - Character name overlay at bottom
   - Stats badge: "💬 1.2K" (from persona_stats)
   - Category pill badge
   - Hover: scale up + glow effect
   - Click: navigates to /character/[id]

6. Create the route page:
   /home/gr4y/Data68/remrin/chat/app/[locale]/discover/page.tsx
   - Server component wrapper
   - Renders DiscoveryFeed with initial data
   - Meta tags for SEO

7. Create index.ts export file for all discovery components

Design Specifications:
- Background: #0d1117 (dark)
- Card backgrounds: rgba(255,255,255,0.05) with subtle border
- Category colors: Use color from categories table
- Grid gap: 1rem (16px)
- Card aspect ratio: 3:4 (portrait)
- Hover animation: scale(1.03), shadow-xl with colored glow

Supabase Query Pattern:
```typescript
const { data } = await supabase
  .from('personas')
  .select(`
    *,
    persona_stats(total_chats, followers_count, trending_score)
  `)
  .eq('status', 'approved')
  .eq('visibility', 'PUBLIC')
  .order('created_at', { ascending: false })
  .range(offset, offset + limit - 1)
```

Constraints:
- Use existing UI components from /components/ui/
- Make it fully responsive
- Add loading skeletons while fetching
- Handle empty states gracefully

When done: 
1. Run `/verify` to check TypeScript
2. Run `/commit-deploy` to commit your work
3. Report back with list of files created
```

---

## 🟢 Agent Epsilon: Voice TTS API

Copy this entire prompt into a new Antigravity session:

```
=== AGENT EPSILON - VOICE TTS API ===
Session: 2
Workspace: /home/gr4y/Data68/remrin/chat

Role: You are a Senior Backend Engineer specializing in Next.js API routes, audio processing, and third-party API integrations.

Objective: Build the Text-to-Speech API infrastructure for voice playback on chat messages.

Context: You are working on the Remrin Remrin.ai project at /home/gr4y/Data68/remrin/chat. We need to add voice capabilities so AI messages can be played back as audio, similar to Talkie-AI.

Your Tasks:

1. Create the TTS API route:
   /home/gr4y/Data68/remrin/chat/app/api/voice/tts/route.ts
   
   - POST endpoint that accepts: { text: string, voiceId?: string }
   - Uses Web Speech API synthesis OR a free TTS service
   - Returns audio as base64 or stream URL
   - Caches generated audio to avoid re-synthesis
   - Rate limiting to prevent abuse

2. Create a voice config file:
   /home/gr4y/Data68/remrin/chat/lib/voice/config.ts
   
   - Define available voices (at minimum: 3 male, 3 female options)
   - Voice settings: pitch, rate, language
   - Provider configuration (can be extended for ElevenLabs later)

3. Create voice utility functions:
   /home/gr4y/Data68/remrin/chat/lib/voice/tts.ts
   
   - `synthesizeSpeech(text: string, voiceId?: string): Promise<string>` - returns audio URL
   - `getAvailableVoices(): Voice[]` - lists available voices
   - `estimateDuration(text: string): number` - estimates audio duration in seconds

4. Create the MessageVoiceBadge component:
   /home/gr4y/Data68/remrin/chat/components/voice/MessageVoiceBadge.tsx
   
   - Small badge that appears on AI messages
   - Shows play/pause button + duration
   - Audio visualization (simple waveform or bars)
   - Uses HTML5 Audio element for playback
   - Props: { text: string, voiceId?: string }

5. Create VoicePlayer component:
   /home/gr4y/Data68/remrin/chat/components/voice/VoicePlayer.tsx
   
   - Reusable audio player component
   - Play/Pause toggle
   - Progress bar with seek capability
   - Duration display (current / total)
   - Loading state while fetching audio

6. Create index.ts exports for voice components and utilities

API Response Format:
```typescript
// POST /api/voice/tts
// Request: { text: string, voiceId?: string }
// Response: { audioUrl: string, duration: number, cached: boolean }
```

Initial Implementation (Free Tier):
- Use browser's Web Speech API (SpeechSynthesis) for client-side TTS
- Alternatively, use a free API like:
  - Google Cloud TTS (free tier: 1M chars/month)
  - Azure Speech (free tier: 500K chars/month)
- Store voice_id in personas table (already exists)

Constraints:
- Make the TTS provider swappable (design for future ElevenLabs integration)
- Handle errors gracefully (fallback to no audio)
- Keep audio files small (use efficient codecs)
- Add proper TypeScript types

When done:
1. Run `/verify` to check TypeScript
2. Run `/commit-deploy` to commit your work
3. Report back with list of files created and which TTS approach you used
```

---

## 🟡 Agent Zeta: Component Integration

Copy this entire prompt into a new Antigravity session:

```
=== AGENT ZETA - COMPONENT INTEGRATION ===
Session: 2
Workspace: /home/gr4y/Data68/remrin/chat

Role: You are a Senior Full-Stack Engineer specializing in React component architecture, state management, and UX integration.

Objective: Connect the components from Session 1 into the existing Remrin.ai, ensuring seamless navigation and data flow.

Context: Session 1 created these components that need to be integrated:
- `/components/profile/` - CharacterProfilePage, CharacterHeader, FollowButton, SoulCardDisplay
- `/components/chat-enhanced/` - TypingIndicator, SuggestedReplies
- `/app/[locale]/character/[characterId]/page.tsx` - Character profile route

Your Tasks:

1. Add navigation to Character Profiles:
   Modify the personas sidebar item to link to character profiles:
   - Find `/components/sidebar/items/personas/` 
   - When clicking a persona, navigate to `/character/[id]` instead of directly starting chat
   - Add a "Chat" button on the profile page that starts the chat

2. Integrate TypingIndicator into chat:
   - Find the chat display component (likely in `/components/chat/`)
   - Import and render TypingIndicator when AI is generating response
   - Position it after the last message, before the input
   - Use existing loading/generating state from chat context

3. Add SuggestedReplies to chat input area:
   - Find the chat input component
   - When conversation starts or AI responds, show 3 suggested replies
   - Generate suggestions based on persona's style and recent context
   - Create a simple API route or client-side logic for suggestions
   - Clicking a suggestion fills the input and optionally sends it

4. Wire up FollowButton functionality:
   - The FollowButton component exists in `/components/profile/`
   - Ensure it correctly calls Supabase to insert/delete from `character_follows`
   - Show follower count from `persona_stats`
   - Add optimistic UI update (immediate visual feedback)

5. Create a "Discover" link in the main sidebar:
   - Add a new sidebar item that links to `/discover`
   - Use an appropriate icon (e.g., compass, explore)
   - Position it prominently (near top, after main navigation)

6. Update the homepage/landing to feature personas:
   - If there's a landing page, add a "Featured Souls" section
   - Show 3-6 featured personas with is_featured=true
   - Link to their profile pages

Files to examine first:
- `/components/sidebar/` - Main sidebar structure
- `/components/chat/chat-ui.tsx` - Main chat interface
- `/components/messages/` - Message display
- `/app/[locale]/page.tsx` - Homepage (if exists)

Constraints:
- Do NOT break any existing functionality
- Test that normal assistant chats still work
- Test that workspace/folder navigation still works
- Use existing patterns and styling conventions
- Add proper error boundaries for new components

Integration Checklist:
- [ ] Persona sidebar → Character Profile navigation
- [ ] TypingIndicator shows during AI response
- [ ] SuggestedReplies appear after AI messages
- [ ] FollowButton works with Supabase
- [ ] Discover link in sidebar
- [ ] Featured Souls on homepage

When done:
1. Run `/verify` to check TypeScript
2. Test navigation flows manually
3. Run `/commit-deploy` to commit your work
4. Report back with:
   - Files modified
   - Integration points connected
   - Any issues encountered
```

---

## 📋 Execution Checklist

| # | Agent | Codename | Focus | Status |
|---|-------|----------|-------|--------|
| 4 | Delta | Discovery Feed | `/discover` page + grid | ⬜ Pending |
| 5 | Epsilon | Voice TTS | API route + playback | ⬜ Pending |
| 6 | Zeta | Integration | Connect Session 1 work | ⬜ Pending |

---

## 🔗 After All Agents Complete

Return to the Lead CTO Agent and report:
- Which agents completed successfully
- Any errors or blockers encountered
- Files created/modified by each

---

## 📁 File Reference

```
/home/gr4y/Data68/remrin/chat/
├── app/
│   ├── api/voice/tts/           # Agent Epsilon (NEW)
│   └── [locale]/
│       ├── discover/            # Agent Delta (NEW)
│       └── character/           # Session 1 (EXISTS)
├── components/
│   ├── discovery/               # Agent Delta (NEW)
│   ├── voice/                   # Agent Epsilon (NEW)
│   ├── profile/                 # Session 1 (EXISTS)
│   ├── chat-enhanced/           # Session 1 (EXISTS)
│   ├── sidebar/                 # Agent Zeta (MODIFY)
│   ├── chat/                    # Agent Zeta (MODIFY)
│   └── messages/                # Agent Zeta (MODIFY)
├── lib/
│   └── voice/                   # Agent Epsilon (NEW)
└── docs/
    ├── AGENT_PROMPTS_SESSION_2.md  # This file
    └── AGENT_MISSION_CONTROL.md
```
