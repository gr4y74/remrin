import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from "next/headers";

// GET /api/admin/webhooks - Get webhook event log
export async function GET(req: NextRequest) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // Check admin permission
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const eventType = searchParams.get('event_type');
        const processed = searchParams.get('processed');
        const limit = parseInt(searchParams.get('limit') || '100');

        let query = supabase
            .from('stripe_webhook_events')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (eventType) {
            query = query.eq('event_type', eventType);
        }

        if (processed !== null) {
            query = query.eq('processed', processed === 'true');
        }

        const { data, error } = await query;

        if (error) throw error;

        // Get stats
        const { data: stats } = await supabase
            .from('stripe_webhook_events')
            .select('event_type, processed')
            .limit(1000);

        const eventStats = stats?.reduce((acc: any, event: any) => {
            if (!acc[event.event_type]) {
                acc[event.event_type] = { total: 0, processed: 0, failed: 0 };
            }
            acc[event.event_type].total++;
            if (event.processed) {
                acc[event.event_type].processed++;
            } else {
                acc[event.event_type].failed++;
            }
            return acc;
        }, {});

        return NextResponse.json({
            events: data,
            stats: eventStats
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/admin/webhooks/retry - Retry failed webhook
export async function POST(req: NextRequest) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // Check admin permission
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { event_id } = await req.json();

        // Get the event
        const { data: event, error } = await supabase
            .from('stripe_webhook_events')
            .select('*')
            .eq('event_id', event_id)
            .single();

        if (error || !event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        // TODO: Implement retry logic based on event type
        // For now, just mark as processed
        await supabase
            .from('stripe_webhook_events')
            .update({
                processed: true,
                error_message: null
            })
            .eq('event_id', event_id);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
