import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST() {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Sign out on the server side to properly clear cookies
    await supabase.auth.signOut()

    // Clear all Supabase auth cookies manually
    const allCookies = cookieStore.getAll()
    for (const cookie of allCookies) {
        if (cookie.name.includes('supabase') || cookie.name.includes('sb-')) {
            cookieStore.delete(cookie.name)
        }
    }

    return NextResponse.json({ success: true })
}
