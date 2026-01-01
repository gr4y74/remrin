"use server"

import { createClient } from "@/lib/supabase/server"
import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"

export const login = async (formData: FormData, redirectTo?: string) => {
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

    const { data: homeWorkspace, error: homeWorkspaceError } = await supabase
        .from("workspaces")
        .select("*")
        .eq("user_id", data.user.id)
        .eq("is_home", true)
        .single()

    if (!homeWorkspace) {
        return { error: homeWorkspaceError?.message || "No home workspace found" }
    }

    // Default redirect to home chat
    let target = `/${homeWorkspace.id}/chat`

    // Special case for Soul Forge
    if (redirectTo === 'soul-forge') {
        target = `/${homeWorkspace.id}/chat?persona=a0000000-0000-0000-0000-000000000001`
    } else if (redirectTo && redirectTo.startsWith('/')) {
        target = redirectTo
    }

    return { redirect: target }
}
