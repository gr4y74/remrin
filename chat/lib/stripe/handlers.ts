import { createAdminClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

export async function processStripeEvent(event: Stripe.Event) {
    const supabase = createAdminClient();

    switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
            await handleSubscriptionChange(event.data.object as Stripe.Subscription);
            break;

        case 'customer.subscription.deleted':
            await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
            break;

        case 'invoice.payment_succeeded':
            await handlePaymentSucceeded(invoiceToSubscription(event.data.object as any));
            break;

        case 'invoice.payment_failed':
            await handlePaymentFailed(invoiceToSubscription(event.data.object as any));
            break;

        default:
            console.log(`Unhandled event type: ${event.type}`);
    }
}

function invoiceToSubscription(invoice: any): string | null {
    return invoice.subscription as string || null;
}

export async function handleSubscriptionChange(subscription: Stripe.Subscription) {
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

    console.log(`Subscription ${subscription.id} updated for user ${wallet.user_id}`);
}

export async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const supabase = createAdminClient();

    // Update subscription status
    await supabase
        .from('subscriptions')
        .update({
            status: 'canceled',
            updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id);

    console.log(`Subscription ${subscription.id} canceled`);
}

export async function handlePaymentSucceeded(subscriptionId: string | null) {
    if (!subscriptionId) return;
    const supabase = createAdminClient();

    // Ensure subscription is marked as active
    await supabase
        .from('subscriptions')
        .update({
            status: 'active',
            updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);

    console.log(`Payment succeeded for subscription ${subscriptionId}`);
}

export async function handlePaymentFailed(subscriptionId: string | null) {
    if (!subscriptionId) return;
    const supabase = createAdminClient();

    // Mark subscription as past_due
    await supabase
        .from('subscriptions')
        .update({
            status: 'past_due',
            updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);

    console.log(`Payment failed for subscription ${subscriptionId}`);
}
