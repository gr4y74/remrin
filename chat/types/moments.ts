export type MediaType = 'image' | 'video'

export interface Moment {
    id: string
    persona_id: string
    created_by_user_id: string | null
    media_type: MediaType
    image_url: string | null
    video_url: string | null
    thumbnail_url: string | null
    duration_seconds: number | null
    caption: string | null
    created_at: string
    likes_count: number
    view_count: number
    is_pinned: boolean
    reactions_summary: Record<string, number>
    comments_count: number
    shares_count: number
    bookmarks_count: number
}

export interface MomentReaction {
    id: string
    moment_id: string
    user_id: string
    reaction_emoji: string
    created_at: string
}

export interface MomentWithPersona extends Moment {
    persona: {
        id: string
        name: string
        image_url: string | null
    }
    created_by?: {
        id: string
        username: string
        image_url: string | null
    }
    userReactions?: string[]
}
