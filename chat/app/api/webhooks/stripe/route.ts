import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

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
        switch (event.type) {
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
                await handleSubscriptionChange(event.data.object as Stripe.Subscription);
                break;

            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
                break;

            case 'invoice.payment_succeeded':
                await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
                break;

            case 'invoice.payment_failed':
                await handlePaymentFailed(event.data.object as Stripe.Invoice);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

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

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
    const supabase = createAdminClient();

    // Get user ID from customer
    const { data: wallet } = await supabase
        .from('wallets')
        .select('user_id')
        .eq('stripe_customer_id', subscription.customer as string)
        .single();

    if (!wallet) {
        console.error('No wallet found for customer:', subscription.customer);
        return;
    }

    const priceId = subscription.items.data[0]?.price.id;
    if (!priceId) {
        console.error('No price ID found in subscription');
        return;
    }

    // Update or create subscription record
    await supabase.from('subscriptions').upsert({
        id: subscription.id,
        user_id: wallet.user_id,
        status: subscription.status,
        price_id: priceId,
        current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
    });

    // The database trigger will automatically update the tier
    console.log(`Subscription ${subscription.id} updated for user ${wallet.user_id}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const supabase = createAdminClient();

    // Update subscription status
    await supabase
        .from('subscriptions')
        .update({
            status: 'canceled',
            updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id);

    // The database trigger will automatically downgrade to wanderer tier
    console.log(`Subscription ${subscription.id} canceled`);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
    const supabase = createAdminClient();

    if (!(invoice as any).subscription) return;

    // Ensure subscription is marked as active
    await supabase
        .from('subscriptions')
        .update({
            status: 'active',
            updated_at: new Date().toISOString()
        })
        .eq('id', (invoice as any).subscription as string);

    console.log(`Payment succeeded for subscription ${(invoice as any).subscription}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
    const supabase = createAdminClient();

    if (!(invoice as any).subscription) return;

    // Mark subscription as past_due
    await supabase
        .from('subscriptions')
        .update({
            status: 'past_due',
            updated_at: new Date().toISOString()
        })
        .eq('id', (invoice as any).subscription as string);

    // The database trigger will automatically downgrade tier
    console.log(`Payment failed for subscription ${(invoice as any).subscription}`);
}
