import { createServerClient } from "@supabase/ssr"
import { Metadata } from "next"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { Database } from "@/supabase/types"
import LoginForm from "./login-form"
import { MOTHER_OF_SOULS_ID } from "@/lib/forge/is-mother-chat"

export const metadata: Metadata = {
  title: "Login"
}

export default async function Login({ params: { locale }, searchParams }: { params: { locale: string }, searchParams: { redirect?: string } }) {
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
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    const { data: homeWorkspace, error } = await supabase
      .from("workspaces")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("is_home", true)
      .single()

    if (!homeWorkspace) {
      // If no workspace but logged in, maybe it's still creating.
      // We can redirect to home and let GlobalState handle it.
      return redirect(`/${locale}`)
    }

    let target = `/${locale}/${homeWorkspace.id}/chat`
    if (searchParams.redirect === 'soul-forge') {
      target += `?persona=${MOTHER_OF_SOULS_ID}`
    } else if (searchParams.redirect && searchParams.redirect.startsWith('/')) {
      target = searchParams.redirect.startsWith(`/${locale}`) ? searchParams.redirect : `/${locale}${searchParams.redirect}`
    }

    return redirect(target)
  }


  return (
    <div className="from-background to-background/50 flex h-screen w-full flex-col items-center justify-center bg-gradient-to-br p-4">
      <LoginForm />
    </div>
  )
}
