export interface UserProfile {
    id: string;
    user_id: string;
    username: string;
    display_name?: string;
    bio?: string;
    pronouns?: string;
    location?: string;
    website_url?: string;
    hero_image_url?: string;
    banner_url?: string;
    qr_code_url?: string;
    customization_json: ProfileCustomization;
    privacy_settings: PrivacySettings;
    created_at: string;
    updated_at: string;

    // Joined relations
    social_links?: SocialLink[];
    user_achievements?: UserAchievement[];
    featured_creations?: FeaturedCreation[];
}
export interface ProfileCustomization {
    theme?: string;
    primary_color?: string;
    accent_color?: string;
    background_style?: 'solid' | 'gradient' | 'pattern' | 'image';
    background_value?: string;
    font_family?: string;
    layout?: 'masonry' | 'grid' | 'list';
}
export interface PrivacySettings {
    profile: 'public' | 'friends' | 'private';
    analytics: 'public' | 'friends' | 'private';
    badges: 'public' | 'friends' | 'private';
}
export interface Achievement {
    id: string;
    badge_id: string;
    name: string;
    description?: string;
    icon: string;
    color_gradient: string;
    category: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    criteria_json: Record<string, any>;
    is_active: boolean;
    created_at: string;
}
export interface UserAchievement {
    id: string;
    user_id: string;
    achievement_id: string;
    achievement?: Achievement;
    earned_date: string;
    is_displayed: boolean;
    display_order: number;
}
export interface SocialLink {
    id: string;
    user_id: string;
    platform: string;
    handle?: string;
    url: string;
    display_order: number;
}
export interface FeaturedCreation {
    id: string;
    user_id: string;
    persona_id: string;
    display_order: number;
    created_at: string;

    // Joined relations
    persona?: any; // You can replace 'any' with the proper Persona type if available
}
