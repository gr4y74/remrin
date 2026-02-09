import { Database, Tables } from "@/supabase/types"
import { VALID_ENV_KEYS } from "@/types/valid-keys"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function getServerProfile() {
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

  const user = (await supabase.auth.getUser()).data.user
  if (!user) {
    throw new Error("User not found")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single()

  if (!profile) {
    throw new Error("Profile not found")
  }

  // Fetch global API keys from the secure api_keys table
  // Use service role client to bypass RLS for this internal check
  const serviceSupabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { get: () => undefined } }
  )

  const { data: globalKeys } = await serviceSupabase
    .from("api_keys" as any)
    .select("provider, api_key")

  const globalKeysMap: Record<string, string> = (globalKeys || []).reduce((acc: any, k: any) => {
    acc[k.provider] = k.api_key
    return acc
  }, {})

  const profileWithKeys = await addApiKeysToProfile(profile, globalKeysMap)

  return profileWithKeys
}

async function addApiKeysToProfile(profile: Tables<"profiles">, globalKeys: Record<string, string> = {}) {
  const apiKeys = {
    [VALID_ENV_KEYS.OPENAI_API_KEY]: { profileKey: "openai_api_key", provider: "openai" },
    [VALID_ENV_KEYS.ANTHROPIC_API_KEY]: { profileKey: "anthropic_api_key", provider: "anthropic" },
    [VALID_ENV_KEYS.GOOGLE_GEMINI_API_KEY]: { profileKey: "google_gemini_api_key", provider: "google" },
    [VALID_ENV_KEYS.MISTRAL_API_KEY]: { profileKey: "mistral_api_key", provider: "mistral" },
    [VALID_ENV_KEYS.GROQ_API_KEY]: { profileKey: "groq_api_key", provider: "groq" },
    [VALID_ENV_KEYS.PERPLEXITY_API_KEY]: { profileKey: "perplexity_api_key", provider: "perplexity" },
    [VALID_ENV_KEYS.AZURE_OPENAI_API_KEY]: { profileKey: "azure_openai_api_key", provider: "azure" },
    [VALID_ENV_KEYS.OPENROUTER_API_KEY]: { profileKey: "openrouter_api_key", provider: "openrouter" },
    [VALID_ENV_KEYS.DEEPSEEK_API_KEY]: { profileKey: "deepseek_api_key" as any, provider: "deepseek" },

    [VALID_ENV_KEYS.OPENAI_ORGANIZATION_ID]: { profileKey: "openai_organization_id" },

    [VALID_ENV_KEYS.AZURE_OPENAI_ENDPOINT]: { profileKey: "azure_openai_endpoint" },
    [VALID_ENV_KEYS.AZURE_GPT_35_TURBO_NAME]: { profileKey: "azure_openai_35_turbo_id" },
    [VALID_ENV_KEYS.AZURE_GPT_45_VISION_NAME]: { profileKey: "azure_openai_45_vision_id" },
    [VALID_ENV_KEYS.AZURE_GPT_45_TURBO_NAME]: { profileKey: "azure_openai_45_turbo_id" },
    [VALID_ENV_KEYS.AZURE_EMBEDDINGS_NAME]: { profileKey: "azure_openai_embeddings_id" }
  }

  for (const [envKey, config] of Object.entries(apiKeys)) {
    const { profileKey, provider } = config as any

    // Priority:
    // 1. User's own key in profile (if set)
    // 2. Global key from database (if set)
    // 3. Environment variable (if set)

    const userKey = (profile as any)[profileKey]
    const globalKey = provider ? globalKeys[provider] : null
    const envKeyVal = process.env[envKey]

    if (userKey) {
      // Keep user's custom key
    } else if (globalKey) {
      ; (profile as any)[profileKey] = globalKey
    } else if (envKeyVal) {
      ; (profile as any)[profileKey] = envKeyVal
    }
  }

  return profile
}

export function checkApiKey(apiKey: string | null, keyName: string) {
  if (apiKey === null || apiKey === "") {
    throw new Error(`${keyName} API Key not found`)
  }
}
