# AGENT 4: Integration & Feed Page

## Mission
Integrate all components into the feed page, add layout toggle, implement feed algorithm, and ensure everything works end-to-end.

## Context
- Project: Remrin.ai chat application
- Location: `/mnt/Data68/remrin/chat`
- Dependencies: Wait for AGENT 1, 2, and 3 to complete

## Tasks

### 1. Update Feed Page
Update: `/mnt/Data68/remrin/chat/app/[locale]/(platform)/feed/page.tsx`

```typescript
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { FeedPageClient } from "./FeedPageClient"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Soul Feed | Remrin",
    description: "Discover moments from souls across the realm. Watch, react, and engage with the community.",
    openGraph: {
        title: "Soul Feed | Remrin",
        description: "Discover moments from souls across the realm. Watch, react, and engage with the community."
    }
}

const PAGE_SIZE = 12

export default async function FeedPage({
    searchParams
}: {
    searchParams: { filter?: string; layout?: string }
}) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const filter = searchParams.filter || 'for-you'
    const layout = searchParams.layout || 'grid'

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch initial moments
    let query = supabase
        .from("moments")
        .select(`
            id,
            persona_id,
            created_by_user_id,
            media_type,
            image_url,
            video_url,
            thumbnail_url,
            duration_seconds,
            caption,
            created_at,
            likes_count,
            view_count,
            is_pinned,
            reactions_summary,
            personas!inner(id, name, image_url)
        `)

    // Apply filter
    if (filter === 'trending') {
        query = query
            .order('view_count', { ascending: false })
            .order('likes_count', { ascending: false })
    } else {
        query = query
            .order('is_pinned', { ascending: false })
            .order('created_at', { ascending: false })
    }

    query = query.range(0, PAGE_SIZE - 1)

    const { data: momentsData, error } = await query

    if (error) {
        console.error("Error fetching moments:", error)
    }

    // Get user's reactions
    let userReactionsMap: Record<string, string[]> = {}
    if (user && momentsData && momentsData.length > 0) {
        const { data: reactions } = await supabase
            .from("moment_reactions")
            .select("moment_id, reaction_emoji")
            .eq("user_id", user.id)
            .in("moment_id", momentsData.map(m => m.id))

        userReactionsMap = (reactions || []).reduce((acc, r) => {
            if (!acc[r.moment_id]) acc[r.moment_id] = []
            acc[r.moment_id].push(r.reaction_emoji)
            return acc
        }, {} as Record<string, string[]>)
    }

    const initialMoments = (momentsData || []).map((m) => {
        const personaData = Array.isArray(m.personas) ? m.personas[0] : m.personas
        return {
            id: m.id,
            persona_id: m.persona_id,
            created_by_user_id: m.created_by_user_id,
            media_type: m.media_type,
            image_url: m.image_url,
            video_url: m.video_url,
            thumbnail_url: m.thumbnail_url,
            duration_seconds: m.duration_seconds,
            caption: m.caption,
            created_at: m.created_at,
            likes_count: m.likes_count,
            view_count: m.view_count,
            is_pinned: m.is_pinned,
            reactions_summary: m.reactions_summary || {},
            persona: {
                id: personaData?.id || m.persona_id,
                name: personaData?.name || "Unknown",
                image_url: personaData?.image_url || null
            },
            userReactions: userReactionsMap[m.id] || []
        }
    })

    return (
        <FeedPageClient
            initialMoments={initialMoments}
            initialFilter={filter}
            initialLayout={layout}
            hasMore={initialMoments.length === PAGE_SIZE}
        />
    )
}
```

### 2. Create Client Component
Create: `/mnt/Data68/remrin/chat/app/[locale]/(platform)/feed/FeedPageClient.tsx`

