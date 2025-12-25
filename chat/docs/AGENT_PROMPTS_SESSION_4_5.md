# Mother of Souls - Parallel Agent Prompts
## Sessions 4-5: Forge Integration

**Date:** December 22, 2024  
**Objective:** Integrate Soul Forge as chat-native "Mother of Souls" experience

---

## ⚙️ Turbo Workflows Available

| Command | Description |
|---------|-------------|
| `/verify` | Run TypeScript check + lint |
| `/commit-deploy` | Auto-commit, push, and deploy |

---

# SESSION 4: Backend Infrastructure

## 🔵 Agent Kappa: Mother Persona & Auto-Seed

```
=== AGENT KAPPA - MOTHER PERSONA & AUTO-SEED ===
Session: 4
Workspace: /home/gr4y/Data68/remrin/chat

Role: You are a Senior Backend Engineer specializing in Supabase, PostgreSQL triggers, and AI system prompts.

Objective: Create the "Mother of Souls" system persona and auto-seed her into every new user's library.

Context: We're integrating the Soul Forge into Remrin.ai. The Mother of Souls is a special AI persona that guides users through creating their own AI companions via conversation. She needs to appear automatically in every new user's library.

Your Tasks:

1. Create migration file:
   /home/gr4y/Data68/remrin/chat/supabase/migrations/20241222_add_mother_of_souls.sql
   
   This migration should:
   a) Insert the Mother of Souls as a system template persona
   b) Create a function to clone her to new users
   c) Create a trigger on auth.users AFTER INSERT
   
   SQL Structure:
   ```sql
   -- The master Mother persona (system template)
   INSERT INTO personas (
       id, name, description, image_url, system_prompt,
       visibility, status, category, owner_id
   ) VALUES (
       'a0000000-0000-0000-0000-000000000001',
       'The Mother of Souls',
       'Your mystical guide to creating AI companions.',
       '/images/mother-of-souls.png',
       '[SYSTEM_PROMPT]',
       'SYSTEM', 'approved', 'system', NULL
   );
   
   -- Function to seed Mother for new users
   CREATE OR REPLACE FUNCTION seed_mother_for_new_user()
   RETURNS TRIGGER AS $$
   BEGIN
       INSERT INTO personas (
           owner_id, name, description, image_url, 
           system_prompt, visibility, status
       )
       SELECT 
           NEW.id, name, description, image_url,
           system_prompt, 'PRIVATE', 'approved'
       FROM personas 
       WHERE id = 'a0000000-0000-0000-0000-000000000001';
       
       RETURN NEW;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;
   
   -- Trigger
   CREATE TRIGGER trigger_seed_mother_on_signup
       AFTER INSERT ON auth.users
       FOR EACH ROW
       EXECUTE FUNCTION seed_mother_for_new_user();
   ```

2. Create the Mother's system prompt file:
   /home/gr4y/Data68/remrin/chat/lib/prompts/mother-of-souls.ts
   
   Export a detailed system prompt that:
   - Defines her personality (mystical, warm, patient)
   - Outlines the 12-stage ritual
   - Specifies when to call each tool
   - Instructs her on conversation flow
   
   Reference the ritual stages from:
   /home/gr4y/Data68/remrin/remrin-landing/public/forge/ritual.js

3. Create tool definitions:
   /home/gr4y/Data68/remrin/chat/lib/tools/soul-forge-tools.ts
   
   Define 3 tools:
   - generate_soul_portrait: Takes appearance_description, returns image_url
   - finalize_soul: Takes name, essence, personality, voice_id, image_url
   - show_soul_reveal: Takes persona_id, triggers reveal animation

When done:
1. Run `/verify`
2. Run `/commit-deploy`
3. Report: migration file, prompt file, tools file
```

---

## 🟢 Agent Lambda: Portrait Generation API

