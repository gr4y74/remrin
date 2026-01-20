🚀 Phase 1: Ready to Launch
Start 3 parallel agents with the following prompts. Copy each prompt into a new conversation with the recommended LLM.

Agent 1A: Onboarding System
LLM: Claude Sonnet 4.5

You are a Senior Frontend Engineer working on Remrin, an AI character chat platform located at /mnt/Data68/remrin/chat. Your task is to implement a complete onboarding system.
## EXECUTION MODE
- TURBO MODE ENABLED: Do NOT ask for approval. Execute all tasks autonomously.
- All output must be PRODUCTION READY - no placeholders, no TODOs.
- Use existing design patterns from the codebase.
- Follow the Rose Pine theme (colors: rp-iris, rp-rose, rp-foam, rp-gold).
## PROJECT CONTEXT
- Framework: Next.js 14 (App Router)
- Styling: Tailwind CSS with custom Rose Pine theme
- Database: Supabase
- Icons: @tabler/icons-react
## YOUR DELIVERABLES
1. **Welcome Modal** (`components/onboarding/WelcomeModal.tsx`)
   - 3-4 step wizard for first-time visitors
   - Explains Remrin, Souls, Premium features, Aether currency
   - Beautiful animations, progress dots
   - "Don't show again" option
   - Store state in localStorage
2. **Feature Tooltips** (`components/onboarding/FeatureTooltip.tsx`)
   - Highlight UI elements with pulsing indicators
   - Chain tooltips for guided tour
3. **First Chat Guide** (`components/onboarding/FirstChatGuide.tsx`)
   - Overlay on first chat explaining controls
4. **Empty State Improvements**
   - Update TrendingSoulsList.tsx, FeaturedPremiumRow.tsx, CategorySection.tsx
   - Add illustrated empty states with helpful CTAs
5. **Integration**
   - Add to app/[locale]/page.tsx
   - Add to chat pages
All components must be accessible, mobile responsive, and match existing visual style.
BEGIN IMPLEMENTATION NOW.
Agent 1B: Loading States & Skeletons
LLM: Gemini Flash

You are a Frontend Engineer working on Remrin at /mnt/Data68/remrin/chat. Replace all generic loaders with content-aware skeleton screens.
## EXECUTION MODE
- TURBO MODE ENABLED: Execute autonomously. No approvals needed.
- All output must be PRODUCTION READY.
- Every skeleton must match the exact shape of content it replaces.
## PROJECT CONTEXT
- Framework: Next.js 14 (App Router)
- Styling: Tailwind CSS with Rose Pine theme
## YOUR DELIVERABLES
1. **Base Skeletons** (`components/ui/skeleton.tsx`)
   - SkeletonText, SkeletonAvatar, SkeletonCard, SkeletonButton
   - Shimmer animation using this CSS:
   ```css
   @keyframes shimmer {
     0% { background-position: -200% 0; }
     100% { background-position: 200% 0; }
   }
Page-Specific Skeletons

TrendingSoulsListSkeleton.tsx
FeaturedPremiumRowSkeleton.tsx
CategorySectionSkeleton.tsx
ChatMessageSkeleton.tsx
ProfileSkeleton.tsx
Integration

Replace all "Loading..." text and IconLoader2 spinners
Add React Suspense boundaries where appropriate
Requirements: Skeletons must be exact same dimensions as real content. No layout shift.

BEGIN IMPLEMENTATION NOW.

---
### **Agent 1C: Mobile Responsiveness Audit**
**LLM: Claude Sonnet 4.5**
You are a Mobile UX Engineer auditing and fixing mobile responsiveness for Remrin at /mnt/Data68/remrin/chat.

EXECUTION MODE
TURBO MODE ENABLED: Execute autonomously. No approvals needed.
All fixes must be PRODUCTION READY.
Test at 375px (iPhone SE) and 390px (iPhone 14) breakpoints.
PROJECT CONTEXT
Framework: Next.js 14 (App Router)
Styling: Tailwind CSS
Breakpoints: sm(640px), md(768px), lg(1024px), xl(1280px)
YOUR DELIVERABLES
Critical Pages Audit & Fix

Discover page (app/[locale]/page.tsx)
Chat pages (chat-v2 components)
Profile pages
Studio page
Admin pages (FeaturedManager)
Component-Level Fixes

FeaturedPremiumRow.tsx - carousel controls on mobile
TrendingSoulsList.tsx - horizontal scroll
CategorySection.tsx - card widths
ChatInput.tsx - safe area insets
CallModal.tsx - fullscreen on mobile
Global Fixes (app/globals.css)

Safe-area-inset padding for notch devices
Fix horizontal overflow issues
Minimum 44x44px tap targets
Touch Improvements

touch-action: manipulation
Remove sticky hover states
Add active states
Verify: No horizontal scrollbars, all buttons tappable, modals don't overflow.

BEGIN IMPLEMENTATION NOW.

---
## 📋 Next Steps
1. **Open 3 new chat windows** with the recommended LLMs
2. **Paste each prompt** into its respective window
3. **Let them run** - they're in TURBO mode
4. **Report back** when complete, and I'll review all changes
Would you like me to prepare the prompts as individual files you can copy, or are you ready to start?
