import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { createCheckoutSession, getOrCreateCustomer } from "@/lib/stripe"
import { createClient as createAdminClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
    try {
        const cookieStore = cookies()
        const supabase = createClient(cookieStore)
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const body = await request.json()
        const { priceId, isSubscription = true } = body

        if (!priceId) {
            return new NextResponse("Price ID is required", { status: 400 })
        }

        // Initialize admin client to update user metadata
        const supabaseAdmin = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const customerId = await getOrCreateCustomer({
            supabase: supabaseAdmin,
            userId: user.id,
            email: user.email!,
            name: user.user_metadata?.full_name || user.email // Fallback for name
        })

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

        const checkoutSession = await createCheckoutSession({
            priceId,
            customerId,
            successUrl: `${appUrl}/?payment_success=true`, // Adjust as needed
            cancelUrl: `${appUrl}/?payment_cancelled=true`,
            mode: isSubscription ? 'subscription' : 'payment',
            metadata: {
                userId: user.id
            }
        })

        return NextResponse.json({ sessionId: checkoutSession.id, url: checkoutSession.url })
    } catch (error: any) {
        console.error("Error in checkout route:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
