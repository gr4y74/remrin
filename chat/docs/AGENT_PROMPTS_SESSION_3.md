# Talkie Clone - Parallel Agent Prompts
## Session 3: Moments, Polish & Final Integration

**Date:** December 22, 2024  
**Objective:** Build the Moments gallery, polish existing components, and finalize integration

---

## ⚙️ Turbo Workflows Available

| Command | Description |
|---------|-------------|
| `/verify` | Run TypeScript check + lint |
| `/commit-deploy` | Auto-commit, push, and deploy |

**Reminder:** When complete, run `/verify` then `/commit-deploy`

---

## 🔵 Agent Eta: Moments Gallery

Copy this entire prompt into a new Antigravity session:

```
=== AGENT ETA - MOMENTS GALLERY ===
Session: 3
Workspace: /home/gr4y/Data68/remrin/chat

Role: You are a Senior Frontend Engineer specializing in React, image galleries, and social media-style content displays.

Objective: Build the Moments system - a Pinterest/Instagram-style gallery where characters share "moments" (images with captions) that users can interact with.

Context: You are working on the Remrin Remrin.ai project at /home/gr4y/Data68/remrin/chat. The database already has the personas table. We need to add a moments system.

Your Tasks:

1. Create database migration:
   /home/gr4y/Data68/remrin/chat/supabase/migrations/20241222_add_moments.sql
   
   Tables needed:
   - moments (id, persona_id FK, image_url, caption, created_at, likes_count, is_pinned)
   - moment_likes (moment_id FK, user_id, created_at, PRIMARY KEY on both)
   - Add triggers for likes_count increment/decrement

2. Create components directory:
   /home/gr4y/Data68/remrin/chat/components/moments/

3. Build MomentCard.tsx:
   - Card showing moment image with glassmorphism overlay
   - Caption text at bottom
   - Like button with heart icon (filled when liked)
   - Persona avatar + name in corner
   - Hover: reveal full caption and actions

4. Build MomentsGallery.tsx:
   - Masonry-style grid layout (varied heights)
   - Infinite scroll or "Load More"
   - Filter by persona or show all
   - Props: { personaId?: string } (optional filter)

5. Build MomentModal.tsx:
   - Full-screen modal when clicking a moment
   - Large image display
   - Full caption
   - Like button, share button
   - "View Character" link to profile
   - Navigation arrows for prev/next

6. Create route:
   /home/gr4y/Data68/remrin/chat/app/[locale]/moments/page.tsx
   - Grid view of all moments
   - Can filter by character

7. Add moments section to Character Profile:
   - Modify /components/profile/CharacterProfilePage.tsx
   - Add "Moments" tab or section
   - Show that character's moments

Design:
- Match existing dark theme (#0d1117)
- Glassmorphism on hover
- Smooth animations (scale, fade)
- Heart icon: empty outline → filled red on like

When done:
1. Run `/verify`
2. Run `/commit-deploy`
3. Report: files created, migration SQL
```

---

## 🟢 Agent Theta: UI Polish & Animations

Copy this entire prompt into a new Antigravity session:

```
=== AGENT THETA - UI POLISH ===
Session: 3
Workspace: /home/gr4y/Data68/remrin/chat

Role: You are a Senior UI/UX Engineer specializing in micro-interactions, animations, and visual polish.

Objective: Add polish and animations across the new Talkie-style components to make the experience feel premium and alive.

Context: Sessions 1-2 built functional components. Now we need to add the finishing touches that make the UI feel premium. Focus on smooth transitions, hover effects, and delightful micro-interactions.

Your Tasks:

1. Enhance DiscoveryFeed animations:
   - File: /home/gr4y/Data68/remrin/chat/components/discovery/DiscoveryFeed.tsx
   - Add staggered fade-in animation when cards load
   - Add skeleton pulse animation improvement
   - Smooth category tab transitions

2. Enhance CharacterCard hover effects:
   - File: /home/gr4y/Data68/remrin/chat/components/discovery/CharacterCard.tsx
   - Add 3D tilt effect on hover (subtle parallax)
   - Add glowing border on hover matching category color
   - Add image zoom effect (scale 1.05) on hover
   - Smooth shadow transitions

3. Enhance CharacterProfilePage:
   - File: /home/gr4y/Data68/remrin/chat/components/profile/CharacterProfilePage.tsx
   - Add hero image parallax scroll effect
   - Add fade-in animations for content sections
   - Add floating effect on the "Start Chat" button

4. Enhance FollowButton:
   - File: /home/gr4y/Data68/remrin/chat/components/profile/FollowButton.tsx
   - Add heart burst animation on follow
   - Add confetti-like particles (subtle)
   - Smooth state transitions

5. Add global animation utilities:
   Create: /home/gr4y/Data68/remrin/chat/lib/animations.ts
   - fadeIn, fadeInUp, fadeInScale keyframes
   - staggerChildren utility
   - parallax scroll hook

6. Create CSS animations file:
   Create: /home/gr4y/Data68/remrin/chat/app/globals-animations.css
   - @keyframes for common animations
   - Utility classes: .animate-fade-in, .animate-scale-in, etc.
   - Import this in the main globals.css or layout

Animation Guidelines:
- Duration: 200-400ms for micro-interactions
- Easing: ease-out for entrances, ease-in-out for state changes
- Use transform and opacity (GPU accelerated)
- Respect prefers-reduced-motion

When done:
1. Run `/verify`
2. Run `/commit-deploy`
3. Report: files modified, animations added
```

