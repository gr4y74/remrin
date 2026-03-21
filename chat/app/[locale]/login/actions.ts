"use server"

import { createClient } from "@/lib/supabase/server"
import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"
import { ensureHomeWorkspace } from "@/lib/auth/workspace"

export const login = async (formData: FormData, redirectTo?: string, locale: string = 'en') => {
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    })

    if (error) {
        return { error: error.message }
    }

    let homeWorkspace;
    try {
        homeWorkspace = await ensureHomeWorkspace(supabase, data.user.id)
    } catch (e: any) {
        return { error: e.message }
    }

    // Default redirect to discover/homepage
    let target = `/${locale}`

    // Special case for Soul Forge
    if (redirectTo === 'soul-forge') {
        target = `/${locale}/${homeWorkspace.id}/chat?persona=a0000000-0000-0000-0000-000000000001`
    } else if (redirectTo && redirectTo.startsWith('/')) {
        // If it already has a starting slash, check if it has locale
        target = redirectTo.startsWith(`/${locale}`) ? redirectTo : `/${locale}${redirectTo}`
    }

    return { redirect: target }
}

