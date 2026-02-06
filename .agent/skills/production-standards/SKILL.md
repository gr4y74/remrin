---
name: Production Standards
description: Enforce production-ready development practices - NO demo data, NO local storage, ALWAYS use Supabase and existing user systems
---

# Production Standards Skill

> [!CAUTION]
> **CRITICAL**: This skill MUST be followed for ALL new features. No exceptions.

## Core Principles

### 1. NEVER Create Demo/Mock Data
❌ **FORBIDDEN**:
- Hardcoded sample users
- Mock personas/characters
- Fake statistics or counts
- Placeholder content that requires manual removal
- Demo accounts or test data

✅ **REQUIRED**:
- Fetch real data from Supabase
- Empty states with proper UI ("No items yet")
- Real user data from authenticated session
- Actual database records

### 2. NEVER Use Local Storage for Persistent Data
❌ **FORBIDDEN**:
- `localStorage` for user preferences that should sync
- `sessionStorage` for data that needs persistence
- In-memory arrays/objects as fake databases
- Standalone state that doesn't sync with Supabase

✅ **REQUIRED**:
- Supabase tables for all persistent data
- Supabase Realtime for live updates
- User preferences stored in database
- Server-side session management

### 3. ALWAYS Use Existing User System
❌ **FORBIDDEN**:
```tsx
// NEVER DO THIS
const [username, setUsername] = useState("DemoUser")
const [avatar, setAvatar] = useState("/default-avatar.png")
const mockUser = { id: "123", name: "Test User" }
```

✅ **REQUIRED**:
```tsx
// ALWAYS DO THIS
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'

const supabase = createClient()
const { user, profile } = useUser()

// Use real user data
const username = profile?.username
const avatar = profile?.avatar_url
const userId = user?.id
```

---

## Supabase Integration Requirements

### Authentication
```tsx
// Get current user
const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()

// Always check auth state
if (!user) {
    redirect('/login')
}
```

### Fetching User Profile
```tsx
// Use existing profiles table
const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
```

### Fetching Personas/Characters
```tsx
// Use existing personas table
const { data: personas } = await supabase
    .from('personas')
    .select('*')
    .eq('user_id', user.id)
```

---

## Existing Tables to Use

### User Data
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `auth.users` | Authentication | `id`, `email` |
| `profiles` | User profiles | `id`, `username`, `avatar_url`, `display_name` |
| `user_profiles_chat` | AOL chat profiles | `user_id`, `username`, `status` |

### Content
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `personas` | AI characters | `id`, `name`, `image_url`, `description` |
| `conversations` | Chat history | `id`, `user_id`, `persona_id` |
| `messages` | Chat messages | `id`, `conversation_id`, `content` |

### Social
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `buddy_lists` | Friend relationships | `user_id`, `buddy_id` |
| `user_followers` | Follow relationships | `follower_id`, `following_id` |

### Chat System
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `chat_rooms` | Group chat rooms | `id`, `name`, `created_by` |
| `chat_messages` | Room messages | `room_id`, `user_id`, `message` |
| `room_members` | Room participants | `room_id`, `user_id` |
| `direct_messages` | 1:1 messages | `from_user_id`, `to_user_id` |

---

## Hooks to Use

### Available Hooks
```tsx
// User authentication
import { useUser } from '@/hooks/useUser'

// Real-time presence
import { useEnhancedPresence } from '@/hooks/useEnhancedPresence'

// Buddy list
import { useBuddyList } from '@/hooks/useBuddyList'

// Direct messages
import { useDirectMessages } from '@/hooks/useDirectMessages'

// Typing indicators
import { useTypingIndicator } from '@/hooks/useTypingIndicator'

// Sound effects
import { useSFX } from '@/hooks/useSFX'
```

---

## Production-Ready Checklist

Before marking any feature complete:

### Data Integration
- [ ] Uses Supabase for ALL data storage
- [ ] Uses existing `profiles` table for user data
- [ ] Uses existing `personas` table for characters
- [ ] No hardcoded sample/demo data
- [ ] No localStorage for persistent data
- [ ] Real-time subscriptions where needed

### User System
- [ ] Uses authenticated user from `supabase.auth`
- [ ] Uses `profile.username` (not hardcoded)
- [ ] Uses `profile.avatar_url` (not placeholder)
- [ ] Handles unauthenticated state properly
- [ ] User preferences saved to database

### Empty States
- [ ] Shows proper UI when no data exists
- [ ] "Create your first..." prompts instead of demo data
- [ ] Loading states while fetching
- [ ] Error states for failed fetches

### Site-Wide Integration
- [ ] Navigation added to appropriate menus
- [ ] Consistent with existing design system
- [ ] Works with existing layout/background
- [ ] Accessible from expected locations

---

## Anti-Patterns to Avoid

### ❌ Fake Data Arrays
```tsx
// NEVER
const personas = [
    { id: 1, name: "Demo Character", image: "/demo.png" },
    { id: 2, name: "Test Bot", image: "/test.png" },
]
```

### ❌ Mock User Objects
```tsx
// NEVER
const currentUser = {
    id: "demo-user-123",
    username: "DemoUser",
    avatar: "/default-avatar.png"
}
```

### ❌ Conditional Demo Data
```tsx
// NEVER
const data = process.env.NODE_ENV === 'development' 
    ? DEMO_DATA 
    : await fetchRealData()
```

### ❌ localStorage for User Preferences
```tsx
// NEVER for important settings
const theme = localStorage.getItem('theme')
```

---

## Correct Patterns

### ✅ Real Data Fetching
```tsx
const { data: personas, isLoading, error } = useSWR(
    user ? `/api/personas?userId=${user.id}` : null,
    fetcher
)

if (isLoading) return <LoadingSpinner />
if (error) return <ErrorState message="Failed to load" />
if (!personas?.length) return <EmptyState message="No personas yet" />
```

### ✅ Real User from Auth
```tsx
const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()
const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_url, display_name')
    .eq('id', user.id)
    .single()
```

### ✅ Database-Backed Preferences
```tsx
// Save to user_settings table
await supabase
    .from('user_settings')
    .upsert({ 
        user_id: user.id, 
        theme: 'dark',
        sound_enabled: true 
    })
```

---

## Feature Launch Checklist

Before considering a feature "done":

1. [ ] **No demo data** - Zero hardcoded sample content
2. [ ] **Supabase integrated** - All data from database
3. [ ] **Real users** - Uses actual authenticated user
4. [ ] **Empty states** - Graceful handling when no data
5. [ ] **Navigation** - Accessible from main site
6. [ ] **Design system** - Follows Rose Pine/glassmorphism
7. [ ] **Responsive** - Works on all screen sizes
8. [ ] **Type-safe** - TypeScript types match database schema
9. [ ] **Real-time** - Uses Supabase Realtime where appropriate
10. [ ] **Production build** - `npm run build` passes
