# Talkie Clone - Parallel Agent Prompts
## Session 1: UI Facelift Foundation

**Date:** December 22, 2024  
**Objective:** Build the visual foundation for Talkie-style experience

---

## ⚙️ Turbo Workflows Available

All agents can use these slash commands for automatic execution:

| Command | Description |
|---------|-------------|
| `/verify` | Run TypeScript check + lint |
| `/commit-deploy` | Auto-commit, push, and deploy |
| `/regen-types` | Regenerate Supabase types |
| `/dev` | Start development server |

**Tell each agent:** "When you complete your tasks, run `/verify` then `/commit-deploy`"

---

## 🔵 Agent #1: Database & Schema Manager

Copy this entire prompt into a new Antigravity session:

```
Role: You are a Senior Backend Architect specializing in Supabase and PostgreSQL.

Objective: Extend the Remrin database schema to support Talkie-style features: character profiles, discovery feeds, and social engagement.

Context: You are working on the Remrin ChatbotUI project located at /home/gr4y/Data68/remrin/chat. This is a Next.js application using Supabase as the backend. We are adding Talkie-AI style features on top of the existing functionality WITHOUT breaking any existing features.

Your Tasks:
1. Create a migration file `20241222_add_discovery_features.sql` in `/home/gr4y/Data68/remrin/chat/supabase/migrations/`

2. Add a `persona_stats` table with columns:
   - persona_id (UUID, FK to personas, PRIMARY KEY)
   - total_chats (INTEGER, DEFAULT 0)
   - total_messages (INTEGER, DEFAULT 0)
   - followers_count (INTEGER, DEFAULT 0)
   - trending_score (FLOAT, DEFAULT 0)
   - last_chat_at (TIMESTAMPTZ)
   - updated_at (TIMESTAMPTZ, DEFAULT NOW())

3. Add a `character_follows` table with columns:
   - persona_id (UUID, FK to personas)
   - user_id (UUID, FK to auth.users)
   - followed_at (TIMESTAMPTZ, DEFAULT NOW())
   - PRIMARY KEY (persona_id, user_id)

4. Create indexes for efficient discovery queries:
   - Index on personas(category) 
   - Index on personas(is_featured)
   - Index on persona_stats(trending_score DESC)
   - Index on persona_stats(followers_count DESC)

5. Add RLS policies:
   - Public read access to persona_stats for visible personas
   - Users can manage their own follows
   - Increment triggers for follower counts

6. After creating the migration, run: npx supabase gen types typescript --local > supabase/types.ts

Constraints:
- Do NOT modify any existing columns that could break current functionality
- All changes should be ADDITIVE only
- Include proper ON DELETE CASCADE for foreign keys
- Add appropriate comments on new tables/columns

When done: Report back with:
- The file path of the migration created
- Confirmation that types were regenerated
- Any RLS policies added
```

---

## 🟢 Agent #2: Profile Page Frontend

Copy this entire prompt into a new Antigravity session:

```
Role: You are a Senior Frontend Engineer specializing in React, Next.js 14, and Tailwind CSS.

Objective: Build the Character Profile Page - the "emotional hook" that showcases Souls with Talkie-style aesthetics.

Context: You are working on the Remrin ChatbotUI project at /home/gr4y/Data68/remrin/chat. This is a Next.js 14 app with App Router, using Tailwind CSS. We're adding Talkie-AI style features. The personas table already has: id, name, description, image_url, system_prompt, visibility, category, tags, intro_message, is_featured.

Your Tasks:

1. Create directory: /home/gr4y/Data68/remrin/chat/components/profile/

2. Build CharacterProfilePage.tsx:
   - Full-page layout with large hero image as blurred background
   - Overlay with character details panel
   - Props: characterId (string)

3. Build CharacterHeader.tsx:
   - Large circular avatar (128px)
   - Character name (large, bold)
   - Tagline/description below name
   - Stats row: "💬 12.5K chats" | "❤️ 847 followers"
   - Category badge
   - Creator attribution if available

4. Build FollowButton.tsx:
   - Heart icon + "Follow" / "Following" state
   - Animated heart fill on follow
   - Uses Supabase client to toggle follow

5. Build SoulCardDisplay.tsx:
   - Visual card with character portrait
   - Shows tags as colored pills
   - Hover effect with scale

6. Create the route page at:
   /home/gr4y/Data68/remrin/chat/app/[locale]/character/[characterId]/page.tsx
   - Server component that fetches persona data
   - Renders CharacterProfilePage with data
   - Includes "Start Chat" button linking to /chat/[characterId]

Design Specifications:
- Background: #0d1117 (dark)
- Card backgrounds: rgba(255,255,255,0.05) with backdrop-blur-xl
- Accent gradient: from-purple-600 to-cyan-500
- Border radius: rounded-2xl for major cards
- Shadows: shadow-2xl with colored glow on buttons

Constraints:
- Use existing UI components from /chat/components/ui/ (Button, etc.)
- Import Supabase client from /chat/lib/supabase/client
- Make it mobile-responsive
- This is READ-ONLY display (no edit functionality here)

When done: Report back with:
- List of all files created
- Confirmation that the route is accessible
- Any dependencies that need to be installed
```