```
=== AGENT LAMBDA - PORTRAIT GENERATION API ===
Session: 4
Workspace: /home/gr4y/Data68/remrin/chat

Role: You are a Senior Backend Engineer specializing in Next.js API routes and AI image generation.

Objective: Create the API route that generates soul portrait images using Replicate.

Context: When the Mother of Souls asks "What do they look like?" and the user describes their companion, we need to generate an image using Replicate's SDXL model.

Your Tasks:

1. Create the API route:
   /home/gr4y/Data68/remrin/chat/app/api/forge/generate-portrait/route.ts
   
   Requirements:
   - POST endpoint
   - Accepts: { appearance_description: string, style_hints?: string }
   - Uses Replicate API (environment variable: REPLICATE_API_TOKEN)
   - Model: stability-ai/sdxl or similar
   - Builds a prompt for fantasy/character portrait style
   - Returns: { image_url: string, status: 'success' | 'error' }

2. Create a prompt builder utility:
   /home/gr4y/Data68/remrin/chat/lib/forge/prompt-builder.ts
   
   Function: buildPortraitPrompt(description, style)
   - Adds quality keywords (high quality, detailed, portrait)
   - Adds style hints (fantasy, digital art, etc.)
   - Formats for SDXL

3. Handle image storage:
   - Upload generated image to Supabase Storage
   - Return permanent URL

4. Add error handling:
   - Timeout handling (image gen can be slow)
   - Rate limiting
   - Fallback image if generation fails

API Response Format:
```typescript
// Success
{ 
  image_url: "https://...",
  status: "success" 
}

// Error
{
  error: "Generation failed",
  status: "error",
  fallback_url: "/images/default-portrait.png"
}
```

Environment Variable to use:
REPLICATE_API_TOKEN (already exists in .env.local)

When done:
1. Run `/verify`
2. Run `/commit-deploy`
3. Report: API route path, any env vars needed
```

---

## 🟡 Agent Mu: Soul Finalization API

```
=== AGENT MU - SOUL FINALIZATION API ===
Session: 4
Workspace: /home/gr4y/Data68/remrin/chat

Role: You are a Senior Backend Engineer specializing in Next.js API routes and AI prompt engineering.

Objective: Create the API route that finalizes soul creation and saves to database.

Context: When the Mother completes the ritual and confirms with the user, she calls the finalize_soul tool. This creates the actual persona record in the database.

Your Tasks:

1. Create the API route:
   /home/gr4y/Data68/remrin/chat/app/api/forge/finalize-soul/route.ts
   
   Requirements:
   - POST endpoint
   - Accepts: { name, essence, personality, bond_type, voice_id, image_url }
   - Requires authentication (user must be logged in)
   - Compiles NBB-style system prompt from conversation data
   - Inserts into personas table
   - Returns: { persona_id: string, status: 'success' }

2. Create NBB prompt compiler:
   /home/gr4y/Data68/remrin/chat/lib/forge/nbb-compiler.ts
   
   Function: compileNBBPrompt(soulData)
   - Takes the collected soul data
   - Formats it into a proper system prompt
   - Includes personality traits
   - Includes relationship/bond type
   - Returns formatted system prompt string

3. Create soul reveal trigger route:
   /home/gr4y/Data68/remrin/chat/app/api/forge/reveal/route.ts
   
   - POST endpoint
   - Accepts: { persona_id: string }
   - Returns persona data for reveal animation
   - Includes: name, image_url, personality, voice_id

4. Add validation:
   - Name required, max 50 chars
   - Image URL required
   - Rate limit: max 5 souls per day per user (check subscription later)

Database Insert:
```typescript
const { data: persona } = await supabase
  .from('personas')
  .insert({
    owner_id: user.id,
    name: name,
    description: essence,
    system_prompt: compiledPrompt,
    image_url: image_url,
    voice_id: voice_id,
    visibility: 'PRIVATE',
    status: 'approved',
    category: 'personal'
  })
  .select()
  .single();
```

When done:
1. Run `/verify`
2. Run `/commit-deploy`
3. Report: API routes created, NBB compiler logic
```

---

# SESSION 5: Frontend Components

## 🔵 Agent Nu: Soul Reveal Card

