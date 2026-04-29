import { SupabaseClient } from '@supabase/supabase-js'

// ─────────────────────────────────────────────────────────────
// EPISODIC MEMORY (V3 STORY LAYER)
// ─────────────────────────────────────────────────────────────

export async function getOrCreateEpisode(
  supabase: SupabaseClient,
  userId: string,
  personaId: string,
  currentDomain: string
): Promise<string | null> {
  try {
    const FOUR_HOURS_MS = 4 * 60 * 60 * 1000

    // 1. Check for active episode in last 4 hours
    const { data: recentEpisode, error: fetchErr } = await supabase
      .from('memories_episodes')
      .select('*')
      .eq('user_id', userId)
      .eq('persona_id', personaId)
      .order('end_time', { ascending: false })
      .limit(1)
      .single()

    if (recentEpisode && !fetchErr) {
      const lastActive = new Date(recentEpisode.end_time).getTime()
      const isRecentlyActive = (Date.now() - lastActive) < FOUR_HOURS_MS

      // If recently active and domain matches, reuse
      if (isRecentlyActive) {
        // Update end time
        await supabase
          .from('memories_episodes')
          .update({ end_time: new Date().toISOString() })
          .eq('id', recentEpisode.id)
        return recentEpisode.id
      }
    }

    // 2. Create new episode
    const { data: newEpisode, error: insErr } = await supabase
      .from('memories_episodes')
      .insert({
        user_id: userId,
        persona_id: personaId,
        topic_summary: `Conversation about ${currentDomain}`,
        metadata: { initial_domain: currentDomain }
      })
      .select()
      .single()

    if (insErr || !newEpisode) {
      console.error("❌ Episode Creation Failed:", insErr?.message || "No data returned")
      return null
    }

    return newEpisode.id
  } catch (e) {
    console.error("getOrCreateEpisode Panic:", e)
    return null
  }
}

// ─────────────────────────────────────────────────────────────
// MEMORY RETRIEVAL (with time decay)
// ─────────────────────────────────────────────────────────────
export async function retrieveMemories(
  supabase: SupabaseClient,
  embedding: number[],
  personaId: string,
  userId: string,
  queryText: string
): Promise<string> {
  // 1. STEP 1: LAZY LOADING - Search Episodes First
  const { data: episodes } = await supabase
    .from('memories_episodes')
    .select('id, topic_summary, start_time')
    .eq('user_id', userId)
    .eq('persona_id', personaId)
    // We use a simple vector search for episodes if embedding is available
    // or fallback to recent ones
    .order('end_time', { ascending: false })
    .limit(5)

  let episodeFilter: string[] = []
  if (episodes && episodes.length > 0) {
    // In a full implementation, we'd use vector similarity on episodes here.
    // For now, we take the most recent ones as "active context".
    episodeFilter = episodes.map((e: any) => e.id)
  }

  // 2. STEP 2: GRANULAR RETRIEVAL - Hybrid Search (Memories + Lockets)
  const { data: results } = await supabase.rpc('match_memories_v4', {
    query_embedding: embedding,
    match_threshold: 0.3,
    match_count: 10,
    filter_persona: personaId,
    filter_user: userId
  })

  if (!results || results.length === 0) return ""

  // 3. STEP 3: SOURCE TRACKING & FORMATTING
  return results
    .map((m: any) => {
      const date = new Date(m.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
      const sourceTag = m.source === 'locket' ? '[🔒 IMMUTABLE TRUTH]' : `[Conversation from ${date}]`
      return `${sourceTag}\n${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`
    })
    .join("\n\n")
}
