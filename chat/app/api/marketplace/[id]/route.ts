import { createClient } from "@/lib/supabase/server"
import { getListingById, removeListing } from "@/lib/marketplace"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

interface RouteParams {
    params: {
        id: string
    }
}

/**
 * GET /api/marketplace/[id]
 * Get a single listing by ID with persona details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const cookieStore = cookies()
        const supabase = createClient(cookieStore)

        const { id } = params

        if (!id) {
            return NextResponse.json(
                { error: "Listing ID is required" },
                { status: 400 }
            )
        }

        const { data: listing, error } = await getListingById(supabase, id)

        if (error) {
            return NextResponse.json({ error }, { status: 500 })
        }

        if (!listing) {
            return NextResponse.json(
                { error: "Listing not found" },
                { status: 404 }
            )
        }

        return NextResponse.json(listing)
    } catch (error) {
        console.error("Marketplace listing API error:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/marketplace/[id]
 * Remove a listing (seller only)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

        const { id } = params

        if (!id) {
            return NextResponse.json(
                { error: "Listing ID is required" },
                { status: 400 }
            )
        }

        const { success, error } = await removeListing(supabase, user.id, id)

        if (!success) {
            const status = error === "Listing not found" ? 404 : 403
            return NextResponse.json({ error }, { status })
        }

        return NextResponse.json({ success: true, message: "Listing removed" })
    } catch (error) {
        console.error("Marketplace delete API error:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
