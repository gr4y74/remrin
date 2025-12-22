import { createClient } from "@/lib/supabase/server"
import { createListing } from "@/lib/marketplace"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

interface CreateListingBody {
    persona_id: string
    price_aether: number
    is_limited?: boolean
    quantity?: number
}

/**
 * POST /api/marketplace/list
 * Create a new marketplace listing
 * Body: { persona_id, price_aether, is_limited?, quantity? }
 */
export async function POST(request: NextRequest) {
    try {
        const cookieStore = cookies()
        const supabase = createClient(cookieStore)

        // Authenticate user
        const {
            data: { user },
            error: authError
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Parse request body
        const body: CreateListingBody = await request.json()

        // Validate required fields
        if (!body.persona_id) {
            return NextResponse.json(
                { error: "persona_id is required" },
                { status: 400 }
            )
        }

        if (!body.price_aether || body.price_aether <= 0) {
            return NextResponse.json(
                { error: "price_aether must be a positive number" },
                { status: 400 }
            )
        }

        // Create the listing
        const { data: listing, error } = await createListing(supabase, user.id, {
            persona_id: body.persona_id,
            price_aether: body.price_aether,
            is_limited_edition: body.is_limited || false,
            quantity: body.quantity
        })

        if (error) {
            // Determine appropriate status code based on error
            let status = 500
            if (
                error === "You can only list your own personas" ||
                error === "This persona already has an active listing"
            ) {
                status = 400
            } else if (error === "Persona not found") {
                status = 404
            }

            return NextResponse.json({ error }, { status })
        }

        return NextResponse.json(
            {
                success: true,
                listing,
                message: "Listing created successfully"
            },
            { status: 201 }
        )
    } catch (error) {
        console.error("Marketplace list API error:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
