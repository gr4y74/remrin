# Remrin Social Network - API Endpoints

## Overview

This document specifies all API endpoints required for the social network features. All endpoints use Supabase client for authentication and RLS enforcement.

## Authentication

All endpoints require authentication unless marked as **Public**.

**Authentication Method**: Supabase JWT via `Authorization: Bearer <token>` header

**Rate Limiting**: 
- Authenticated users: 1000 requests/hour
- Anonymous users: 100 requests/hour
- Write operations: 100 requests/hour

---

## Posts & Feed

### `POST /api/posts`
**Create a new post**

**Request**:
```typescript
{
  content: string;              // Required, max 5000 chars
  media_urls?: string[];        // Optional, max 10 images
  post_type: 'text' | 'image' | 'character_showcase' | 'achievement_share';
  visibility: 'public' | 'followers' | 'private';
  persona_id?: string;          // Required if post_type = 'character_showcase'
  achievement_id?: string;      // Required if post_type = 'achievement_share'
}
```

**Response**:
```typescript
{
  id: string;
  user_id: string;
  content: string;
  media_urls: string[];
  post_type: string;
  visibility: string;
  persona_id?: string;
  achievement_id?: string;
  view_count: number;
  created_at: string;
  updated_at: string;
}
```

**Status Codes**:
- `201`: Post created successfully
- `400`: Invalid request (missing required fields, content too long)
- `401`: Unauthorized
- `422`: Validation error (invalid persona_id or achievement_id)

---

### `GET /api/posts/feed`
**Get personalized feed**

**Query Parameters**:
```typescript
{
  page?: number;                // Default: 1
  limit?: number;               // Default: 20, max: 50
  filter?: 'all' | 'following' | 'public';  // Default: 'all'
  sort?: 'recent' | 'popular';  // Default: 'recent'
}
```

**Response**:
```typescript
{
  posts: Array<{
    id: string;
    user_id: string;
    user: {
      username: string;
      display_name: string;
      image_url: string;
    };
    content: string;
    media_urls: string[];
    post_type: string;
    visibility: string;
    persona?: { id: string; name: string; };
    achievement?: { id: string; name: string; icon: string; };
    view_count: number;
    engagement: {
      reactions: number;
      comments: number;
      shares: number;
    };
    user_reaction?: 'like' | 'love' | 'celebrate' | 'insightful';
    created_at: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    has_more: boolean;
  };
}
```

**Status Codes**:
- `200`: Success
- `401`: Unauthorized

---

### `GET /api/posts/:postId`
**Get single post by ID**

**Response**: Same as single post object in feed

**Status Codes**:
- `200`: Success
- `404`: Post not found or not visible to user
- `401`: Unauthorized (for non-public posts)

---

### `PATCH /api/posts/:postId`
**Update a post**

**Request**:
```typescript
{
  content?: string;
  media_urls?: string[];
  visibility?: 'public' | 'followers' | 'private';
}
```

**Response**: Updated post object

**Status Codes**:
- `200`: Success
- `400`: Invalid request
- `401`: Unauthorized
- `403`: Not post owner
- `404`: Post not found

---

### `DELETE /api/posts/:postId`
**Delete a post**

**Response**:
```typescript
{
  success: true;
  message: "Post deleted successfully";
}
```

**Status Codes**:
- `200`: Success
- `401`: Unauthorized
- `403`: Not post owner
- `404`: Post not found

---

### `GET /api/posts/user/:userId`
**Get posts by user**

**Query Parameters**:
```typescript
{
  page?: number;
  limit?: number;
  visibility?: 'public' | 'followers' | 'private';  // Filter by visibility
}
```

**Response**: Same as feed response

**Status Codes**:
- `200`: Success
- `404`: User not found

---

## Engagement

### `POST /api/posts/:postId/reactions`
**Add or update reaction to a post**

**Request**:
```typescript
{
  reaction_type: 'like' | 'love' | 'celebrate' | 'insightful';
}
```

**Response**:
```typescript
{
  id: string;
  post_id: string;
  user_id: string;
  reaction_type: string;
  created_at: string;
}
```

**Status Codes**:
- `201`: Reaction added
- `200`: Reaction updated
- `400`: Invalid reaction type
- `401`: Unauthorized
- `404`: Post not found

---

### `DELETE /api/posts/:postId/reactions`
**Remove reaction from a post**