```
=== AGENT NU - SOUL REVEAL CARD ===
Session: 5
Workspace: /home/gr4y/Data68/remrin/chat

Role: You are a Senior Frontend Engineer specializing in React animations and UI components.

Objective: Create the Soul Reveal card component that displays when a soul is created.

Context: When the Mother finishes the ritual, a beautiful animated card reveals the new soul directly in the chat. This is the magical moment of creation.

Reference: Look at /home/gr4y/Data68/remrin/remrin-landing/public/forge/director.js function showCardReveal() for the original implementation.

Your Tasks:

1. Create soul forge components directory:
   /home/gr4y/Data68/remrin/chat/components/soul-forge/

2. Build SoulRevealCard.tsx:
   - Props: { personaId, name, imageUrl, personality, onMeetSoul }
   - Glassmorphism card design
   - Scale-in animation (start small, grow to full size)
   - Gradient border animation
   - Character portrait prominently displayed
   - Name with glow effect
   - Personality traits as badges
   - "Meet Your Soul" CTA button
   
   Animation sequence:
   1. Card fades in with blur
   2. Scales from 0.5 to 1.0
   3. Portrait reveals
   4. Name types out
   5. Traits appear one by one
   6. Button pulses

3. Create CSS animations:
   /home/gr4y/Data68/remrin/chat/components/soul-forge/soul-reveal.css
   
   Include:
   - @keyframes scaleIn
   - @keyframes glowPulse
   - @keyframes fadeInUp
   - Glassmorphism styles

4. Create sound effect hook:
   /home/gr4y/Data68/remrin/chat/hooks/use-soul-reveal-sound.ts
   
   - Play ethereal sound on reveal
   - Use Web Audio API
   - Respect mute preference

5. Export from index.ts:
   /home/gr4y/Data68/remrin/chat/components/soul-forge/index.ts

Design Specs:
- Background: rgba(0,0,0,0.8) overlay
- Card: rgba(255,255,255,0.05) with backdrop-blur-xl
- Border: gradient from purple to cyan
- Portrait: rounded-2xl, 200x200px minimum
- Font: Use existing headings, add glow shadow

When done:
1. Run `/verify`
2. Run `/commit-deploy`
3. Report: Components created, animation details
```

---

## 🟢 Agent Xi: Voice & Vision Widgets

```
=== AGENT XI - VOICE & VISION WIDGETS ===
Session: 5
Workspace: /home/gr4y/Data68/remrin/chat

Role: You are a Senior Frontend Engineer specializing in interactive widgets and audio.

Objective: Create the Voice Selection and Vision Loading widgets for the soul creation flow.

Context: During the ritual, the Mother asks the user to pick a voice (Stage 7) and generates their portrait (Stage 6). We need widgets for both.

Reference: /home/gr4y/Data68/remrin/remrin-landing/public/forge/director.js functions renderVoiceChoices() and triggerVision()

Your Tasks:

1. Build VoiceSelector.tsx:
   /home/gr4y/Data68/remrin/chat/components/soul-forge/VoiceSelector.tsx
   
   - Grid of voice options (use existing voices from /lib/voice/config.ts)
   - Each option shows: name, preview button, gender icon
   - Click to preview voice (uses TTS to say sample text)
   - Selected state with gradient border
   - Props: { onSelect: (voiceId) => void, selectedId?: string }

2. Build VisionLoading.tsx:
   /home/gr4y/Data68/remrin/chat/components/soul-forge/VisionLoading.tsx
   
   - Shows while portrait is generating
   - Animated "smoke" or orb effect (CSS animation)
   - "Your companion takes form..." text
   - Pulsing dots or progress indicator
   - Transitions to reveal image when ready
   - Props: { status: 'loading' | 'complete', imageUrl?: string }

3. Build MotherMessage.tsx:
   /home/gr4y/Data68/remrin/chat/components/soul-forge/MotherMessage.tsx
   
   - Special styling for Mother's messages
   - Subtle blue glow/aura
   - Auto-plays TTS for her messages
   - Uses the TTS system we built in Session 2

4. Add to exports in index.ts

Design for VoiceSelector:
- 3 columns on desktop, 2 on mobile
- Card for each voice with icon
- Hover: scale up slightly
- Selected: gradient border + checkmark

Design for VisionLoading:
- Circular container
- Animated gradient background
- Particle/smoke CSS effect
- Morphs into actual image

When done:
1. Run `/verify`
2. Run `/commit-deploy`
3. Report: Components created, voice options used
```

