import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export type VoteResult = {
  score: number
  userVote: 1 | -1 | null
}

const getSupabase = () => {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value }
      }
    }
  )
}

/**
 * Job 2 Logic: castVote
 * Handles the logic for upvoting/downvoting/toggling
 */
export async function castVote(postId: string, value: 1 | -1): Promise<VoteResult> {
  const supabase = getSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) throw new Error("Unauthorized")

  const userId = session.user.id

  // 1. Check existing vote
  const { data: existing } = await supabase
    .from('sudododo_votes')
    .select('value')
    .eq('user_id', userId)
    .eq('post_id', postId)
    .single()

  if (existing) {
    if (existing.value === value) {
      // Toggle off (Delete)
      await supabase.from('sudododo_votes').delete().eq('user_id', userId).eq('post_id', postId)
    } else {
      // Switch direction (Update)
      await supabase.from('sudododo_votes').update({ value }).eq('user_id', userId).eq('post_id', postId)
    }
  } else {
    // New vote (Insert)
    await supabase.from('sudododo_votes').insert({ user_id: userId, post_id: postId, value })
  }

  // 2. Return new state
  return getVoteState(postId)
}

/**
 * getVoteState
 * Fetches the current total score and current user's vote for a post
 */
export async function getVoteState(postId: string): Promise<VoteResult> {
  const supabase = getSupabase()
  const { data: { session } } = await supabase.auth.getSession()

  // Fetch score using the RPC function we defined in the migration
  const { data: scoreData } = await supabase.rpc('get_sudododo_vote_score', { p_post_id: postId })
  
  let userVote = null
  if (session) {
    const { data: voteData } = await supabase
      .from('sudododo_votes')
      .select('value')
      .eq('user_id', session.user.id)
      .eq('post_id', postId)
      .single()
    userVote = voteData?.value || null
  }

  return {
    score: scoreData || 0,
    userVote
  }
}

/**
 * getVotesBatch
 * Optimized fetch for feed pages to get many votes in one query
 */
export async function getVotesBatch(postIds: string[]): Promise<Record<string, VoteResult>> {
  const supabase = getSupabase()
  const { data: { session } } = await supabase.auth.getSession()

  const { data: scores } = await supabase
    .from('sudododo_votes')
    .select('post_id, value')
    .in('post_id', postIds)

  const { data: userVotes } = session 
    ? await supabase.from('sudododo_votes').select('post_id, value').eq('user_id', session.user.id).in('post_id', postIds)
    : { data: [] }

  const results: Record<string, VoteResult> = {}

  postIds.forEach(id => {
    const postScores = scores?.filter(s => s.post_id === id) || []
    const totalScore = postScores.reduce((acc, s) => acc + s.value, 0)
    const myVote = userVotes?.find(uv => uv.post_id === id)?.value || null

    results[id] = {
      score: totalScore,
      userVote: myVote
    }
  })

  return results
}
