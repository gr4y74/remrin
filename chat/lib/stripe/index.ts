import Stripe from 'stripe';
import { SupabaseClient } from '@supabase/supabase-js';

// Initialize Stripe
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-12-15.clover',
    typescript: true,
});

/**
 * Get or create a Stripe customer for a user.
 * Stores the Stripe Customer ID in Supabase user metadata.
 * Note: Requires a Supabase client with admin privileges (Service Role) to update user metadata.
 */
export async function getOrCreateCustomer({
    supabase,
    userId,
    email,
    name,
}: {
    supabase: SupabaseClient;
    userId: string;
    email: string;
    name?: string;
}): Promise<string> {
    // 1. Check if user already has a stripe_customer_id in metadata
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);

    if (userError || !user) {
        throw new Error(`User not found: ${userError?.message || userId}`);
    }

    if (user.user_metadata?.stripe_customer_id) {
        // Optional: Verify customer exists in Stripe, but for efficiency we trust metadata usually
        return user.user_metadata.stripe_customer_id;
    }

    // 2. Create new customer in Stripe
    const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
            userId,
        },
    });

    // 3. Update Supabase user metadata
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: {
            stripe_customer_id: customer.id,
        },
    });

    if (updateError) {
        console.error('Error updating user metadata with stripe_customer_id:', updateError);
        // Proceed anyway, worst case we create a duplicate next time or reconcile later
    }

    return customer.id;
}

/**
 * Create a Stripe Checkout Session
 */
export async function createCheckoutSession({
    priceId,
    customerId,
    successUrl,
    cancelUrl,
    mode = 'subscription',
    metadata = {},
}: {
    priceId: string;
    customerId: string;
    successUrl: string;
    cancelUrl: string;
    mode?: Stripe.Checkout.SessionCreateParams.Mode;
    metadata?: Record<string, string>;
}) {
    const session = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        mode,
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata,
        allow_promotion_codes: true,
    });

    return session;
}

/**
 * Create a Stripe Customer Portal Session
 */
export async function createCustomerPortalSession({
    customerId,
    returnUrl,
}: {
    customerId: string;
    returnUrl: string;
}) {
    const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
    });

    return session;
}
