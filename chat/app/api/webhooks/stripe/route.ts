import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import Stripe from 'stripe';
import { processStripeEvent } from '@/lib/stripe/handlers';

// Lazy initialization to avoid build-time errors
let _stripe: Stripe | null = null;
function getStripe(): Stripe {
    if (!_stripe) {
        _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
            apiVersion: '2025-12-15.clover' as any,
        });
    }
    return _stripe;
}

function getWebhookSecret(): string {
    return process.env.STRIPE_WEBHOOK_SECRET!;
}

// POST /api/webhooks/stripe - Handle Stripe webhook events
export async function POST(req: NextRequest) {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
        return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = getStripe().webhooks.constructEvent(body, signature, getWebhookSecret());
    } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Log webhook event
    await supabase.from('stripe_webhook_events').insert({
        event_id: event.id,
        event_type: event.type,
        payload: event.data.object as any,
        processed: false
    });

    try {
        await processStripeEvent(event);

        // Mark event as processed
        await supabase
            .from('stripe_webhook_events')
            .update({ processed: true })
            .eq('event_id', event.id);

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error('Webhook processing error:', error);

        // Log error
        await supabase
            .from('stripe_webhook_events')
            .update({
                processed: false,
                error_message: error.message
            })
            .eq('event_id', event.id);

        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
