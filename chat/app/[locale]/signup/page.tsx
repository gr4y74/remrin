import { createServerClient } from "@supabase/ssr"
import { Metadata } from "next"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { Database } from "@/supabase/types"
import SignupForm from "./signup-form"

export const metadata: Metadata = {
    title: "Sign Up"
}

export default async function Signup() {
    const cookieStore = cookies()
    const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                }
            }
        }
    )
    const session = (await supabase.auth.getSession()).data.session

    if (session) {
        const { data: homeWorkspace, error } = await supabase
            .from("workspaces")
            .select("*")
            .eq("user_id", session.user.id)
            .eq("is_home", true)
            .single()

        if (!homeWorkspace) {
            throw new Error(error.message)
        }

        return redirect(`/${homeWorkspace.id}/chat`)
    }

    return (
        <div className="from-background to-background/50 flex h-screen w-full flex-col items-center justify-center bg-gradient-to-br p-4">
            <SignupForm />
        </div>
    )
}