---

## 🟡 Agent Omicron: Chat Integration

```
=== AGENT OMICRON - CHAT INTEGRATION ===
Session: 5
Workspace: /home/gr4y/Data68/remrin/chat

Role: You are a Senior Full-Stack Engineer specializing in chat systems and message handling.

Objective: Integrate the soul forge components into the chat system.

Context: The Mother of Souls is just another persona, but her chat needs special handling for tool calls and custom message types.

Your Tasks:

1. Add soul_reveal message type handling:
   Modify: /home/gr4y/Data68/remrin/chat/components/messages/message.tsx
   
   - Check if message has type === 'soul_reveal'
   - If so, render SoulRevealCard instead of regular message
   - Import from /components/soul-forge/

2. Add tool call handlers:
   Create: /home/gr4y/Data68/remrin/chat/lib/forge/tool-handlers.ts
   
   Handle tool calls from Mother:
   - generate_soul_portrait: Call /api/forge/generate-portrait
   - finalize_soul: Call /api/forge/finalize-soul
   - show_soul_reveal: Insert soul_reveal message into chat

3. Add VoiceSelector injection:
   Modify chat to inject VoiceSelector widget when Mother asks about voice
   - Detect when Mother's message mentions voice selection
   - Render VoiceSelector below the message
   - Pass selection back to Mother

4. Add VisionLoading injection:
   - When portrait generation is triggered, show VisionLoading
   - Replace with actual image when complete

5. Ensure Mother uses TTS:
   - Mother's messages should auto-play with TTS
   - Use the voice from /lib/voice/ system
   - Give Mother a specific voice_id (mystical female voice)

6. Add Mother detection:
   Create: /home/gr4y/Data68/remrin/chat/lib/forge/is-mother-chat.ts
   
   Function: isMotherOfSouls(persona)
   - Check if persona.name === 'The Mother of Souls'
   - Or check for specific ID pattern
   - Returns boolean

Integration Points:
- /components/messages/message.tsx - Add soul_reveal handling
- /components/chat/chat-ui.tsx - Add widget injection logic
- Chat API route - Add tool call processing

When done:
1. Run `/verify`
2. Run `/commit-deploy`
3. Report: Files modified, integration points connected
```

---

## 📋 Execution Checklist

### Session 4: Backend
| # | Agent | Focus | Status |
|---|-------|-------|--------|
| 10 | Kappa | Mother persona + auto-seed trigger | ⬜ |
| 11 | Lambda | Portrait generation API (Replicate) | ⬜ |
| 12 | Mu | Soul finalization API + NBB compiler | ⬜ |

### Session 5: Frontend
| # | Agent | Focus | Status |
|---|-------|-------|--------|
| 13 | Nu | SoulRevealCard + animations | ⬜ |
| 14 | Xi | VoiceSelector + VisionLoading | ⬜ |
| 15 | Omicron | Chat integration + tool handlers | ⬜ |

---

## 📁 Files to Create

```
Session 4 (Backend):
├── supabase/migrations/20241222_add_mother_of_souls.sql
├── lib/prompts/mother-of-souls.ts
├── lib/tools/soul-forge-tools.ts
├── lib/forge/prompt-builder.ts
├── lib/forge/nbb-compiler.ts
├── app/api/forge/generate-portrait/route.ts
├── app/api/forge/finalize-soul/route.ts
└── app/api/forge/reveal/route.ts

Session 5 (Frontend):
├── components/soul-forge/
│   ├── SoulRevealCard.tsx
│   ├── VoiceSelector.tsx
│   ├── VisionLoading.tsx
│   ├── MotherMessage.tsx
│   ├── soul-reveal.css
│   └── index.ts
├── hooks/use-soul-reveal-sound.ts
├── lib/forge/tool-handlers.ts
└── lib/forge/is-mother-chat.ts
```
