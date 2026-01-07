# AGENT 2: API Routes & Server Actions

## Mission
Build all API endpoints and server actions for moment creation, video upload, reactions, and feed algorithm.

## Context
- Project: Remrin.ai chat application
- Location: `/mnt/Data68/remrin/chat`
- Framework: Next.js 14 (App Router)
- Database: Supabase
- Dependency: Wait for AGENT 1 to complete database migrations

## Tasks

### 1. Create Moment Upload API
Create: `/mnt/Data68/remrin/chat/app/api/moments/upload/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const mediaType = formData.get('mediaType') as 'image' | 'video'
    const personaId = formData.get('personaId') as string
    const caption = formData.get('caption') as string | null
    const thumbnail = formData.get('thumbnail') as File | null

    if (!file || !mediaType || !personaId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify user owns the persona
    const { data: persona, error: personaError } = await supabase
      .from('personas')
      .select('id, owner_id')
      .eq('id', personaId)
      .single()

    if (personaError || persona.owner_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized - not persona owner' }, { status: 403 })
    }

    // Upload main file
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}.${fileExt}`
    const bucketName = mediaType === 'video' ? 'moment-videos' : 'moment-images'

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      return NextResponse.json({ error: 'Upload failed', details: uploadError }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName)

    // Upload thumbnail if video
    let thumbnailUrl = null
    if (mediaType === 'video' && thumbnail) {
      const thumbExt = thumbnail.name.split('.').pop()
      const thumbName = `${user.id}/${Date.now()}_thumb.${thumbExt}`
      
      const { error: thumbError } = await supabase.storage
        .from('moment-thumbnails')
        .upload(thumbName, thumbnail)

      if (!thumbError) {
        const { data: { publicUrl: thumbPublicUrl } } = supabase.storage
          .from('moment-thumbnails')
          .getPublicUrl(thumbName)
        thumbnailUrl = thumbPublicUrl
      }
    }

    // Create moment record
    const momentData: any = {
      persona_id: personaId,
      created_by_user_id: user.id,
      media_type: mediaType,
      caption: caption,
      reactions_summary: {}
    }

    if (mediaType === 'image') {
      momentData.image_url = publicUrl
    } else {
      momentData.video_url = publicUrl
      momentData.thumbnail_url = thumbnailUrl
      const duration = formData.get('duration')
      if (duration) momentData.duration_seconds = parseInt(duration as string)
    }

    const { data: moment, error: momentError } = await supabase
      .from('moments')
      .insert(momentData)
      .select()
      .single()

    if (momentError) {
      return NextResponse.json({ error: 'Failed to create moment', details: momentError }, { status: 500 })
    }

    return NextResponse.json({ success: true, moment }, { status: 201 })
  } catch (error) {
    console.error('Moment upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### 2. Create Reactions API
Create: `/mnt/Data68/remrin/chat/app/api/moments/react/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { momentId, emoji, action } = await request.json()

    if (!momentId || !emoji || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (action === 'add') {
      const { error } = await supabase
        .from('moment_reactions')
        .insert({
          moment_id: momentId,
          user_id: user.id,
          reaction_emoji: emoji
        })

      if (error && error.code !== '23505') { // Ignore duplicate
        return NextResponse.json({ error: 'Failed to add reaction' }, { status: 500 })
      }
    } else if (action === 'remove') {
      const { error } = await supabase
        .from('moment_reactions')
        .delete()
        .eq('moment_id', momentId)
        .eq('user_id', user.id)
        .eq('reaction_emoji', emoji)

      if (error) {
        return NextResponse.json({ error: 'Failed to remove reaction' }, { status: 500 })
      }
    }

    // Fetch updated moment with reactions
    const { data: moment } = await supabase
      .from('moments')
      .select('reactions_summary')
      .eq('id', momentId)
      .single()

    return NextResponse.json({ success: true, reactions: moment?.reactions_summary || {} })
  } catch (error) {
    console.error('Reaction error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### 3. Create Feed Algorithm API
Create: `/mnt/Data68/remrin/chat/app/api/moments/feed/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    const searchParams = request.nextUrl.searchParams
    const filter = searchParams.get('filter') || 'for-you' // for-you, following, trending
    const offset = parseInt(searchParams.get('offset') || '0')
    const limit = parseInt(searchParams.get('limit') || '12')

    const { data: { user } } = await supabase.auth.getUser()

    let query = supabase
      .from('moments')
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

    // Apply filter logic
    if (filter === 'trending') {
      query = query
        .order('view_count', { ascending: false })
        .order('likes_count', { ascending: false })
    } else if (filter === 'following' && user) {
      // TODO: Implement following logic when user-persona relationships exist
      query = query.order('created_at', { ascending: false })
    } else {
      // For You: Mix of popular and recent
      query = query
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
    }

    query = query.range(offset, offset + limit - 1)

    const { data: moments, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch moments' }, { status: 500 })
    }

    // Get user's reactions if authenticated
    let userReactions: Record<string, string[]> = {}
    if (user && moments && moments.length > 0) {
      const { data: reactions } = await supabase
        .from('moment_reactions')
        .select('moment_id, reaction_emoji')
        .eq('user_id', user.id)
        .in('moment_id', moments.map(m => m.id))

      userReactions = (reactions || []).reduce((acc, r) => {
        if (!acc[r.moment_id]) acc[r.moment_id] = []
        acc[r.moment_id].push(r.reaction_emoji)
        return acc
      }, {} as Record<string, string[]>)
    }

    const formattedMoments = (moments || []).map(m => ({
      ...m,
      userReactions: userReactions[m.id] || []
    }))

    return NextResponse.json({
      moments: formattedMoments,
      hasMore: moments && moments.length === limit
    })
  } catch (error) {
    console.error('Feed error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### 4. Create View Tracking API
Create: `/mnt/Data68/remrin/chat/app/api/moments/view/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    const { momentId } = await request.json()

    if (!momentId) {
      return NextResponse.json({ error: 'Missing momentId' }, { status: 400 })
    }

    // Increment view count
    const { error } = await supabase.rpc('increment_moment_views', {
      moment_id: momentId
    })

    if (error) {
      console.error('View tracking error:', error)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('View tracking error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### 5. Create View Increment Function
Add to database migration:

```sql
-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_moment_views(moment_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE moments
  SET view_count = view_count + 1
  WHERE id = moment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Deliverables
1. ✅ Upload API with video + thumbnail support
2. ✅ Reactions API (add/remove)
3. ✅ Feed algorithm with filters
4. ✅ View tracking
5. ✅ Error handling and validation

## Success Criteria
- [ ] Can upload videos via API
- [ ] Can add/remove reactions
- [ ] Feed returns moments with correct sorting
- [ ] View counts increment
- [ ] All endpoints handle auth correctly

## Dependencies
- AGENT 1 must complete database migrations first

## Handoff
Once complete, notify AGENT 3 (Components) that APIs are ready for integration.