**Response**:
```typescript
{
  success: true;
}
```

**Status Codes**:
- `200`: Success
- `401`: Unauthorized
- `404`: Reaction not found

---

### `GET /api/posts/:postId/reactions`
**Get all reactions for a post**

**Response**:
```typescript
{
  reactions: Array<{
    reaction_type: string;
    count: number;
    users: Array<{
      id: string;
      username: string;
      image_url: string;
    }>;
  }>;
  user_reaction?: string;  // Current user's reaction
}
```

**Status Codes**:
- `200`: Success
- `404`: Post not found

---

### `POST /api/posts/:postId/comments`
**Add comment to a post**

**Request**:
```typescript
{
  content: string;              // Required, max 2000 chars
  parent_comment_id?: string;   // For replies
  mentioned_users?: string[];   // Array of user IDs
}
```

**Response**:
```typescript
{
  id: string;
  post_id: string;
  user_id: string;
  parent_comment_id?: string;
  content: string;
  mentioned_users: string[];
  created_at: string;
  updated_at: string;
  user: {
    username: string;
    display_name: string;
    image_url: string;
  };
}
```

**Status Codes**:
- `201`: Comment created
- `400`: Invalid request (content too long, invalid parent)
- `401`: Unauthorized
- `404`: Post not found
- `422`: Cannot reply to a reply (max 1 level nesting)

---

### `GET /api/posts/:postId/comments`
**Get comments for a post**

**Query Parameters**:
```typescript
{
  page?: number;
  limit?: number;
  sort?: 'recent' | 'oldest';  // Default: 'recent'
}
```

**Response**:
```typescript
{
  comments: Array<{
    id: string;
    post_id: string;
    user_id: string;
    parent_comment_id?: string;
    content: string;
    mentioned_users: string[];
    created_at: string;
    user: {
      username: string;
      display_name: string;
      image_url: string;
    };
    replies?: Array<Comment>;  // Nested replies (1 level)
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}
```

**Status Codes**:
- `200`: Success
- `404`: Post not found

---

### `PATCH /api/posts/:postId/comments/:commentId`
**Update a comment**

**Request**:
```typescript
{
  content: string;
}
```

**Response**: Updated comment object

**Status Codes**:
- `200`: Success
- `400`: Invalid request
- `401`: Unauthorized
- `403`: Not comment owner
- `404`: Comment not found

---

### `DELETE /api/posts/:postId/comments/:commentId`
**Delete a comment**

**Response**:
```typescript
{
  success: true;
}
```

**Status Codes**:
- `200`: Success
- `401`: Unauthorized
- `403`: Not comment owner
- `404`: Comment not found

---

### `POST /api/posts/:postId/share`
**Share/repost a post**

**Request**:
```typescript
{
  commentary?: string;  // Optional commentary on share
}
```

**Response**:
```typescript
{
  id: string;
  post_id: string;
  user_id: string;
  commentary?: string;
  created_at: string;
}
```

**Status Codes**:
- `201`: Share created
- `400`: Already shared
- `401`: Unauthorized
- `404`: Post not found

---

### `DELETE /api/posts/:postId/share`
**Remove share**

**Response**:
```typescript
{
  success: true;
}
```

**Status Codes**:
- `200`: Success
- `401`: Unauthorized
- `404`: Share not found

---

## Analytics

### `GET /api/analytics/profile`
**Get profile analytics for current user**

**Query Parameters**:
```typescript
{
  start_date?: string;  // ISO date, default: 30 days ago
  end_date?: string;    // ISO date, default: today
}
```

**Response**:
```typescript
{
  profile_views: {
    total: number;
    by_date: Array<{ date: string; count: number; }>;
  };
  follower_growth: {
    current_followers: number;
    current_following: number;
    growth: Array<{
      date: string;
      followers: number;
      following: number;
      net_change: number;
    }>;
  };
  post_performance: {
    total_posts: number;
    total_views: number;
    total_engagement: number;
    avg_engagement_rate: number;
  };
  top_posts: Array<{
    id: string;
    content: string;
    views: number;
    engagement: number;
  }>;
}
```

**Status Codes**:
- `200`: Success
- `401`: Unauthorized

---

### `GET /api/analytics/posts/:postId`
**Get analytics for a specific post**

**Query Parameters**:
```typescript
{
  start_date?: string;
  end_date?: string;
}
```

