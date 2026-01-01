import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/errors"

export async function POST() {
    try {
        const cookieStore = cookies()
        const supabase = createClient(cookieStore)

        // Sign out on the server side
        const { error } = await supabase.auth.signOut()

        if (error) {
            console.error("Sign out error:", error)
        }

        // Create response
        const response = NextResponse.json({ success: true })

        // Get all cookies and delete Supabase ones
        const allCookies = cookieStore.getAll()
        for (const cookie of allCookies) {
            if (cookie.name.includes('sb-') ||
                cookie.name.includes('supabase') ||
                cookie.name.includes('auth-token')) {
                // Set cookie to expire immediately
                response.cookies.set(cookie.name, '', {
                    path: '/',
                    expires: new Date(0),
                    maxAge: 0
                })
            }
        }

        return response
    } catch (error) {
        return handleApiError(error)
    }
}
