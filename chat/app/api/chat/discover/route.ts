import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/chat/discover - Get users and personas to add as buddies
export async function GET(request: NextRequest) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'all'; // 'users', 'personas', or 'all'
        const search = searchParams.get('search') || '';
        const limit = parseInt(searchParams.get('limit') || '20');

        let results: any[] = [];

        // Fetch users (excluding self and existing buddies)
        if (type === 'users' || type === 'all') {
            const { data: users, error: usersError } = await supabase
                .from('user_profiles')
                .select('user_id, username, display_name, avatar_url, bio')
                .neq('user_id', user.id)
                .ilike('username', `%${search}%`)
                .limit(limit);

            if (!usersError && users) {
                // Filter out existing buddies
                const { data: existingBuddies } = await supabase
                    .from('buddy_lists')
                    .select('buddy_id')
                    .eq('user_id', user.id);

                const existingBuddyIds = new Set(existingBuddies?.map(b => b.buddy_id) || []);

                results.push(...users
                    .filter(u => !existingBuddyIds.has(u.user_id))
                    .map(u => ({
                        id: u.user_id,
                        username: u.username,
                        display_name: u.display_name,
                        avatar_url: u.avatar_url,
                        bio: u.bio,
                        type: 'user'
                    }))
                );
            }
        }

        // Fetch personas
        if (type === 'personas' || type === 'all') {
            const { data: personas, error: personasError } = await supabase
                .from('personas')
                .select('id, name, tagline, image_url, creator_id')
                .eq('is_public', true)
                .ilike('name', `%${search}%`)
                .limit(limit);

            if (!personasError && personas) {
                // Filter out existing persona buddies
                const { data: existingBuddies } = await supabase
                    .from('buddy_lists')
                    .select('persona_id')
                    .eq('user_id', user.id)
                    .not('persona_id', 'is', null);

                const existingPersonaIds = new Set(existingBuddies?.map(b => b.persona_id) || []);

                results.push(...personas
                    .filter(p => !existingPersonaIds.has(p.id))
                    .map(p => ({
                        id: p.id,
                        username: p.name,
                        display_name: p.name,
                        avatar_url: p.image_url,
                        bio: p.tagline,
                        type: 'persona',
                        creator_id: p.creator_id
                    }))
                );
            }
        }

        return NextResponse.json({ results });
    } catch (error) {
        console.error('Discover API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/chat/discover/add - Add a user or persona as buddy
export async function POST(request: NextRequest) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { buddyId, buddyUsername, buddyType, personaId } = body;

        if (!buddyId || !buddyUsername || !buddyType) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Add to buddy list
        const { data: buddy, error: insertError } = await supabase
            .from('buddy_lists')
            .insert({
                user_id: user.id,
                buddy_id: buddyId,
                buddy_username: buddyUsername,
                buddy_type: buddyType,
                persona_id: personaId || null,
                group_name: buddyType === 'bot' ? 'AI Friends' : 'Friends',
                status: 'accepted'
            })
            .select()
            .single();

        if (insertError) {
            console.error('Error adding buddy:', insertError);
            return NextResponse.json({ error: 'Failed to add buddy' }, { status: 500 });
        }

        return NextResponse.json({ buddy }, { status: 201 });
    } catch (error) {
        console.error('Add buddy API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