**Response**:
```typescript
{
  post_id: string;
  total_views: number;
  total_reactions: number;
  total_comments: number;
  total_shares: number;
  engagement_rate: number;
  metrics_by_date: Array<{
    date: string;
    views: number;
    reactions: number;
    comments: number;
    shares: number;
  }>;
  reaction_breakdown: {
    like: number;
    love: number;
    celebrate: number;
    insightful: number;
  };
}
```

**Status Codes**:
- `200`: Success
- `401`: Unauthorized
- `403`: Not post owner
- `404`: Post not found

---

### `GET /api/analytics/activity-heatmap`
**Get activity heatmap for current user**

**Response**:
```typescript
{
  heatmap: Array<{
    date: string;
    hour: number;  // 0-23
    activity_count: number;
    activity_types: {
      posts: number;
      comments: number;
      reactions: number;
    };
  }>;
  most_active_hours: number[];  // Top 3 hours
  most_active_days: string[];   // Top 3 days
}
```

**Status Codes**:
- `200`: Success
- `401`: Unauthorized

---

## Highlights

### `POST /api/profile/pinned-posts`
**Pin a post to profile**

**Request**:
```typescript
{
  post_id: string;
  display_order: number;  // 0-2
}
```

**Response**:
```typescript
{
  id: string;
  user_id: string;
  post_id: string;
  display_order: number;
  created_at: string;
}
```

**Status Codes**:
- `201`: Post pinned
- `400`: Invalid display_order (must be 0-2) or already pinned
- `401`: Unauthorized
- `404`: Post not found
- `422`: Max 3 pinned posts

---

### `GET /api/profile/pinned-posts`
**Get pinned posts for current user**

**Response**:
```typescript
{
  pinned_posts: Array<{
    id: string;
    display_order: number;
    post: PostObject;
  }>;
}
```

**Status Codes**:
- `200`: Success
- `401`: Unauthorized

---

### `DELETE /api/profile/pinned-posts/:pinnedPostId`
**Unpin a post**

**Response**:
```typescript
{
  success: true;
}
```

**Status Codes**:
- `200`: Success
- `401`: Unauthorized
- `404`: Pinned post not found

---

### `POST /api/profile/featured-achievements`
**Feature an achievement**

**Request**:
```typescript
{
  achievement_id: string;
  display_order: number;
}
```

**Response**:
```typescript
{
  id: string;
  user_id: string;
  achievement_id: string;
  display_order: number;
  created_at: string;
}
```

**Status Codes**:
- `201`: Achievement featured
- `400`: Already featured
- `401`: Unauthorized
- `404`: Achievement not found or not earned

---

### `GET /api/profile/featured-achievements`
**Get featured achievements**

**Response**:
```typescript
{
  featured_achievements: Array<{
    id: string;
    display_order: number;
    achievement: AchievementObject;
  }>;
}
```

**Status Codes**:
- `200`: Success
- `401`: Unauthorized

---

### `POST /api/profile/showcase`
**Add item to showcase**

**Request**:
```typescript
{
  item_type: 'post' | 'achievement' | 'persona' | 'custom';
  item_id: string;
  title?: string;
  description?: string;
  thumbnail_url?: string;
  display_order: number;
  metadata?: object;
}
```

**Response**:
```typescript
{
  id: string;
  user_id: string;
  item_type: string;
  item_id: string;
  title?: string;
  description?: string;
  thumbnail_url?: string;
  display_order: number;
  metadata: object;
  created_at: string;
}
```

**Status Codes**:
- `201`: Item added to showcase
- `400`: Invalid item_type or already showcased
- `401`: Unauthorized
- `404`: Item not found

---

### `GET /api/profile/showcase`
**Get showcase items**

**Response**:
```typescript
{
  showcase_items: Array<ShowcaseItemObject>;
}
```

**Status Codes**:
- `200`: Success
- `401`: Unauthorized

---

## Notifications

### `GET /api/notifications`
**Get notifications for current user**

**Query Parameters**:
```typescript
{
  page?: number;
  limit?: number;
  filter?: 'all' | 'unread';  // Default: 'all'
  type?: string;  // Filter by notification_type
}
```

