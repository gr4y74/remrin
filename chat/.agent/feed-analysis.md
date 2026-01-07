# Feed Feature Analysis & Implementation Plan

## Current State

### What Exists
✅ **Database Schema** (`moments` table)
- Stores image URLs, captions, likes, persona associations
- RLS policies for viewing/creating moments
- Like tracking via `moment_likes` table

✅ **Components**
- `MomentsGallery.tsx` - Masonry grid layout for images
- `MomentCard.tsx` - Individual moment card
- `MomentModal.tsx` - Lightbox view
- `/feed` page - Server-side rendering with Supabase

✅ **Features Working**
- Image-based moments (like Instagram posts)
- Like/unlike functionality
- Pagination (load more)
- Persona attribution
- Pinned moments

### What's Missing (Based on Reference)

❌ **Video Support**
- Reference shows video content (`.mp4` files)
- Current implementation only handles images
- Need video player with controls (play/pause, mute, speed)

❌ **TikTok-Style Layout**
- Reference shows vertical scrolling feed
- Current: Masonry grid (Pinterest-style)
- Need: Full-screen vertical cards (TikTok/Reels-style)

❌ **Reaction Stickers**
- Reference shows emoji/sticker reactions with counts
- Current: Simple like button
- Need: Multiple reaction types (heart, skull, job application, etc.)

❌ **User Profile Integration**
- Reference shows user avatar + username overlay
- Current: Persona info only
- Need: User who posted + persona featured

❌ **Feed Algorithm**
- Reference shows curated "For You" style feed
- Current: Simple chronological + pinned
- Need: Engagement-based sorting

## Implementation Plan

### Phase 1: Database Updates (HIGH PRIORITY)

1. **Add Video Support to `moments` table**
```sql
ALTER TABLE moments 
ADD COLUMN media_type VARCHAR(10) DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
ADD COLUMN video_url TEXT,
ADD COLUMN thumbnail_url TEXT,
ADD COLUMN duration_seconds INTEGER;
```

2. **Add Reactions System**
```sql
CREATE TABLE moment_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    moment_id UUID NOT NULL REFERENCES moments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reaction_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(moment_id, user_id, reaction_type)
);

-- Update moments table to track reaction counts
ALTER TABLE moments
ADD COLUMN reactions_data JSONB DEFAULT '{}';
```

3. **Add User Attribution**
```sql
ALTER TABLE moments
ADD COLUMN created_by_user_id UUID REFERENCES auth.users(id);
```

### Phase 2: API Routes (MEDIUM PRIORITY)

1. **Create `/api/moments/create` endpoint**
   - Handle video uploads to Supabase Storage
   - Generate thumbnails
   - Create moment record

2. **Create `/api/moments/react` endpoint**
   - Add/remove reactions
   - Update reaction counts

3. **Create `/api/moments/feed` endpoint**
   - Implement feed algorithm
   - Support filters (following, trending, new)

### Phase 3: UI Components (HIGH PRIORITY)

1. **Create `VideoMomentCard.tsx`**
   - Video player with custom controls
   - Play/pause on tap
   - Mute/unmute toggle
   - Speed control (1x, 2x)
   - Progress bar

2. **Create `ReactionBar.tsx`**
   - Display reaction buttons
   - Show reaction counts
   - Animate on interaction

3. **Create `FeedLayout.tsx`**
   - Vertical scrolling container
   - Snap-to-card behavior
   - Lazy loading
   - Infinite scroll

4. **Update `MomentsGallery.tsx`**
   - Support both grid and feed layouts
   - Switch based on media type or user preference

### Phase 4: Feed Page Redesign (MEDIUM PRIORITY)

1. **Update `/feed/page.tsx`**
   - Add layout toggle (grid vs. vertical feed)
   - Implement feed algorithm
   - Add filters (For You, Following, Trending)

2. **Add Upload Functionality**
   - Create moment upload modal
   - Support image AND video
   - Persona selection
   - Caption input

### Phase 5: Polish & Testing (LOW PRIORITY)

1. **Performance Optimization**
   - Video preloading
   - Thumbnail generation
   - CDN integration

2. **Analytics**
   - Track views
   - Track engagement
   - A/B test feed algorithms

3. **Moderation**
   - Content flagging
   - Admin review queue

## Technical Decisions

### Video Storage
**Option 1: Supabase Storage** (Recommended)
- ✅ Already integrated
- ✅ CDN support
- ✅ RLS policies
- ❌ Limited video processing

**Option 2: Cloudflare Stream**
- ✅ Built for video
- ✅ Automatic transcoding
- ✅ Analytics
- ❌ Additional cost
- ❌ Extra integration

**Decision**: Start with Supabase Storage, migrate to Cloudflare Stream if needed

### Feed Layout
**Option 1: Full TikTok Clone** (Vertical, one at a time)
- ✅ Matches reference exactly
- ✅ High engagement
- ❌ Complex scroll behavior
- ❌ Accessibility concerns

**Option 2: Hybrid Grid** (Current + vertical option)
- ✅ Flexibility
- ✅ Better for images
- ✅ Easier to implement
- ❌ Less immersive

**Decision**: Implement hybrid with toggle

### Reactions
**Option 1: Custom Sticker System** (Like reference)
- ✅ Unique branding
- ✅ Fun and engaging
- ❌ Need to create/source stickers
- ❌ Complex UI

**Option 2: Standard Emoji Reactions** (Like Discord)
- ✅ Easy to implement
- ✅ Universal
- ❌ Less unique

**Decision**: Start with emoji reactions, add custom stickers later

## Next Steps

1. ✅ Review this analysis with user
2. ⏳ Run database migrations
3. ⏳ Create video upload API
4. ⏳ Build VideoMomentCard component
5. ⏳ Implement feed layout
6. ⏳ Test with sample content
7. ⏳ Deploy and iterate

## Questions for User

1. Do you want to support video uploads immediately, or start with images only?
2. Should the feed be vertical-only (TikTok style) or offer both grid and vertical views?
3. Do you have custom reaction stickers/emojis, or should we use standard emojis?
4. What's the priority: Getting basic feed working vs. full feature parity with reference?
5. Do you want users to create moments, or only personas/admins?