```typescript
"use client"

import { useState } from 'react'
import { MomentsGallery } from '@/components/moments/MomentsGallery'
import { FeedLayout } from '@/components/moments/FeedLayout'
import { MomentWithPersona } from '@/types/moments'
import { Button } from '@/components/ui/button'
import { Grid, Rows, TrendingUp, Sparkles, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter, useSearchParams } from 'next/navigation'

interface FeedPageClientProps {
    initialMoments: MomentWithPersona[]
    initialFilter: string
    initialLayout: string
    hasMore: boolean
}

export function FeedPageClient({
    initialMoments,
    initialFilter,
    initialLayout,
    hasMore: initialHasMore
}: FeedPageClientProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [moments, setMoments] = useState(initialMoments)
    const [filter, setFilter] = useState(initialFilter)
    const [layout, setLayout] = useState(initialLayout)
    const [hasMore, setHasMore] = useState(initialHasMore)
    const [isLoading, setIsLoading] = useState(false)

    const handleFilterChange = (newFilter: string) => {
        setFilter(newFilter)
        const params = new URLSearchParams(searchParams)
        params.set('filter', newFilter)
        router.push(`/feed?${params.toString()}`)
    }

    const handleLayoutChange = (newLayout: string) => {
        setLayout(newLayout)
        const params = new URLSearchParams(searchParams)
        params.set('layout', newLayout)
        router.push(`/feed?${params.toString()}`)
    }

    const handleReact = async (momentId: string, emoji: string, isAdding: boolean) => {
        try {
            const response = await fetch('/api/moments/react', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    momentId,
                    emoji,
                    action: isAdding ? 'add' : 'remove'
                })
            })

            if (!response.ok) throw new Error('Failed to react')

            const { reactions } = await response.json()

            // Update local state
            setMoments(prev => prev.map(m => {
                if (m.id === momentId) {
                    const newUserReactions = isAdding
                        ? [...(m.userReactions || []), emoji]
                        : (m.userReactions || []).filter(e => e !== emoji)
                    
                    return {
                        ...m,
                        reactions_summary: reactions,
                        userReactions: newUserReactions
                    }
                }
                return m
            }))
        } catch (error) {
            console.error('React error:', error)
        }
    }

    const handleView = async (momentId: string) => {
        try {
            await fetch('/api/moments/view', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ momentId })
            })
        } catch (error) {
            console.error('View tracking error:', error)
        }
    }

    const loadMore = async () => {
        if (isLoading || !hasMore) return

        setIsLoading(true)
        try {
            const response = await fetch(
                `/api/moments/feed?filter=${filter}&offset=${moments.length}&limit=12`
            )
            const { moments: newMoments, hasMore: moreAvailable } = await response.json()

            setMoments(prev => [...prev, ...newMoments])
            setHasMore(moreAvailable)
        } catch (error) {
            console.error('Load more error:', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="bg-rp-base min-h-screen">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-rp-base/80 backdrop-blur-sm border-b border-rp-muted/20">
                <div className="mx-auto max-w-7xl px-4 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="font-tiempos-headline text-3xl font-bold text-rp-text">
                            Soul Feed
                        </h1>

                        {/* Layout Toggle */}
                        <div className="flex gap-2">
                            <Button
                                variant={layout === 'grid' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => handleLayoutChange('grid')}
                            >
                                <Grid className="h-4 w-4" />
                            </Button>
                            <Button
                                variant={layout === 'feed' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => handleLayoutChange('feed')}
                            >
                                <Rows className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                        <Button
                            variant={filter === 'for-you' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => handleFilterChange('for-you')}
                            className="whitespace-nowrap"
                        >
                            <Sparkles className="h-4 w-4 mr-1" />
                            For You
                        </Button>
                        <Button
                            variant={filter === 'trending' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => handleFilterChange('trending')}
                            className="whitespace-nowrap"
                        >
                            <TrendingUp className="h-4 w-4 mr-1" />
                            Trending
                        </Button>
                        <Button
                            variant={filter === 'following' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => handleFilterChange('following')}
                            className="whitespace-nowrap"
                        >
                            <Users className="h-4 w-4 mr-1" />
                            Following
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            {layout === 'feed' ? (
                <FeedLayout
                    moments={moments}
                    onReact={handleReact}
                    onView={handleView}
                    onLoadMore={loadMore}
                    hasMore={hasMore}
                />
            ) : (
                <div className="mx-auto max-w-7xl px-4 py-8">
                    <MomentsGallery
                        initialMoments={moments}
                        initialHasMore={hasMore}
                        pageSize={12}
                        onReact={handleReact}
                        onView={handleView}
                    />
                </div>
            )}
        </div>
    )
}
```

### 3. Add Upload Button to Persona Pages
Update persona profile pages to include "Create Moment" button for owners.

### 4. Add Premium Check Middleware
Create: `/mnt/Data68/remrin/chat/lib/check-premium.ts`

```typescript
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function checkUserPremium(): Promise<boolean> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_premium')
    .eq('user_id', user.id)
    .single()

  return profile?.is_premium || false
}
```

Use this in upload API to restrict to premium users.

### 5. Testing Checklist
Create: `/mnt/Data68/remrin/chat/.agent/feed-testing-checklist.md`

```markdown
# Feed Feature Testing Checklist

## Database
- [ ] Can create video moments
- [ ] Can create image moments
- [ ] Reactions table working
- [ ] Reaction counts update automatically
- [ ] View counts increment
- [ ] RLS policies prevent unauthorized access

## API
- [ ] Upload endpoint accepts videos
- [ ] Upload endpoint accepts images
- [ ] Thumbnails upload correctly
- [ ] Reactions API adds reactions
- [ ] Reactions API removes reactions
- [ ] Feed API returns correct data
- [ ] View tracking works

## Components
- [ ] VideoMomentCard plays/pauses
- [ ] Mute toggle works
- [ ] ReactionBar displays correctly
- [ ] Reactions add/remove on click
- [ ] FeedLayout navigation works
- [ ] Grid layout displays properly
- [ ] Upload modal works

## Integration
- [ ] Feed page loads
- [ ] Filter tabs work
- [ ] Layout toggle works
- [ ] Infinite scroll works
- [ ] Premium check works
- [ ] All features work together

## Performance
- [ ] Videos load quickly
- [ ] No memory leaks
- [ ] Smooth scrolling
- [ ] Reactions update instantly
```

## Deliverables
1. ✅ Updated feed page with filters
2. ✅ Client component with state management
3. ✅ Layout toggle (grid/feed)
4. ✅ Premium user checks
5. ✅ Complete testing checklist

## Success Criteria
- [ ] Feed page fully functional
- [ ] Can switch between layouts
- [ ] Can filter content
- [ ] Can upload moments (premium)
- [ ] Can react to moments
- [ ] All features integrated

## Dependencies
- AGENT 1 (database)
- AGENT 2 (APIs)
- AGENT 3 (components)

## Final Steps
1. Run full test suite
2. Fix any integration bugs
3. Document any known issues
4. Prepare for user testing
