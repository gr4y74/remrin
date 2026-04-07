import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value }
        }
      }
    )

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { community_id, action } = body;

    if (action === 'join') {
      await supabase.from('sudododo_memberships').insert({
        user_id: session.user.id,
        community_id
      })
    } else {
      await supabase.from('sudododo_memberships').delete()
        .eq('user_id', session.user.id)
        .eq('community_id', community_id)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("[JoinAPI] Error:", error)
    return NextResponse.json({ error: "Membership update failed" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const communityId = searchParams.get('communityId')
  const userId = searchParams.get('userId')

  if (!communityId || !userId) return NextResponse.json({ isMember: false })

  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value }
      }
    }
  )

  const { data } = await supabase
    .from('sudododo_memberships')
    .select('id')
    .eq('user_id', userId)
    .eq('community_id', communityId)
    .single();

  return NextResponse.json({ isMember: !!data })
}