---

## 🟡 Agent Iota: Final Integration & Cleanup

Copy this entire prompt into a new Antigravity session:

```
=== AGENT IOTA - FINAL INTEGRATION ===
Session: 3
Workspace: /home/gr4y/Data68/remrin/chat

Role: You are a Senior Full-Stack Engineer specializing in code quality, integration, and developer experience.

Objective: Final integration pass - ensure all Session 1-3 components work together seamlessly, fix any remaining issues, and add navigation improvements.

Context: Three sessions of parallel development have added many features. We need to ensure everything is properly connected and working.

Your Tasks:

1. Add Discover and Moments links to main navigation:
   - Find the main sidebar: /home/gr4y/Data68/remrin/chat/components/sidebar/
   - Add "Discover" link with compass/explore icon
   - Add "Moments" link with image/gallery icon
   - Position near top, make them prominent

2. Add character profile link from chat:
   - When chatting with a persona, show a header with character info
   - Include link to their full profile page
   - Show follow button in chat header

3. Connect voice playback to messages:
   - Find: /home/gr4y/Data68/remrin/chat/components/messages/message.tsx
   - Import MessageVoiceBadge from /components/voice/
   - Add voice badge to AI messages when chatting with a persona
   - Only show if persona has voice_id set

4. Ensure TypingIndicator is integrated:
   - Check if it's properly wired into the chat UI
   - Should appear when AI is generating response
   - Should disappear when response complete

5. Add loading states and error boundaries:
   - Wrap major new components with error boundaries
   - Add proper loading states for async components
   - Ensure graceful degradation

6. Create a feature flags config (for future):
   Create: /home/gr4y/Data68/remrin/chat/lib/features.ts
   ```typescript
   export const FEATURES = {
     VOICE_ENABLED: true,
     MOMENTS_ENABLED: true,
     DISCOVERY_ENABLED: true,
     FOLLOW_ENABLED: true,
   }
   ```

7. Final TypeScript check:
   - Run `npx tsc --noEmit`
   - Fix any remaining type errors
   - Ensure no unused imports

8. Update any broken imports:
   - Check all new component imports are correct
   - Fix any path issues

When done:
1. Run `/verify`
2. Run `/commit-deploy`
3. Report:
   - Navigation links added (with locations)
   - Integrations connected
   - Any issues found and fixed
```

---

## 📋 Execution Checklist

| # | Agent | Codename | Focus | Status |
|---|-------|----------|-------|--------|
| 7 | Eta | Moments Gallery | `/moments` page + components | ⬜ Pending |
| 8 | Theta | UI Polish | Animations & micro-interactions | ⬜ Pending |
| 9 | Iota | Final Integration | Navigation, cleanup, connections | ⬜ Pending |

---

## 📁 File Reference

```
Session 3 will create/modify:
├── supabase/migrations/20241222_add_moments.sql  # Eta
├── components/moments/                            # Eta
│   ├── MomentCard.tsx
│   ├── MomentsGallery.tsx
│   ├── MomentModal.tsx
│   └── index.ts
├── app/[locale]/moments/page.tsx                  # Eta
├── lib/animations.ts                              # Theta
├── app/globals-animations.css                     # Theta
├── lib/features.ts                                # Iota
├── components/sidebar/ (modify)                   # Iota
├── components/messages/ (modify)                  # Iota
└── components/discovery/ (polish)                 # Theta
```

---

## 🌙 Final Session Notes

This is the final session for tonight. After this:
1. All core Talkie features will be implemented
2. The UI will have polish and animations
3. Everything will be integrated and connected

Tomorrow can focus on:
- Testing edge cases
- Performance optimization
- Production deployment
- Additional features (Gacha, advanced voice, etc.)
