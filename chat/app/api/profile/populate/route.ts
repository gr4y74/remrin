import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Create sample achievements if they don't exist
        const sampleAchievements = [
            {
                name: 'First Steps',
                description: 'Created your first character',
                icon: '🎭',
                rarity: 'common',
                color_gradient: '#4A90E2 #2E5C8A',
                criteria_json: { type: 'character_count', value: 1 }
            },
            {
                name: 'Character Creator',
                description: 'Created 5 characters',
                icon: '✨',
                rarity: 'rare',
                color_gradient: '#9B59B6 #6C3483',
                criteria_json: { type: 'character_count', value: 5 }
            },
            {
                name: 'Master Creator',
                description: 'Created 10 characters',
                icon: '🌟',
                rarity: 'epic',
                color_gradient: '#E74C3C #C0392B',
                criteria_json: { type: 'character_count', value: 10 }
            },
            {
                name: 'Profile Complete',
                description: 'Filled out your complete profile',
                icon: '📝',
                rarity: 'common',
                color_gradient: '#27AE60 #1E8449',
                criteria_json: { type: 'profile_complete' }
            },
            {
                name: 'Social Butterfly',
                description: 'Added 3 social links',
                icon: '🦋',
                rarity: 'rare',
                color_gradient: '#3498DB #2874A6',
                criteria_json: { type: 'social_links', value: 3 }
            },
            {
                name: 'Early Adopter',
                description: 'Joined during beta',
                icon: '🚀',
                rarity: 'legendary',
                color_gradient: '#F39C12 #D68910',
                criteria_json: { type: 'early_adopter' }
            }
        ];

        for (const achievement of sampleAchievements) {
            await supabase
                .from('achievements')
                .upsert(achievement, { onConflict: 'name', ignoreDuplicates: true });
        }

        // 2. Update user_profiles with sample data
        await supabase
            .from('user_profiles')
            .update({
                bio: 'AI enthusiast and character creator. Building the future of conversational AI, one persona at a time. 🤖✨',
                pronouns: 'MALE',
                location: 'San Francisco, CA',
                website_url: 'https://remrin.ai',
                banner_url: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1500&h=500&fit=crop'
            })
            .eq('user_id', user.id);

        // 3. Get all achievements
        const { data: achievements } = await supabase
            .from('achievements')
            .select('id')
            .limit(5);

        // 4. Award achievements to user
        if (achievements) {
            for (let i = 0; i < achievements.length; i++) {
                await supabase
                    .from('user_achievements')
                    .upsert({
                        user_id: user.id,
                        achievement_id: achievements[i].id,
                        earned_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
                        is_displayed: true,
                        display_order: i
                    }, { onConflict: 'user_id,achievement_id', ignoreDuplicates: true });
            }
        }

        // 5. Add social links
        const socialLinks = [
            { platform: 'github', url: 'https://github.com/remrin', handle: '@remrin', display_order: 0 },
            { platform: 'twitter', url: 'https://twitter.com/remrin', handle: '@remrin', display_order: 1 },
            { platform: 'discord', url: 'https://discord.gg/remrin', handle: 'remrin#1234', display_order: 2 }
        ];

        for (const link of socialLinks) {
            await supabase
                .from('social_links')
                .upsert({ user_id: user.id, ...link }, { onConflict: 'user_id,platform' });
        }

        // 6. Get user's personas for featured creations
        const { data: personas } = await supabase
            .from('personas')
            .select('id')
            .eq('user_id', user.id)
            .limit(6);

        // 7. Feature the personas
        if (personas && personas.length > 0) {
            for (let i = 0; i < personas.length; i++) {
                await supabase
                    .from('featured_creations')
                    .upsert({
                        user_id: user.id,
                        persona_id: personas[i].id,
                        display_order: i
                    }, { onConflict: 'user_id,persona_id', ignoreDuplicates: true });
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Profile populated successfully!',
            stats: {
                achievements: achievements?.length || 0,
                socialLinks: socialLinks.length,
                featuredCreations: personas?.length || 0
            }
        });
    } catch (error) {
        console.error('Error populating profile:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