---

## 🟡 Agent #3: Chat UI Enhancement

Copy this entire prompt into a new Antigravity session:

```
Role: You are a Senior UX/UI Engineer specializing in conversational interfaces and micro-interactions.

Objective: Enhance the existing chat message component with Talkie-style aesthetics while preserving ALL existing functionality.

Context: You are working on Remrin ChatbotUI at /home/gr4y/Data68/remrin/chat. The main message component is at /chat/components/messages/message.tsx. We need to add Talkie-style visual enhancements WITHOUT breaking any existing features like editing, copying, regenerating, or file attachments.

Your Tasks:

1. View the existing /chat/components/messages/message.tsx to understand current implementation

2. Modify message.tsx to add:
   - Character avatar display next to AI messages ONLY when chatting with a Persona
   - Check if the chat has an associated persona_id to conditionally show avatar
   - Add optional glassmorphism styling with tailwind classes
   - Add subtle fade-in animation (animate-in) for new messages

3. Create /chat/components/chat-enhanced/TypingIndicator.tsx:
   - Three dots with pulsing animation
   - "Character name is typing..." text
   - Glassmorphism background matching message style
   - Export as named export

4. Create /chat/components/chat-enhanced/SuggestedReplies.tsx:
   - Horizontal scrollable row of suggested prompts
   - Each prompt is a pill-shaped button
   - Props: suggestions (string[]), onSelect (callback)
   - Lightbulb icon on the left
   - Styled to match dark theme

5. Create /chat/components/chat-enhanced/index.ts:
   - Export all enhanced components

CSS/Animation Requirements:
- Use Tailwind's animate utilities or add custom keyframes
- Glassmorphism: bg-white/5 backdrop-blur-md border border-white/10
- Fade-in: opacity-0 animate-[fadeIn_0.3s_ease-out_forwards]
- Message bubble hover: subtle scale-[1.01] transition

Constraints:
- Do NOT remove any existing functionality from message.tsx
- Make enhanced styling CONDITIONAL - only when isPersonaChat is true
- All existing props and callbacks must continue to work
- Test that message editing still works
- Keep the code clean and well-commented

When done: Report back with:
- List of files modified and created  
- Confirmation that existing message features still work
- The conditional logic used for persona vs assistant chats
```

---

## 📋 Execution Checklist

| # | Agent | Prompt Ready | Session Started | Completed |
|---|-------|--------------|-----------------|-----------|
| 1 | Database Manager | ✅ | ⬜ | ⬜ |
| 2 | Profile Page | ✅ | ⬜ | ⬜ |
| 3 | Chat Enhancement | ✅ | ⬜ | ⬜ |

---

## 🔗 After All Agents Complete

Return to the Lead CTO Agent (this session) and report:
- Which agents completed successfully
- Any errors or blockers encountered
- Files created/modified by each

The Lead agent will then:
1. Integrate the changes
2. Test for conflicts
3. Verify TypeScript compilation
4. Prepare the next session's tasks

---

## 📁 File Reference

Key directories these agents will work in:
```
/home/gr4y/Data68/remrin/chat/
├── supabase/migrations/          # Agent #1
├── supabase/types.ts             # Agent #1 (regenerate)
├── components/profile/           # Agent #2 (NEW)
├── components/chat-enhanced/     # Agent #3 (NEW)
├── components/messages/          # Agent #3 (MODIFY)
└── app/[locale]/character/       # Agent #2 (NEW)
```
