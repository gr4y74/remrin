import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-12-18.acacia' as any,
})

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export type Tier = 'wanderer' | 'soul_weaver' | 'architect' | 'titan'

export const mapPriceIdToTier = (priceId: string): Tier => {
    const mapping: Record<string, Tier> = {
        [process.env.STRIPE_PRICE_ID_WANDERER!]: 'wanderer',
        [process.env.STRIPE_PRICE_ID_SOUL_WEAVER!]: 'soul_weaver',
        [process.env.STRIPE_PRICE_ID_ARCHITECT!]: 'architect',
        [process.env.STRIPE_PRICE_ID_TITAN!]: 'titan',
    }
    return mapping[priceId] || 'wanderer'
}

export const syncSubscriptionStatus = async (userId: string, subscriptionId: string) => {
    try {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)

        // Upsert subscription to DB
        const { error: subError } = await supabase
            .from('subscriptions')
            .upsert({
                id: subscription.id,
                user_id: userId,
                status: subscription.status,
                price_id: subscription.items.data[0].price.id,
                current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
                updated_at: new Date().toISOString()
            })

        if (subError) {
            console.error('Error syncing subscription:', subError)
            throw subError
        }

        // Update wallet tier
        const priceId = subscription.items.data[0].price.id
        const tier = mapPriceIdToTier(priceId)

        // Calculate expiration logic if needed, usually matches current_period_end
        const expiresAt = new Date((subscription as any).current_period_end * 1000).toISOString()

        const { error: walletError } = await supabase
            .from('wallets')
            .update({
                tier: tier,
                tier_expires_at: expiresAt,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)

        if (walletError) {
            console.error('Error updating wallet tier:', walletError)
            throw walletError
        }

        console.log(`Synced subscription ${subscriptionId} for user ${userId}. Tier set to ${tier}.`)
        return { success: true, tier }

    } catch (error) {
        console.error('Failed to sync subscription status:', error)
        return { success: false, error }
    }
}
