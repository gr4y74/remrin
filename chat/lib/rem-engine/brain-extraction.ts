import { SupabaseClient } from '@supabase/supabase-js'

export async function getUserProfileGraph(supabase: SupabaseClient, userId: string): Promise<string> {
  const { data: graph } = await supabase
    .from('user_profile_graph')
    .select('entity_name, entity_type, data')
    .eq('user_id', userId)

  if (!graph || graph.length === 0) return ""

  const people = graph.filter((g: any) => g.entity_type === 'person')
    .map((g: any) => `  • ${g.entity_name}: ${g.data.description || 'Known person'}`)
    .join('\n')

  const places = graph.filter((g: any) => g.entity_type === 'place')
    .map((g: any) => `  • ${g.entity_name}: ${g.data.description || 'Significant location'}`)
    .join('\n')

  const preferences = graph.filter((g: any) => g.entity_type === 'preference')
    .map((g: any) => `  • ${g.entity_name}: ${g.data.value || g.data.description}`)
    .join('\n')

  const facts = graph.filter((g: any) => g.entity_type === 'fact')
    .map((g: any) => `  • ${g.entity_name}: ${g.data.description}`)
    .join('\n')

  let output = "\n[🧠 STRUCTURED PROFILE GRAPH - ZERO LATENCY RECALL]"
  if (people) output += `\nPEOPLE:\n${people}`
  if (places) output += `\nPLACES:\n${places}`
  if (preferences) output += `\nPREFERENCES:\n${preferences}`
  if (facts) output += `\nCORE FACTS:\n${facts}`

  return output.trim()
}

/**
 * Lightweight entity extraction to maintain the profile graph.
 * This runs at the end of the session to avoid latency.
 */
export async function processBrainExtraction(
  supabase: SupabaseClient,
  userId: string,
  userText: string,
  aiResponse: string,
  providerConfig: {
    apiEndpoint: string,
    defaultModel: string,
    apiKey: string
  },
  episodeId?: string
) {
  try {
    const extractionPrompt = `
You are an AI Story Weaver. Analyze the conversation and:
1. Extract persistent facts with a confidence score (0.0 to 1.0).
2. Generate a 1-sentence narrative summary of this conversation "beat".

Rules:
- Entities: People, Places, Preferences, Core Facts.
- Output ONLY a JSON object: 
 {
   "entities": [{"name": string, "type": string, "data": {"description": string, "confidence": number}}],
   "story_beat": string
 }

Conversation:
User: ${userText}
AI: ${aiResponse}

JSON OUTPUT:`

    const res = await fetch(providerConfig.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${providerConfig.apiKey}`
      },
      body: JSON.stringify({
        model: providerConfig.defaultModel,
        messages: [
          { role: "system", content: "You are a JSON extractor." },
          { role: "user", content: extractionPrompt }
        ],
        max_tokens: 800,
        temperature: 0.1
      })
    })

    if (!res.ok) {
        console.warn("Brain Extraction API failed:", res.status, await res.text())
        return
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) return

    const jsonMatch = content.match(/\{.*\}/s)
    if (!jsonMatch) return

    const result = JSON.parse(jsonMatch[0])

    // 1. Update Profile Graph with Confidence
    if (result.entities && Array.isArray(result.entities)) {
      for (const entity of result.entities) {
        await supabase.from('user_profile_graph').upsert({
          user_id: userId,
          entity_name: entity.name,
          entity_type: entity.type,
          data: entity.data,
          last_updated: new Date().toISOString()
        }, { onConflict: 'user_id, entity_name, entity_type' })
      }
    }

    // 2. Update Episode Summary (Story Beat)
    if (episodeId && result.story_beat) {
      await supabase
        .from('memories_episodes')
        .update({ topic_summary: result.story_beat })
        .eq('id', episodeId)
    }

    console.log(`🧠 Brain Layer: Updated ${result.entities?.length || 0} entities and Story Beat for user ${userId}`)
  } catch (e) {
    console.error("Brain Extraction Error:", e)
  }
}