**Response**:
```typescript
{
  notifications: Array<{
    id: string;
    user_id: string;
    actor_id?: string;
    actor?: {
      username: string;
      display_name: string;
      image_url: string;
    };
    notification_type: string;
    entity_type?: string;
    entity_id?: string;
    title: string;
    message?: string;
    action_url?: string;
    is_read: boolean;
    metadata: object;
    created_at: string;
    read_at?: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    unread_count: number;
  };
}
```

**Status Codes**:
- `200`: Success
- `401`: Unauthorized

---

### `PATCH /api/notifications/:notificationId/read`
**Mark notification as read**

**Response**:
```typescript
{
  success: true;
  read_at: string;
}
```

**Status Codes**:
- `200`: Success
- `401`: Unauthorized
- `404`: Notification not found

---

### `POST /api/notifications/mark-all-read`
**Mark all notifications as read**

**Response**:
```typescript
{
  success: true;
  marked_count: number;
}
```

**Status Codes**:
- `200`: Success
- `401`: Unauthorized

---

### `DELETE /api/notifications/:notificationId`
**Delete a notification**

**Response**:
```typescript
{
  success: true;
}
```

**Status Codes**:
- `200`: Success
- `401`: Unauthorized
- `404`: Notification not found

---

### `GET /api/notifications/preferences`
**Get notification preferences**

**Response**:
```typescript
{
  preferences: Array<{
    notification_type: string;
    enabled: boolean;
    email_enabled: boolean;
    push_enabled: boolean;
  }>;
}
```

**Status Codes**:
- `200`: Success
- `401`: Unauthorized

---

### `PATCH /api/notifications/preferences`
**Update notification preferences**

**Request**:
```typescript
{
  preferences: Array<{
    notification_type: string;
    enabled?: boolean;
    email_enabled?: boolean;
    push_enabled?: boolean;
  }>;
}
```

**Response**:
```typescript
{
  success: true;
  updated_preferences: Array<NotificationPreferenceObject>;
}
```

**Status Codes**:
- `200`: Success
- `400`: Invalid notification_type
- `401`: Unauthorized

---

## Customization

### `POST /api/profile/themes`
**Create custom theme**

**Request**:
```typescript
{
  theme_name: string;
  primary_color?: string;      // Hex color
  secondary_color?: string;
  accent_color?: string;
  background_color?: string;
  text_color?: string;
  font_family?: string;
  custom_css?: string;
  is_public?: boolean;
}
```

**Response**:
```typescript
{
  id: string;
  user_id: string;
  theme_name: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  background_color?: string;
  text_color?: string;
  font_family?: string;
  custom_css?: string;
  is_active: boolean;
  is_public: boolean;
  use_count: number;
  created_at: string;
}
```

**Status Codes**:
- `201`: Theme created
- `400`: Invalid color format or CSS
- `401`: Unauthorized

---

### `GET /api/profile/themes`
**Get user's themes**

**Response**:
```typescript
{
  themes: Array<ThemeObject>;
}
```

**Status Codes**:
- `200`: Success
- `401`: Unauthorized

---

### `GET /api/themes/public`
**Get public themes (Public)**

**Query Parameters**:
```typescript
{
  page?: number;
  limit?: number;
  sort?: 'popular' | 'recent';  // Default: 'popular'
}
```

**Response**:
```typescript
{
  themes: Array<ThemeObject>;
  pagination: PaginationObject;
}
```

**Status Codes**:
- `200`: Success

---

### `PATCH /api/profile/themes/:themeId/activate`
**Activate a theme**

**Response**:
```typescript
{
  success: true;
  active_theme: ThemeObject;
}
```

**Status Codes**:
- `200`: Success
- `401`: Unauthorized
- `404`: Theme not found

---

### `GET /api/profile/layout`
**Get layout preferences**

**Response**:
```typescript
{
  layout_type: 'grid' | 'list' | 'masonry';
  section_order: string[];
  visible_sections: object;
  posts_per_page: number;
}
```

**Status Codes**:
- `200`: Success
- `401`: Unauthorized

---

### `PATCH /api/profile/layout`
**Update layout preferences**

**Request**:
```typescript
{
  layout_type?: 'grid' | 'list' | 'masonry';
  section_order?: string[];
  visible_sections?: object;
  posts_per_page?: number;  // 5-50
}
```

**Response**:
```typescript
{
  success: true;
  layout: LayoutPreferencesObject;
}
```

**Status Codes**:
- `200`: Success
- `400`: Invalid layout_type or posts_per_page
- `401`: Unauthorized

---

