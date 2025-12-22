import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { syncSubscriptionStatus } from '@/lib/stripe/subscription'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-12-18.acacia' as any,
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(req: Request) {
    const body = await req.text()
    const signature = headers().get('stripe-signature') as string

    let event: Stripe.Event

    try {
        if (!signature || !webhookSecret) {
            console.error('Missing signature or webhook secret')
            return new NextResponse('Webhook error', { status: 400 })
        }
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`)
        return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 })
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session
                const userId = session.client_reference_id
                const customerId = session.customer as string

                if (!userId) {
                    console.log('No user_id found in checkout session')
                    break
                }

                // 1. Update user's wallet with stripe_customer_id
                await supabase
                    .from('wallets')
                    .update({ stripe_customer_id: customerId })
                    .eq('user_id', userId)

                // 2. Handle one-time payments for credits
                if (session.mode === 'payment' && session.metadata?.type === 'credit_pack') {
                    const amount = parseInt(session.metadata.credit_amount || '0')
                    const currency = session.metadata.credit_currency || 'aether' // 'aether' or 'brain'

                    if (amount > 0) {
                        const { data: wallet } = await supabase.from('wallets').select('*').eq('user_id', userId).single()
                        if (wallet) {
                            const currentBalance = currency === 'brain' ? wallet.balance_brain : wallet.balance_aether
                            const updateData = currency === 'brain'
                                ? { balance_brain: currentBalance + amount }
                                : { balance_aether: currentBalance + amount }

                            await supabase.from('wallets').update(updateData).eq('user_id', userId)
                            console.log(`Added ${amount} ${currency} to user ${userId}`)
                        }
                    }
                }
                break
            }

            case 'customer.subscription.created':
            case 'customer.subscription.updated':
            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription

                const customerId = subscription.customer as string

                // Find user by customer ID
                const { data: wallets } = await supabase
                    .from('wallets')
                    .select('user_id')
                    .eq('stripe_customer_id', customerId)

                let userId = wallets?.[0]?.user_id

                // Fallback: check subscription metadata - sometimes metadata travels
                if (!userId && subscription.metadata?.userId) {
                    userId = subscription.metadata.userId
                }

                if (userId) {
                    await syncSubscriptionStatus(userId, subscription.id)
                } else {
                    console.warn(`Could not find user for subscription ${subscription.id} (customer: ${customerId})`)
                }
                break
            }

            case 'invoice.payment_succeeded': {
                // Optional: handle recurring credit grants here
                break
            }

            default:
                console.log(`Unhandled event type ${event.type}`)
        }

        return new NextResponse('Webhook received', { status: 200 })
    } catch (error) {
        console.error('Webhook handler failed:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
