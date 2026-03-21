import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next")

  if (code) {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && session?.user) {
      const user = session.user

      // 1. Check/Create Profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (!profile) {
        // Create new profile
        const metadata = user.user_metadata
        const username = metadata.name?.replace(/\s+/g, '').toLowerCase().substring(0, 20) ||
          metadata.email?.split('@')[0] ||
          `user_${Math.random().toString(36).substring(2, 10)}`

        await supabase.from("profiles").insert({
          user_id: user.id,
          username: username,
          display_name: metadata.name || metadata.email?.split('@')[0] || "User",
          image_url: metadata.picture || "",
          image_path: "",
          bio: "",
          profile_context: "",
          use_azure_openai: false,
          has_onboarded: false // Trigger onboarding if needed
        })
      }

      // 2. Check/Create Wallet
      // Even with the trigger, we double check here to be safe given the critical requirement
      const { data: wallet } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (!wallet) {
        await supabase.from("wallets").insert({
          user_id: user.id,
          balance_aether: 100, // Default aether
          balance_brain: 1000,
          is_creator: false
        })
      }

      // 3. Check/Create Home Workspace
      const { data: homeWorkspace } = await supabase
        .from("workspaces")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_home", true)
        .single()

      if (!homeWorkspace) {
        // Fetch highest priority model from config
        const { data: defaultConfig } = await supabase
          .from("llm_config")
          .select("model_id")
          .order("priority", { ascending: false })
          .limit(1)
          .maybeSingle()

        const defaultModel = defaultConfig?.model_id || "gpt-4o-mini"

        // Create default home workspace
        await supabase.from("workspaces").insert({
          user_id: user.id,
          name: "Home",
          is_home: true,
          default_context_length: 4096,
          default_model: defaultModel,
          embeddings_provider: "openai"
        })
      }
    }
  }

  if (next) {
    return NextResponse.redirect(requestUrl.origin + next)
  } else {
    return NextResponse.redirect(requestUrl.origin)
  }
}
