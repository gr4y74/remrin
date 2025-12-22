import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { createCustomerPortalSession } from "@/lib/stripe"

export async function POST(request: Request) {
    try {
        const cookieStore = cookies()
        const supabase = createClient(cookieStore)
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const stripeCustomerId = user.user_metadata?.stripe_customer_id

        if (!stripeCustomerId) {
            return new NextResponse("No Stripe customer found", { status: 400 })
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

        const session = await createCustomerPortalSession({
            customerId: stripeCustomerId,
            returnUrl: `${appUrl}/settings` // Redirect back to settings usually
        })

        return NextResponse.json({ url: session.url })
    } catch (error: any) {
        console.error("Error in portal route:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
