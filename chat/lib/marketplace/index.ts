import { SupabaseClient } from "@supabase/supabase-js"

export interface MarketListing {
    id: string
    seller_id: string
    persona_id: string
    price_aether: number
    is_limited_edition: boolean
    quantity_remaining: number | null
    total_sales: number
    is_active: boolean
    created_at: string
    updated_at: string
}

export interface MarketListingWithPersona extends MarketListing {
    personas: {
        id: string
        name: string
        description: string
        image_path: string | null
        user_id: string
    }
}

export interface ListingFilters {
    category?: string
    sort?: "price" | "popular" | "newest"
    sellerId?: string
    limit?: number
    offset?: number
}

export interface CreateListingData {
    persona_id: string
    price_aether: number
    is_limited_edition?: boolean
    quantity?: number
}

/**
 * Get all active marketplace listings with persona details
 */
export async function getActiveListings(
    supabase: SupabaseClient,
    filters: ListingFilters = {}
): Promise<{ data: MarketListingWithPersona[]; error: string | null }> {
    const { sort = "newest", limit = 50, offset = 0 } = filters

    let query = supabase
        .from("market_listings")
        .select(
            `
            *,
            personas:persona_id (
                id,
                name,
                description,
                image_path,
                user_id
            )
        `
        )
        .eq("is_active", true)
        .range(offset, offset + limit - 1)

    // Apply sorting
    switch (sort) {
        case "price":
            query = query.order("price_aether", { ascending: true })
            break
        case "popular":
            query = query.order("total_sales", { ascending: false })
            break
        case "newest":
        default:
            query = query.order("created_at", { ascending: false })
            break
    }

    const { data, error } = await query

    if (error) {
        console.error("Error fetching listings:", error)
        return { data: [], error: error.message }
    }

    return { data: data as MarketListingWithPersona[], error: null }
}

/**
 * Get a single listing by ID with persona details
 */
export async function getListingById(
    supabase: SupabaseClient,
    listingId: string
): Promise<{ data: MarketListingWithPersona | null; error: string | null }> {
    const { data, error } = await supabase
        .from("market_listings")
        .select(
            `
            *,
            personas:persona_id (
                id,
                name,
                description,
                image_path,
                user_id
            )
        `
        )
        .eq("id", listingId)
        .single()

    if (error) {
        console.error("Error fetching listing:", error)
        return { data: null, error: error.message }
    }

    return { data: data as MarketListingWithPersona, error: null }
}

/**
 * Create a new marketplace listing
 */
export async function createListing(
    supabase: SupabaseClient,
    sellerId: string,
    data: CreateListingData
): Promise<{ data: MarketListing | null; error: string | null }> {
    // Validate price
    if (data.price_aether <= 0) {
        return { data: null, error: "Price must be greater than 0" }
    }

    // Validate limited edition quantity
    if (data.is_limited_edition && (!data.quantity || data.quantity <= 0)) {
        return {
            data: null,
            error: "Limited editions must have a positive quantity"
        }
    }

    // Check if persona already has a listing
    const { data: existingListing } = await supabase
        .from("market_listings")
        .select("id")
        .eq("persona_id", data.persona_id)
        .single()

    if (existingListing) {
        return { data: null, error: "This persona already has an active listing" }
    }

    // Verify the seller owns this persona
    const { data: persona, error: personaError } = await supabase
        .from("personas")
        .select("user_id")
        .eq("id", data.persona_id)
        .single()

    if (personaError || !persona) {
        return { data: null, error: "Persona not found" }
    }

    if (persona.user_id !== sellerId) {
        return { data: null, error: "You can only list your own personas" }
    }

    // Create the listing
    const { data: listing, error } = await supabase
        .from("market_listings")
        .insert({
            seller_id: sellerId,
            persona_id: data.persona_id,
            price_aether: data.price_aether,
            is_limited_edition: data.is_limited_edition || false,
            quantity_remaining: data.is_limited_edition ? data.quantity : null
        })
        .select("*")
        .single()

    if (error) {
        console.error("Error creating listing:", error)
        return { data: null, error: error.message }
    }

    return { data: listing as MarketListing, error: null }
}

/**
 * Remove a marketplace listing (deactivate it)
 */
export async function removeListing(
    supabase: SupabaseClient,
    sellerId: string,
    listingId: string
): Promise<{ success: boolean; error: string | null }> {
    // Check if the listing exists and belongs to the seller
    const { data: listing, error: fetchError } = await supabase
        .from("market_listings")
        .select("seller_id")
        .eq("id", listingId)
        .single()

    if (fetchError || !listing) {
        return { success: false, error: "Listing not found" }
    }

    if (listing.seller_id !== sellerId) {
        return { success: false, error: "You can only remove your own listings" }
    }

    // Deactivate the listing (soft delete)
    const { error } = await supabase
        .from("market_listings")
        .update({ is_active: false })
        .eq("id", listingId)

    if (error) {
        console.error("Error removing listing:", error)
        return { success: false, error: error.message }
    }

    return { success: true, error: null }
}

/**
 * Get listings by seller
 */
export async function getListingsBySeller(
    supabase: SupabaseClient,
    sellerId: string,
    includeInactive: boolean = false
): Promise<{ data: MarketListingWithPersona[]; error: string | null }> {
    let query = supabase
        .from("market_listings")
        .select(
            `
            *,
            personas:persona_id (
                id,
                name,
                description,
                image_path,
                user_id
            )
        `
        )
        .eq("seller_id", sellerId)
        .order("created_at", { ascending: false })

    if (!includeInactive) {
        query = query.eq("is_active", true)
    }

    const { data, error } = await query

    if (error) {
        console.error("Error fetching seller listings:", error)
        return { data: [], error: error.message }
    }

    return { data: data as MarketListingWithPersona[], error: null }
}

/**
 * Increment total sales count for a listing
 */
export async function incrementListingSales(
    supabase: SupabaseClient,
    listingId: string
): Promise<{ success: boolean; error: string | null }> {
    const { data: listing, error: fetchError } = await supabase
        .from("market_listings")
        .select("total_sales, is_limited_edition, quantity_remaining")
        .eq("id", listingId)
        .single()

    if (fetchError || !listing) {
        return { success: false, error: "Listing not found" }
    }

    const updates: Record<string, unknown> = {
        total_sales: listing.total_sales + 1
    }

    // Handle limited edition quantity
    if (listing.is_limited_edition && listing.quantity_remaining !== null) {
        if (listing.quantity_remaining <= 0) {
            return { success: false, error: "Sold out" }
        }
        updates.quantity_remaining = listing.quantity_remaining - 1

        // Deactivate if sold out
        if (listing.quantity_remaining === 1) {
            updates.is_active = false
        }
    }

    const { error } = await supabase
        .from("market_listings")
        .update(updates)
        .eq("id", listingId)

    if (error) {
        console.error("Error incrementing sales:", error)
        return { success: false, error: error.message }
    }

    return { success: true, error: null }
}
