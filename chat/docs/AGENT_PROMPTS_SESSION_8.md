# Auth Overhaul - Session 8 Prompts

**Date:** December 22, 2024  
**Objective:** Improve login/signup UX, add Google OAuth, age selection

---

## ⚙️ Turbo Workflows

| Command | Description |
|---------|-------------|
| `/verify` | TypeScript check + lint |
| `/commit-deploy` | Auto-commit and push |

---

## 🔵 Agent Chi: Login/Signup Pages

```
=== AGENT CHI - LOGIN/SIGNUP PAGES ===
Session: 8
Workspace: /home/gr4y/Data68/remrin/chat

Role: Senior Frontend Engineer specializing in authentication UX.

Objective: Rebuild the login and signup pages with better UX.

Tasks:

1. Create new auth pages:
   /home/gr4y/Data68/remrin/chat/app/[locale]/login/page.tsx
   /home/gr4y/Data68/remrin/chat/app/[locale]/signup/page.tsx
   
2. Login Page Features:
   - Email input with validation
   - Password input with show/hide toggle
   - "Sign in with Google" button
   - "Forgot password?" link
   - "Don't have an account? Sign up" link
   - Toast notifications for errors
   - Loading states
   - Clear the stored email on logout

3. Signup Page Features:
   - Email input
   - Password input (with strength indicator)
   - Display name input
   - Age selection (dropdown or buttons):
     - Under 13
     - 13-17
     - 18-24
     - 25+
   - Terms checkbox
   - "Sign up with Google" button
   - Toast notification: "Check your email to verify"
   
4. Styling:
   - Dark theme matching app
   - Glassmorphism cards
   - Smooth animations
   - Mobile responsive

5. Create auth callback route:
   /home/gr4y/Data68/remrin/chat/app/auth/callback/route.ts
   - Handles OAuth redirects
   - Handles email verification redirects

When done: Run /verify then /commit-deploy
```

---

## 🟢 Agent Psi: Google OAuth Integration

```
=== AGENT PSI - GOOGLE OAUTH ===
Session: 8
Workspace: /home/gr4y/Data68/remrin/chat

Role: Senior Backend Engineer specializing in OAuth and authentication.

Objective: Add Google OAuth login support.

Tasks:

1. Create OAuth utilities:
   /home/gr4y/Data68/remrin/chat/lib/auth/oauth.ts
   
   Functions:
   - signInWithGoogle(): Initiates Google OAuth flow
   - handleOAuthCallback(): Processes callback and creates session

2. Update auth callback route:
   Handle Google OAuth callback properly
   - Exchange code for session
   - Create profile if new user
   - Create wallet for new user
   - Redirect to app

3. Create Google sign-in button component:
   /home/gr4y/Data68/remrin/chat/components/auth/GoogleSignInButton.tsx
   
   - Google branding guidelines
   - Loading state
   - Error handling

4. Environment variables needed:
   Document in README:
   - Supabase Dashboard → Auth → Providers → Google
   - Need: Google Client ID, Client Secret
   - Redirect URL: https://yoursite.com/auth/callback

5. Handle new user setup:
   When Google user signs up first time:
   - Create profile with Google display name
   - Create wallet with default balance
   - Show onboarding flow

When done: Run /verify then /commit-deploy
```

---

## 🟡 Agent Omega: Onboarding & Settings

```
=== AGENT OMEGA - ONBOARDING & SETTINGS ===
Session: 8
Workspace: /home/gr4y/Data68/remrin/chat

Role: Senior Frontend Engineer specializing in user onboarding.

Objective: Create post-signup onboarding flow and hide API settings.

Tasks:

1. Create onboarding modal:
   /home/gr4y/Data68/remrin/chat/components/onboarding/WelcomeModal.tsx
   
   Steps:
   - Welcome message
   - Display name input (if not set)
   - Age confirmation (if not set during signup)
   - "Enter Remrin" button
   
   Design:
   - Similar to Talkie popup (see reference)
   - Dark glassmorphism
   - Friendly, welcoming tone
   - Skip pronouns (family friendly)

2. Hide API settings for non-pro users:
   - Find API settings in the UI
   - Wrap with tier check
   - Only show for tier === 'pro'
   - Show "Upgrade to Pro" prompt for others

3. Update profile creation:
   Add fields to profiles table:
   - age_bracket: 'under13' | '13-17' | '18-24' | '25plus'
   - onboarding_complete: boolean

4. Create settings improvements:
   - Move API settings to "Advanced" section
   - Add tier badge display
   - Add "Upgrade" button for free users

5. Add tier check utility:
   /home/gr4y/Data68/remrin/chat/lib/auth/tier-check.ts
   
   Functions:
   - getUserTier(userId): Returns tier
   - canAccessFeature(userId, feature): Boolean check
   - requiresTier(feature): Returns min tier needed

When done: Run /verify then /commit-deploy
```

---

## 📋 Execution Checklist

| Agent | Focus | Status |
|-------|-------|--------|
| Chi | Login/Signup Pages | ⬜ |
| Psi | Google OAuth | ⬜ |
| Omega | Onboarding & Settings | ⬜ |

---

## 📁 Files to Create

```
Session 8:
├── app/[locale]/
│   ├── login/page.tsx
│   └── signup/page.tsx
├── app/auth/callback/route.ts
├── components/auth/
│   └── GoogleSignInButton.tsx
├── components/onboarding/
│   └── WelcomeModal.tsx
├── lib/auth/
│   ├── oauth.ts
│   └── tier-check.ts
└── supabase/migrations/
    └── 20241222_add_age_and_tiers.sql
```
