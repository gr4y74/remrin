export type PostType = 'text' | 'image' | 'character_showcase' | 'achievement_share';
export type VisibilityType = 'public' | 'followers' | 'private';
export type ReactionType = 'like' | 'love' | 'celebrate' | 'insightful';

export interface Post {
    id: string;
    user_id: string;
    content: string;
    media_urls: string[];
    post_type: PostType;
    visibility: VisibilityType;
    persona_id?: string;
    achievement_id?: string;
    view_count: number;
    is_pinned: boolean;
    created_at: string;
    updated_at: string;
    author?: {
        id: string;
        username: string;
        display_name?: string;
        avatar_url?: string;
    };
    reactions_count?: number;
    comments_count?: number;
    shares_count?: number;
    user_reaction?: ReactionType | null;
}

export interface PostComment {
    id: string;
    post_id: string;
    user_id: string;
    parent_comment_id?: string;
    content: string;
    mentioned_users: string[];
    created_at: string;
    updated_at: string;
    author?: {
        id: string;
        username: string;
        display_name?: string;
        avatar_url?: string;
    };
    replies?: PostComment[];
    likes_count?: number;
    user_liked?: boolean;
}


export interface Notification {
    id: string;
    user_id: string;
    actor_id: string;
    notification_type: 'follow' | 'post_reaction' | 'comment' | 'mention' | 'share' | 'achievement_earned' | 'post_comment_reply' | 'milestone';
    entity_type: string;
    entity_id: string;
    title: string;
    message?: string;
    action_url?: string;
    is_read: boolean;
    metadata: Record<string, any>;
    created_at: string;
    read_at?: string;
    actor?: {
        id: string;
        username: string;
        display_name?: string;
        avatar_url?: string;
    };
}
