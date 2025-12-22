"use server"

import { createClient } from "@/lib/supabase/server"
import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"
import { get } from "@vercel/edge-config"

async function getEnvVarOrEdgeConfigValue(name: string) {
    if (process.env.EDGE_CONFIG) {
        try {
            return await get<string>(name)
        } catch (e) {
            console.error(`Failed to get edge config value for ${name}`, e)
        }
    }
    return process.env[name]
}

export const signup = async (formData: FormData) => {
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const displayName = formData.get("displayName") as string

    // Whitelist check
    const emailDomainWhitelistPatternsString = await getEnvVarOrEdgeConfigValue(
        "EMAIL_DOMAIN_WHITELIST"
    )
    const emailDomainWhitelist = emailDomainWhitelistPatternsString?.trim()
        ? emailDomainWhitelistPatternsString?.split(",")
        : []
    const emailWhitelistPatternsString =
        await getEnvVarOrEdgeConfigValue("EMAIL_WHITELIST")
    const emailWhitelist = emailWhitelistPatternsString?.trim()
        ? emailWhitelistPatternsString?.split(",")
        : []

    if (emailDomainWhitelist.length > 0 || emailWhitelist.length > 0) {
        const domainMatch = emailDomainWhitelist?.includes(email.split("@")[1])
        const emailMatch = emailWhitelist?.includes(email)
        if (!domainMatch && !emailMatch) {
            return { error: `Email ${email} is not allowed to sign up.` }
        }
    }

    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const origin = headers().get("origin")

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                display_name: displayName || email.split("@")[0]
            },
            emailRedirectTo: `${origin}/auth/callback`
        }
    })

    if (error) {
        return { error: error.message }
    }

    // If email verification is enabled, Supabase returns a session as null (usually) 
    // or we might need to tell user to check email.
    // The original code redirected to /setup immediately, which implies maybe no verification?
    // But the prompt says "Toast notification: Check your email to verify"

    return { message: "Check your email to verify your account." }
}
