import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        const { data: { user } } = await supabase.auth.getUser();

        // 1. Get IDs of users already followed
        let followedUserIds: string[] = [];
        if (user) {
            const { data: followed } = await supabase
                .from('user_follows')
                .select('following_id')
                .eq('follower_id', user.id);
            followedUserIds = followed?.map(f => f.following_id) || [];
            followedUserIds.push(user.id); // Exclude self
        }

        // 2. Fetch all follows to aggregate counts manually
        const { data: followStats, error: statsError } = await supabase
            .from('user_follows')
            .select('following_id');

        if (statsError) {
            console.error('Error fetching follow stats:', statsError);
            return NextResponse.json({ error: 'Failed to fetch follow stats' }, { status: 500 });
        }

        // Aggregate counts manually
        const counts: Record<string, number> = {};
        (followStats || []).forEach(f => {
            counts[f.following_id] = (counts[f.following_id] || 0) + 1;
        });

        // Sort by count and filter excluded IDs
        const sortedUserIds = Object.keys(counts)
            .filter(id => !followedUserIds.includes(id))
            .sort((a, b) => counts[b] - counts[a])
            .slice(0, 5);

        // 3. Fetch profile data for these users
        let suggestedUsers: any[] = [];
        if (sortedUserIds.length > 0) {
            const { data: profiles } = await supabase
                .from('user_profiles')
                .select('user_id, username, display_name, hero_image_url, bio')
                .in('user_id', sortedUserIds);

            if (profiles) {
                suggestedUsers = profiles.map(p => ({
                    ...p,
                    follower_count: counts[p.user_id] || 0
                })).sort((a, b) => b.follower_count - a.follower_count);
            }
        }

        // 4. Fill with more users if we don't have enough from follows
        if (suggestedUsers.length < 5) {
            const currentIds = [...followedUserIds, ...suggestedUsers.map(u => u.user_id)];

            try {
                let extraProfiles: any[] = [];

                if (currentIds.length > 0) {
                    // Use filter to exclude current IDs
                    const { data, error } = await supabase
                        .from('user_profiles')
                        .select('user_id, username, display_name, hero_image_url, bio')
                        .limit(5 - suggestedUsers.length);

                    if (!error && data) {
                        extraProfiles = data.filter(p => !currentIds.includes(p.user_id));
                    }
                } else {
                    const { data, error } = await supabase
                        .from('user_profiles')
                        .select('user_id, username, display_name, hero_image_url, bio')
                        .limit(5);

                    if (!error && data) {
                        extraProfiles = data;
                    }
                }

                if (extraProfiles.length > 0) {
                    suggestedUsers = [...suggestedUsers, ...extraProfiles.map(p => ({ ...p, follower_count: 0 }))];
                }
            } catch (err) {
                console.error('Error fetching extra profiles:', err);
            }
        }

        return NextResponse.json({ users: suggestedUsers });
    } catch (error) {
        console.error('Error in GET /api/users/suggested:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