## Follows (Existing - Extended)

### `POST /api/follows`
**Follow a user**

**Request**:
```typescript
{
  following_id: string;
}
```

**Response**:
```typescript
{
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}
```

**Status Codes**:
- `201`: Follow created
- `400`: Already following or trying to follow self
- `401`: Unauthorized
- `404`: User not found

---

### `DELETE /api/follows/:userId`
**Unfollow a user**

**Response**:
```typescript
{
  success: true;
}
```

**Status Codes**:
- `200`: Success
- `401`: Unauthorized
- `404`: Follow relationship not found

---

### `GET /api/follows/followers/:userId`
**Get followers for a user**

**Query Parameters**:
```typescript
{
  page?: number;
  limit?: number;
}
```

**Response**:
```typescript
{
  followers: Array<{
    id: string;
    username: string;
    display_name: string;
    image_url: string;
    followed_at: string;
  }>;
  pagination: PaginationObject;
}
```

**Status Codes**:
- `200`: Success
- `404`: User not found

---

### `GET /api/follows/following/:userId`
**Get users followed by a user**

**Query Parameters**: Same as followers

**Response**: Same structure as followers

**Status Codes**:
- `200`: Success
- `404`: User not found

---

## Rate Limiting

### Rate Limit Headers

All responses include rate limit headers:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640000000
```

### Rate Limit Response

When rate limit exceeded:

**Status Code**: `429 Too Many Requests`

**Response**:
```typescript
{
  error: "Rate limit exceeded";
  retry_after: number;  // Seconds until reset
}
```

---

## Error Responses

### Standard Error Format

```typescript
{
  error: string;           // Error message
  code?: string;           // Error code (e.g., 'INVALID_INPUT')
  details?: object;        // Additional error details
  timestamp: string;       // ISO timestamp
}
```

### Common Error Codes

- `UNAUTHORIZED`: Missing or invalid authentication
- `FORBIDDEN`: Authenticated but not authorized
- `NOT_FOUND`: Resource not found
- `INVALID_INPUT`: Validation error
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `SERVER_ERROR`: Internal server error

---

## Pagination

### Standard Pagination Format

**Query Parameters**:
```typescript
{
  page?: number;    // Default: 1
  limit?: number;   // Default: 20, max: 50
}
```

**Response**:
```typescript
{
  data: Array<T>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_more: boolean;
  };
}
```

---

## WebSocket Events (Future)

### Real-time Subscriptions

**Supabase Realtime Channels**:

```typescript
// Subscribe to new posts
supabase
  .channel('posts')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'posts' },
    (payload) => console.log('New post:', payload)
  )
  .subscribe();

// Subscribe to notifications
supabase
  .channel(`notifications:${userId}`)
  .on('postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
    (payload) => console.log('New notification:', payload)
  )
  .subscribe();
```

---

## Implementation Notes

### Supabase Client Usage

All endpoints should use Supabase client with RLS:

```typescript
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .limit(20);
    
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  
  return Response.json({ posts: data });
}
```

### Authentication Check

```typescript
const { data: { user }, error } = await supabase.auth.getUser();

if (error || !user) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### Rate Limiting Implementation

Use Vercel Edge Config or Upstash Redis:

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(1000, '1 h'),
});

const { success, limit, remaining, reset } = await ratelimit.limit(user.id);

if (!success) {
  return Response.json(
    { error: 'Rate limit exceeded', retry_after: reset },
    { status: 429 }
  );
}
```

---

## Testing

### Example cURL Requests

**Create Post**:
```bash
curl -X POST https://remrin.ai/api/posts \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello world!",
    "post_type": "text",
    "visibility": "public"
  }'
```

**Get Feed**:
```bash
curl https://remrin.ai/api/posts/feed?page=1&limit=20 \
  -H "Authorization: Bearer <token>"
```

**Add Reaction**:
```bash
curl -X POST https://remrin.ai/api/posts/<post-id>/reactions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"reaction_type": "love"}'
```

---

## Next Steps

1. **Implement API Routes**: Create Next.js API routes in `/app/api/`
2. **Add Validation**: Use Zod for request validation
3. **Implement Rate Limiting**: Set up Upstash Redis
4. **Add Monitoring**: Implement logging and error tracking
5. **Write Tests**: Create integration tests for all endpoints
6. **Document OpenAPI**: Generate OpenAPI/Swagger documentation
