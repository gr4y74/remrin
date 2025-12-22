"use server"

import { createClient } from "@/lib/supabase/server"
import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"

export const login = async (formData: FormData) => {
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
        // If no workspace found, maybe just redirect to setup or handle error
        return { error: homeWorkspaceError?.message || "No home workspace found" }
    }

    return { redirect: `/${homeWorkspace.id}/chat` }
}
