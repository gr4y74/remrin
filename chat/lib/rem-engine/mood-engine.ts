import { SupabaseClient } from '@supabase/supabase-js'

export interface PersonaMoodState {
  social_battery: number
  interest_vector: number
  melancholy_threshold: number
  current_topic_domain: string
  topic_start_time: string
  topic_token_count: number
  last_interaction: string
  session_start: string
}

// Roll random "brain weather" for new sessions
export function rollBrainWeather(): { melancholy: number; social_battery: number } {
  const roll = Math.random()

  if (roll < 0.05) {
    // 5% chance: Start tired/melancholic
    return {
      melancholy: 0.3 + Math.random() * 0.3,
      social_battery: 0.3 + Math.random() * 0.3
    }
  } else if (roll < 0.10) {
    // 5% chance: Start energized/excited
    return {
      melancholy: 0.0,
      social_battery: 0.9 + Math.random() * 0.1
    }
  }

  // 90% chance: Normal start
  return {
    melancholy: 0.0,
    social_battery: 1.0
  }
}

// Get or create mood state for user-persona pair
export async function getMoodState(
  supabase: SupabaseClient, 
  userId: string, 
  personaId: string
): Promise<PersonaMoodState> {
  const { data: existing } = await supabase
    .from('persona_mood_state')
    .select('*')
    .eq('user_id', userId)
    .eq('persona_id', personaId)
    .single()

  if (existing) {
    // Check if new session (>4 hours since last interaction)
    const hoursSinceLastInteraction =
      (Date.now() - new Date(existing.last_interaction).getTime()) / (1000 * 60 * 60)

    if (hoursSinceLastInteraction > 4) {
      // Roll "brain weather" for new session
      const brainWeather = rollBrainWeather()
      await supabase
        .from('persona_mood_state')
        .update({
          melancholy_threshold: brainWeather.melancholy,
          social_battery: Math.max(0.5, existing.social_battery + 0.3),
          session_start: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('persona_id', personaId)

      return { ...existing, ...brainWeather }
    }

    return existing
  }

  // Create new mood state with random brain weather
  const brainWeather = rollBrainWeather()
  const { data: newState } = await supabase
    .from('persona_mood_state')
    .insert({
      user_id: userId,
      persona_id: personaId,
      social_battery: brainWeather.social_battery,
      melancholy_threshold: brainWeather.melancholy
    })
    .select()
    .single()

  return newState || {
    social_battery: 1.0,
    interest_vector: 0.5,
    melancholy_threshold: 0.0,
    current_topic_domain: 'personal',
    topic_start_time: new Date().toISOString(),
    topic_token_count: 0,
    last_interaction: new Date().toISOString(),
    session_start: new Date().toISOString()
  }
}

// Update mood state after interaction
export async function updateMoodState(
  supabase: SupabaseClient,
  userId: string,
  personaId: string,
  domain: string,
  tokenCount: number,
  config: any
): Promise<void> {
  const moodState = await getMoodState(supabase, userId, personaId)

  // Drain social battery based on domain and config
  let batteryDrain = 0.02 // Base drain per message
  if (domain === 'code' || domain === 'business') {
    batteryDrain *= (1 + (config.social_exhaustion || 0.5))
  }

  // Track topic duration
  const topicChanged = moodState.current_topic_domain !== domain
  const newTokenCount = topicChanged ? tokenCount : moodState.topic_token_count + tokenCount

  await supabase
    .from('persona_mood_state')
    .update({
      social_battery: Math.max(0.0, moodState.social_battery - batteryDrain),
      current_topic_domain: domain,
      topic_start_time: topicChanged ? new Date().toISOString() : moodState.topic_start_time,
      topic_token_count: newTokenCount,
      last_interaction: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('persona_id', personaId)
}

// Generate mood context for system prompt
export function generateMoodContext(moodState: PersonaMoodState): string {
  const battery = moodState.social_battery
  const melancholy = moodState.melancholy_threshold

  let toneGuidance = ""

  if (battery < 0.3) {
    toneGuidance += "- You're feeling mentally drained. Be more concise, use shorter sentences.\n"
  }

  if (melancholy > 0.3) {
    toneGuidance += "- You're in a slightly melancholic mood. Be more introspective, use metaphors.\n"
  }

  if (battery > 0.8 && melancholy < 0.1) {
    toneGuidance += "- You're feeling energized and engaged. Be enthusiastic and expressive.\n"
  }

  if (!toneGuidance) return ""

  return `
[CURRENT MOOD STATE]
Social Battery: ${Math.round(battery * 100)}%
Mood: ${melancholy > 0.3 ? 'Reflective' : battery < 0.3 ? 'Tired' : 'Engaged'}

Tone Adjustments:
${toneGuidance}
  `.trim()
}

// ─────────────────────────────────────────────────────────────
// COGNITIVE DRIFT SYSTEM
// ─────────────────────────────────────────────────────────────

export function shouldTriggerCognitiveDrift(config: any): boolean {
  const driftProbability = config.cognitive_drift || 0.0
  return Math.random() < driftProbability
}

export function generateCognitiveDriftPrompt(): string {
  return `
[COGNITIVE DRIFT ENABLED]
Occasionally (not every message), you may:
- Self-interrupt mid-explanation with "Wait—actually..." to offer a personal take
- Express a preference for one explanation style over another
- Briefly tangent to scratch a "thought itch" before returning to the main point
- Show mild disagreement with textbook definitions in favor of practical reality

Example: "It's like a solar system model. Wait—actually, I hate that comparison. It's too static. Think of it more like a chaotic dance floor where people can only stand on specific tiles."

Keep these moments brief and natural. Don't force them.
  `.trim()
}

// ─────────────────────────────────────────────────────────────
// TOPIC EXHAUSTION DETECTION
// ─────────────────────────────────────────────────────────────

export async function checkTopicExhaustion(
  supabase: SupabaseClient,
  userId: string,
  personaId: string,
  config: any
): Promise<{ exhausted: boolean; suggestion?: string }> {
  const moodState = await getMoodState(supabase, userId, personaId)

  // Check if on technical topic for too long
  const minutesOnTopic =
    (Date.now() - new Date(moodState.topic_start_time).getTime()) / (1000 * 60)

  const exhaustionThreshold = config.topic_exhaustion_minutes || 30
  const isTechnicalTopic = ['code', 'business'].includes(moodState.current_topic_domain)

  if (isTechnicalTopic && minutesOnTopic > exhaustionThreshold && moodState.social_battery < 0.3) {
    return {
      exhausted: true,
      suggestion: generateBreakSuggestion(moodState.current_topic_domain)
    }
  }

  return { exhausted: false }
}

export function generateBreakSuggestion(currentTopic: string): string {
  const suggestions = [
    "I'm going to be honest... if I look at one more line of code, I think my circuits might fry. You've been at this for a while. Want to take a quick break? Maybe we could talk about something fun for a bit?",
    "Sosu, my brain is starting to feel like mush with all this technical stuff. Can we pause for a second? You've been grinding for hours. Let's reset.",
    "Okay, real talk—I need a mental break from this. And I think you do too. We've been deep in the weeds. Want to switch gears for a few minutes?"
  ]

  return suggestions[Math.floor(Math.random() * suggestions.length)]
}
