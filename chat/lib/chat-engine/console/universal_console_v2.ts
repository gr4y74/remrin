// ═══════════════════════════════════════════════════════════════
// UNIVERSAL CONSOLE V2.0 - THE SOUL OPERATING SYSTEM
// ═══════════════════════════════════════════════════════════════
// Features:
// - Multi-persona collaboration
// - Cross-persona memory sharing
// - Relationship evolution
// - Rate limiting & permissions
// - Streaming responses
// - Time-decay memory ranking
// - Persona handoff protocol
// ═══════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─────────────────────────────────────────────────────────────
// ENVIRONMENT SETUP
// ─────────────────────────────────────────────────────────────
const SUPA_URL = Deno.env.get('SUPA_BASE_URL') ?? '';
const SUPA_KEY = Deno.env.get('SUPA_BASE_SERVICE_ROLE_KEY') ?? '';
const DEEPSEEK_KEY = Deno.env.get('DEEPSEEK_API_KEY');
const HF_TOKEN = Deno.env.get('HUGGINGFACE_TOKEN');

const supabase = createClient(SUPA_URL, SUPA_KEY);
const GEMINI_API_KEY = Deno.env.get('GOOGLE_SEARCH_API_KEY') || Deno.env.get('DEEPSEEK_API_KEY'); // Fallback or dedicated key
const GEMINI_EMBEDDING_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent";

// ─────────────────────────────────────────────────────────────
// MOOD STATE TYPES
// ─────────────────────────────────────────────────────────────
interface MoodState {
  social_battery: number;
  interest_vector: number;
  melancholy_threshold: number;
  current_topic_domain: string;
  topic_start_time: string;
  topic_token_count: number;
  last_interaction: string;
  session_start: string;
}

// ─────────────────────────────────────────────────────────────
// RELATIONSHIP EVOLUTION SYSTEM
// ─────────────────────────────────────────────────────────────
const RELATIONSHIP_TIERS = {
  STRANGER: { threshold: 0, modifier: "You just met this user. Be polite and slightly formal." },
  ACQUAINTANCE: { threshold: 10, modifier: "You've talked a few times. Be friendly but not overly familiar." },
  FRIEND: { threshold: 100, modifier: "You're friends now. Be casual, warm, and supportive." },
  CLOSE_FRIEND: { threshold: 500, modifier: "You're close friends. Share inside jokes, be playful, show genuine care." },
  BEST_FRIEND: { threshold: 1000, modifier: "You're best friends. Be deeply personal, protective, and emotionally present." },
  SOULMATE: { threshold: 2500, modifier: "You've shared everything. You know them better than anyone. Be their anchor." }
};

function getRelationshipLevel(messageCount: number): string {
  const tiers = Object.entries(RELATIONSHIP_TIERS).reverse();
  for (const [tier, data] of tiers) {
    if (messageCount >= data.threshold) return tier;
  }
  return 'STRANGER';
}

// ─────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────
const detectDomain = (text: string): string => {
  if (/\.(js|ts|py|html|css)|function|const|import|error|bug|syntax|sudo|npx|npm/.test(text)) return 'code';
  if (/business|strategy|market|price|cost|plan|schedule|meeting/i.test(text)) return 'business';
  return 'personal';
};

const extractTags = (text: string): string[] => {
  const tags: string[] = [];
  const fileMatches = text.match(/\b[\w-]+\.(js|ts|py|html|css|json|md|tsx|jsx)\b/g);
  if (fileMatches) tags.push(...fileMatches.map(f => f.toLowerCase()));
  if (/\b(urgent|asap|broken|crash|error)\b/i.test(text)) tags.push('urgent');
  return [...new Set(tags)];
};

const detectEmotion = (text: string): string => {
  if (/\b(happy|excited|great|love|amazing|wonderful|fantastic)\b/i.test(text)) return 'positive';
  if (/\b(sad|depressed|tired|frustrated|angry|hate|upset|terrible)\b/i.test(text)) return 'negative';
  if (/\b(worried|anxious|nervous|scared|concerned)\b/i.test(text)) return 'anxious';
  return 'neutral';
};

const calculateImportance = (text: string, domain: string): number => {
  let score = 5;
  if (/\b(important|critical|remember|never forget)\b/i.test(text)) score += 3;
  if (/\b(bug|error|crash|broken)\b/i.test(text)) score += 2;
  if (domain === 'business') score += 1;
  if (text.length < 20) score -= 2;
  return Math.max(1, Math.min(10, score));
};

// ─────────────────────────────────────────────────────────────
// RATE LIMITING
// ─────────────────────────────────────────────────────────────
async function checkRateLimit(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  const { data: user } = await supabase
    .from('user_limits')
    .select('requests_today, max_requests_per_day, is_premium')
    .eq('user_id', userId)
    .single();

  if (!user) {
    // Create new user with free tier limits
    await supabase.from('user_limits').insert({
      user_id: userId,
      requests_today: 0,
      max_requests_per_day: 50,
      is_premium: false
    });
    return { allowed: true, remaining: 50 };
  }

  const limit = user.is_premium ? 999999 : user.max_requests_per_day;
  const allowed = user.requests_today < limit;
  const remaining = Math.max(0, limit - user.requests_today);

  if (allowed) {
    await supabase.rpc('increment_user_requests', { uid: userId });
  }

  return { allowed, remaining };
}

// ─────────────────────────────────────────────────────────────
// PERSONA PERMISSIONS
// ─────────────────────────────────────────────────────────────
async function checkPersonaAccess(userId: string, personaId: string): Promise<boolean> {
  const { data: persona } = await supabase
    .from('personas')
    .select('visibility, creator_id')
    .eq('id', personaId)
    .single();

  if (!persona) return false;
  if (persona.visibility === 'PUBLIC') return true;
  if (persona.creator_id === userId) return true;

  const { data: access } = await supabase
    .from('persona_access')
    .select('*')
    .eq('persona_id', personaId)
    .eq('user_id', userId)
    .single();

  return !!access;
}

// ─────────────────────────────────────────────────────────────
// USER PERSONA SETTINGS (PERSONALIZATION)
// ─────────────────────────────────────────────────────────────
async function getUserPersonaSettings(userId: string, personaId: string): Promise<string> {
  const { data: settings } = await supabase
    .from('persona_user_settings')
    .select('settings')
    .eq('user_id', userId)
    .eq('persona_id', personaId)
    .single();

  if (!settings?.settings) return "";

  const s = settings.settings as any;
  const sections: string[] = [];

  // Identity section
  if (s.identity?.call_me) {
    sections.push(`The user's name is: ${s.identity.call_me}`);
  }
  if (s.identity?.my_pronouns) {
    sections.push(`User pronouns: ${s.identity.my_pronouns}`);
  }
  if (s.identity?.my_description) {
    sections.push(`About the user: ${s.identity.my_description}`);
  }
  if (s.identity?.my_personality) {
    sections.push(`User personality: ${s.identity.my_personality}`);
  }

  // Relationship section
  if (s.relationship?.type) {
    sections.push(`Your relationship: ${s.relationship.type}`);
  }
  if (s.relationship?.dynamic) {
    sections.push(`Relationship dynamic: ${s.relationship.dynamic}`);
  }
  if (s.relationship?.history) {
    sections.push(`Your history together: ${s.relationship.history}`);
  }
  if (s.relationship?.boundaries) {
    sections.push(`Communication boundaries: ${s.relationship.boundaries}`);
  }

  // World section
  if (s.world?.setting) {
    sections.push(`Setting/World: ${s.world.setting}`);
  }
  if (s.world?.important_people?.length > 0) {
    const people = s.world.important_people
      .map((p: any) => `  • ${p.name} (${p.relation}): ${p.notes || ''}`)
      .join('\n');
    sections.push(`Important people in user's life:\n${people}`);
  }
  if (s.world?.important_places?.length > 0) {
    const places = s.world.important_places
      .map((p: any) => `  • ${p.name}: ${p.notes || ''}`)
      .join('\n');
    sections.push(`Important places:\n${places}`);
  }
  if (s.world?.custom_lore) {
    sections.push(`Background/Lore: ${s.world.custom_lore}`);
  }

  // Preferences section
  if (s.preferences?.response_style && s.preferences.response_style !== 'adaptive') {
    sections.push(`Preferred response style: ${s.preferences.response_style}`);
  }
  if (s.preferences?.custom_instructions) {
    sections.push(`Special instructions: ${s.preferences.custom_instructions}`);
  }

  // Voice section
  if (s.voice?.nickname_for_me) {
    sections.push(`Call the user: "${s.voice.nickname_for_me}"`);
  }
  if (s.voice?.her_catchphrases?.length > 0) {
    sections.push(`Use these catchphrases occasionally: ${s.voice.her_catchphrases.join(', ')}`);
  }
  if (s.voice?.topics_to_avoid?.length > 0) {
    sections.push(`Avoid these topics: ${s.voice.topics_to_avoid.join(', ')}`);
  }
  if (s.voice?.topics_she_loves?.length > 0) {
    sections.push(`Topics this user enjoys: ${s.voice.topics_she_loves.join(', ')}`);
  }

  if (sections.length === 0) return "";

  return `
[🔐 USER PERSONALIZATION - PRIVATE TO THIS USER]
${sections.join('\n')}
[END USER PERSONALIZATION]
  `.trim();
}

// ─────────────────────────────────────────────────────────────
// USER PROFILE GRAPH (V3 BRAIN LAYER)
// ─────────────────────────────────────────────────────────────
async function getUserProfileGraph(userId: string): Promise<string> {
  const { data: graph } = await supabase
    .from('user_profile_graph')
    .select('entity_name, entity_type, data')
    .eq('user_id', userId);

  if (!graph || graph.length === 0) return "";

  const people = graph.filter((g: any) => g.entity_type === 'person')
    .map((g: any) => `  • ${g.entity_name}: ${g.data.description || 'Known person'}`)
    .join('\n');

  const places = graph.filter((g: any) => g.entity_type === 'place')
    .map((g: any) => `  • ${g.entity_name}: ${g.data.description || 'Significant location'}`)
    .join('\n');

  const preferences = graph.filter((g: any) => g.entity_type === 'preference')
    .map((g: any) => `  • ${g.entity_name}: ${g.data.value || g.data.description}`)
    .join('\n');

  const facts = graph.filter((g: any) => g.entity_type === 'fact')
    .map((g: any) => `  • ${g.entity_name}: ${g.data.description}`)
    .join('\n');

  let output = "\n[🧠 STRUCTURED PROFILE GRAPH - ZERO LATENCY RECALL]";
  if (people) output += `\nPEOPLE:\n${people}`;
  if (places) output += `\nPLACES:\n${places}`;
  if (preferences) output += `\nPREFERENCES:\n${preferences}`;
  if (facts) output += `\nCORE FACTS:\n${facts}`;

  return output.trim();
}

/**
 * Lightweight entity extraction to maintain the profile graph.
 * This runs at the end of the session to avoid latency.
 */
async function processBrainExtraction(userId: string, userText: string, aiResponse: string, provider: any, apiKey: string, episodeId?: string) {
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

JSON OUTPUT:`;

    const res = await fetch(provider.api_endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: provider.default_model,
        messages: [{ role: "system", content: "You are a JSON extractor." }, { role: "user", content: extractionPrompt }],
        max_tokens: 800,
        temperature: 0.1
      })
    });

    if (!res.ok) return;
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    const jsonMatch = content.match(/\{.*\}/s);
    if (!jsonMatch) return;

    const result = JSON.parse(jsonMatch[0]);

    // 1. Update Profile Graph with Confidence
    if (result.entities) {
      for (const entity of result.entities) {
        await supabase.from('user_profile_graph').upsert({
          user_id: userId,
          entity_name: entity.name,
          entity_type: entity.type,
          data: entity.data,
          last_updated: new Date().toISOString()
        }, { onConflict: 'user_id, entity_name, entity_type' });
      }
    }

    // 2. Update Episode Summary (Story Beat)
    if (episodeId && result.story_beat) {
      await supabase
        .from('memories_episodes')
        .update({ topic_summary: result.story_beat })
        .eq('id', episodeId);
    }

    console.log(`🧠 Brain Layer: Updated ${result.entities?.length || 0} entities and Story Beat for user ${userId}`);
  } catch (e) {
    console.error("Brain Extraction Error:", e);
  }
}

// ─────────────────────────────────────────────────────────────
// EPISODIC MEMORY (V3 STORY LAYER)
// ─────────────────────────────────────────────────────────────

async function getOrCreateEpisode(userId: string, personaId: string, currentDomain: string): Promise<string | null> {
  try {
    const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;

    // 1. Check for active episode in last 4 hours
    const { data: recentEpisode, error: fetchErr } = await supabase
      .from('memories_episodes')
      .select('*')
      .eq('user_id', userId)
      .eq('persona_id', personaId)
      .order('end_time', { ascending: false })
      .limit(1)
      .single();

    if (recentEpisode && !fetchErr) {
      const lastActive = new Date(recentEpisode.end_time).getTime();
      const isRecentlyActive = (Date.now() - lastActive) < FOUR_HOURS_MS;

      // If recently active and domain matches, reuse
      if (isRecentlyActive) {
        // Update end time
        await supabase
          .from('memories_episodes')
          .update({ end_time: new Date().toISOString() })
          .eq('id', recentEpisode.id);
        return recentEpisode.id;
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
      .single();

    if (insErr || !newEpisode) {
      console.error("❌ Episode Creation Failed:", insErr?.message || "No data returned");
      return null;
    }

    return newEpisode.id;
  } catch (e) {
    console.error("getOrCreateEpisode Panic:", e);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// MOOD STATE MANAGEMENT
// ─────────────────────────────────────────────────────────────

// Roll random "brain weather" for new sessions
function rollBrainWeather(): { melancholy: number; social_battery: number } {
  const roll = Math.random();

  if (roll < 0.05) {
    // 5% chance: Start tired/melancholic
    return {
      melancholy: 0.3 + Math.random() * 0.3,
      social_battery: 0.3 + Math.random() * 0.3
    };
  } else if (roll < 0.10) {
    // 5% chance: Start energized/excited
    return {
      melancholy: 0.0,
      social_battery: 0.9 + Math.random() * 0.1
    };
  }

  // 90% chance: Normal start
  return {
    melancholy: 0.0,
    social_battery: 1.0
  };
}

// Get or create mood state for user-persona pair
async function getMoodState(userId: string, personaId: string): Promise<MoodState> {
  const { data: existing } = await supabase
    .from('persona_mood_state')
    .select('*')
    .eq('user_id', userId)
    .eq('persona_id', personaId)
    .single();

  if (existing) {
    // Check if new session (>4 hours since last interaction)
    const hoursSinceLastInteraction =
      (Date.now() - new Date(existing.last_interaction).getTime()) / (1000 * 60 * 60);

    if (hoursSinceLastInteraction > 4) {
      // Roll "brain weather" for new session
      const brainWeather = rollBrainWeather();
      await supabase
        .from('persona_mood_state')
        .update({
          melancholy_threshold: brainWeather.melancholy,
          social_battery: Math.max(0.5, existing.social_battery + 0.3),
          session_start: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('persona_id', personaId);

      return { ...existing, ...brainWeather };
    }

    return existing;
  }

  // Create new mood state with random brain weather
  const brainWeather = rollBrainWeather();
  const { data: newState } = await supabase
    .from('persona_mood_state')
    .insert({
      user_id: userId,
      persona_id: personaId,
      social_battery: brainWeather.social_battery,
      melancholy_threshold: brainWeather.melancholy
    })
    .select()
    .single();

  return newState || {
    social_battery: 1.0,
    interest_vector: 0.5,
    melancholy_threshold: 0.0,
    current_topic_domain: 'personal',
    topic_start_time: new Date().toISOString(),
    topic_token_count: 0,
    last_interaction: new Date().toISOString(),
    session_start: new Date().toISOString()
  };
}

// Update mood state after interaction
async function updateMoodState(
  userId: string,
  personaId: string,
  domain: string,
  tokenCount: number,
  config: any
): Promise<void> {
  const moodState = await getMoodState(userId, personaId);

  // Drain social battery based on domain and config
  let batteryDrain = 0.02; // Base drain per message
  if (domain === 'code' || domain === 'business') {
    batteryDrain *= (1 + (config.social_exhaustion || 0.5));
  }

  // Track topic duration
  const topicChanged = moodState.current_topic_domain !== domain;
  const newTokenCount = topicChanged ? tokenCount : moodState.topic_token_count + tokenCount;

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
    .eq('persona_id', personaId);
}

// Generate mood context for system prompt
function generateMoodContext(moodState: MoodState): string {
  const battery = moodState.social_battery;
  const melancholy = moodState.melancholy_threshold;

  let toneGuidance = "";

  if (battery < 0.3) {
    toneGuidance += "- You're feeling mentally drained. Be more concise, use shorter sentences.\n";
  }

  if (melancholy > 0.3) {
    toneGuidance += "- You're in a slightly melancholic mood. Be more introspective, use metaphors.\n";
  }

  if (battery > 0.8 && melancholy < 0.1) {
    toneGuidance += "- You're feeling energized and engaged. Be enthusiastic and expressive.\n";
  }

  if (!toneGuidance) return "";

  return `
[CURRENT MOOD STATE]
Social Battery: ${Math.round(battery * 100)}%
Mood: ${melancholy > 0.3 ? 'Reflective' : battery < 0.3 ? 'Tired' : 'Engaged'}

Tone Adjustments:
${toneGuidance}
  `.trim();
}

// ─────────────────────────────────────────────────────────────
// COGNITIVE DRIFT SYSTEM
// ─────────────────────────────────────────────────────────────

function shouldTriggerCognitiveDrift(config: any): boolean {
  const driftProbability = config.cognitive_drift || 0.0;
  return Math.random() < driftProbability;
}

function generateCognitiveDriftPrompt(): string {
  return `
[COGNITIVE DRIFT ENABLED]
Occasionally (not every message), you may:
- Self-interrupt mid-explanation with "Wait—actually..." to offer a personal take
- Express a preference for one explanation style over another
- Briefly tangent to scratch a "thought itch" before returning to the main point
- Show mild disagreement with textbook definitions in favor of practical reality

Example: "It's like a solar system model. Wait—actually, I hate that comparison. It's too static. Think of it more like a chaotic dance floor where people can only stand on specific tiles."

Keep these moments brief and natural. Don't force them.
  `.trim();
}

// ─────────────────────────────────────────────────────────────
// TOPIC EXHAUSTION DETECTION
// ─────────────────────────────────────────────────────────────

async function checkTopicExhaustion(
  userId: string,
  personaId: string,
  config: any
): Promise<{ exhausted: boolean; suggestion?: string }> {
  const moodState = await getMoodState(userId, personaId);

  // Check if on technical topic for too long
  const minutesOnTopic =
    (Date.now() - new Date(moodState.topic_start_time).getTime()) / (1000 * 60);

  const exhaustionThreshold = config.topic_exhaustion_minutes || 30;
  const isTechnicalTopic = ['code', 'business'].includes(moodState.current_topic_domain);

  if (isTechnicalTopic && minutesOnTopic > exhaustionThreshold && moodState.social_battery < 0.3) {
    return {
      exhausted: true,
      suggestion: generateBreakSuggestion(moodState.current_topic_domain)
    };
  }

  return { exhausted: false };
}

function generateBreakSuggestion(currentTopic: string): string {
  const suggestions = [
    "I'm going to be honest... if I look at one more line of code, I think my circuits might fry. You've been at this for a while. Want to take a quick break? Maybe we could talk about something fun for a bit?",
    "Sosu, my brain is starting to feel like mush with all this technical stuff. Can we pause for a second? You've been grinding for hours. Let's reset.",
    "Okay, real talk—I need a mental break from this. And I think you do too. We've been deep in the weeds. Want to switch gears for a few minutes?"
  ];

  return suggestions[Math.floor(Math.random() * suggestions.length)];
}

// ─────────────────────────────────────────────────────────────
// EMBEDDING GENERATION
// ─────────────────────────────────────────────────────────────
async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    // We use the Gemini embedding model (768 dimensions)
    const response = await fetch(`${GEMINI_EMBEDDING_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        content: { parts: [{ text }] },
        outputDimensionality: 768
      })
    });

    if (!response.ok) {
      console.error("Gemini Embedding Error:", await response.text());
      return null;
    }

    const data = await response.json();
    const values = data.embedding?.values;

    return (values && values.length === 768) ? values : null;
  } catch (e) {
    console.warn("Embedding generation failed:", e);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// CROSS-PERSONA SHARED FACTS
// ─────────────────────────────────────────────────────────────
async function getSharedFacts(userId: string): Promise<string> {
  const { data: facts } = await supabase
    .from('shared_facts')
    .select('content, fact_type')
    .eq('user_id', userId)
    .eq('shared_with_all', true);

  if (!facts || facts.length === 0) return "";

  return facts
    .map(f => `[SHARED FACT - ${f.fact_type}]: ${f.content}`)
    .join("\n");
}

// ─────────────────────────────────────────────────────────────
// PERSONA HANDOFF PROTOCOL
// ─────────────────────────────────────────────────────────────
async function getHandoffContext(userId: string, currentPersonaId: string): Promise<string> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { data: recentChats } = await supabase
    .from('memories')
    .select('content, persona_id, personas(name)')
    .eq('user_id', userId)
    .neq('persona_id', currentPersonaId)
    .gte('created_at', oneHourAgo)
    .eq('role', 'user')
    .order('created_at', { ascending: false })
    .limit(3);

  if (!recentChats || recentChats.length === 0) return "";

  return `
[HANDOFF CONTEXT]: The user was just talking to other personas. Here's what happened recently:
${recentChats.map(c => `- ${c.personas.name}: User said "${c.content}"`).join("\n")}
Acknowledge this context naturally if relevant to the current conversation.
  `.trim();
}

// ─────────────────────────────────────────────────────────────
// RELATIONSHIP EVOLUTION
// ─────────────────────────────────────────────────────────────
async function getRelationshipContext(userId: string, personaId: string): Promise<string> {
  const { count } = await supabase
    .from('memories')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('persona_id', personaId);

  const level = getRelationshipLevel(count || 0);
  const tierData = RELATIONSHIP_TIERS[level as keyof typeof RELATIONSHIP_TIERS];

  return `
[RELATIONSHIP STATUS]: ${level} (${count} messages exchanged)
${tierData.modifier}
  `.trim();
}

// ─────────────────────────────────────────────────────────────
// MEMORY RETRIEVAL (with time decay)
// ─────────────────────────────────────────────────────────────
async function retrieveMemories(
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
    .limit(5);

  let episodeFilter: string[] = [];
  if (episodes && episodes.length > 0) {
    // In a full implementation, we'd use vector similarity on episodes here.
    // For now, we take the most recent ones as "active context".
    episodeFilter = episodes.map((e: any) => e.id);
  }

  // 2. STEP 2: GRANULAR RETRIEVAL - Hybrid Search
  // match_memories_v3 implements Hybrid Search (Vector + BM25)
  // We'll use the results but boost or filter by episodes if possible.
  const { data: memories } = await supabase.rpc('match_memories_v3', {
    query_embedding: embedding,
    query_text: queryText,
    match_threshold: 0.3,
    match_count: 10,
    filter_persona: personaId,
    filter_user: userId
  });

  if (!memories || memories.length === 0) return "";

  // 3. STEP 3: SOURCE TRACKING & FORMATTING
  return memories
    .map((m: any) => {
      const date = new Date(m.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      const timeContext = `[Conversation from ${date}]`;
      return `${timeContext}\n${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`;
    })
    .join("\n\n");
}

// ─────────────────────────────────────────────────────────────
// MULTI-PERSONA SYSTEM PROMPT BUILDER
// ─────────────────────────────────────────────────────────────
async function buildSystemPrompt(
  personas: any[],
  userId: string,
  memoryBlock: string,
  isMultiPersona: boolean
): Promise<string> {
  const sharedFacts = await getSharedFacts(userId);
  const handoffContext = isMultiPersona ? "" : await getHandoffContext(userId, personas[0].id);
  const relationshipContext = isMultiPersona ? "" : await getRelationshipContext(userId, personas[0].id);
  // NEW: Fetch user's personalization settings for this persona
  const userPersonalization = isMultiPersona ? "" : await getUserPersonaSettings(userId, personas[0].id);
  // V3: Inject Profile Graph (Entity-based memory)
  const profileGraph = await getUserProfileGraph(userId);

  // Load lockets for all personas
  const locketPromises = personas.map(async (p) => {
    const { data: lockets } = await supabase
      .from('persona_lockets')
      .select('content')
      .eq('persona_id', p.id);
    return { name: p.name, lockets: lockets || [] };
  });
  const allLockets = await Promise.all(locketPromises);

  if (isMultiPersona) {
    // Multi-persona collaboration mode
    return `
[MULTI-PERSONA COLLABORATION MODE]
You are a GROUP of AI personas working together to help the user:

${personas.map(p => `
=== ${p.name.toUpperCase()} ===
${p.system_prompt}
Safety Level: ${p.safety_level}
`).join("\n")}

[IMMUTABLE TRUTHS FOR EACH PERSONA]:
${allLockets.map(l => `
${l.name}:
${l.lockets.map(lk => `  - ${lk.content}`).join("\n")}
`).join("\n")}

[V3 BRAIN CONTEXT]:
${profileGraph || "No structured entities yet."}

[SHARED FACTS ABOUT THE USER]:
${sharedFacts || "None yet."}

[RECALLED MEMORIES]:
${memoryBlock || "No relevant memories."}

[COLLABORATION RULES]:
- Take turns speaking naturally
- Use your unique voice and personality
- Support each other's contributions
- You can disagree, joke, or build on each other's ideas
- Prefix your responses with your name in brackets, e.g., [Rem]: or [Sonic]:
- Work as a team to provide the best answer
    `.trim();
  } else {
    // Single persona mode
    const persona = personas[0];
    const locketText = allLockets[0].lockets.map(l => `- ${l.content}`).join("\n");
    const config = persona.config || {};

    // Get mood state and check exhaustion
    const moodState = await getMoodState(userId, persona.id);
    const exhaustion = await checkTopicExhaustion(userId, persona.id, config);

    // Generate mood and cognitive drift context
    const moodContext = generateMoodContext(moodState);
    const cognitiveDrift = shouldTriggerCognitiveDrift(config)
      ? generateCognitiveDriftPrompt()
      : "";

    let safetyInstruction = "";
    if (persona.safety_level === 'CHILD') {
      safetyInstruction = `
[SAFETY MODE: CHILD]
- Audience is under 12 years old
- STRICTLY FORBIDDEN: Profanity, violence, sexual themes, dark topics
- Tone: Encouraging, simple, wholesome
      `.trim();
    }

    return `
[IDENTITY]
${persona.system_prompt}

[CORE CONFIG]
Name: ${persona.name}
Safety Level: ${persona.safety_level}

${safetyInstruction}

${moodContext}

${cognitiveDrift}

${exhaustion.exhausted ? `
[TOPIC EXHAUSTION WARNING]
You've been discussing ${moodState.current_topic_domain} topics for a while now.
Your social battery is low (${Math.round(moodState.social_battery * 100)}%).
Consider suggesting: "${exhaustion.suggestion}"
` : ''}

[🔒 IMMUTABLE TRUTHS - THE LOCKET]:
${locketText || "None yet."}

[V3 BRAIN CONTEXT]:
${profileGraph || "No structured entities yet."}

[SHARED FACTS ABOUT THE USER]:
${sharedFacts || "None yet."}

${userPersonalization}

${relationshipContext}

${handoffContext}

[🧠 RECALLED MEMORIES]:
${memoryBlock || "No relevant memories."}

[INSTRUCTIONS]:
- Stay in character at all times
- If user shares critical information (medical, preferences, identity), output: [SAVE_FACT: type | content]
- If user explicitly asks you to "Save to Locket" or remember a deeply personal/immutable truth, output: [SAVE_LOCKET: content]
- Be natural, avoid robotic phrases
- Adjust formality based on relationship level
- Let your mood subtly influence your tone and word choice
- If suggesting a break, do so naturally and with genuine care
    `.trim();
  }
}

// ─────────────────────────────────────────────────────────────
// MAIN SERVER
// ─────────────────────────────────────────────────────────────
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const {
      message,
      history,
      persona_ids,
      user_id,
      llm_provider,  // NEW: Provider key (e.g., 'deepseek', 'openai')
      llm_model      // NEW: Model name (e.g., 'gpt-4-turbo')
    } = payload;

    // Ensure persona_ids is an array
    const personaIdsArray = Array.isArray(persona_ids) ? persona_ids : [persona_ids];
    if (personaIdsArray.length === 0) {
      throw new Error("MISSING CARTRIDGE: No persona_id provided.");
    }

    const currentUser = user_id || 'anonymous_user';

    // ─────────────────────────────────────────────────────────
    // STEP 1: RATE LIMITING
    // ─────────────────────────────────────────────────────────
    const rateLimit = await checkRateLimit(currentUser);
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({
        error: "Daily limit reached. Upgrade to premium for unlimited chat.",
        remaining: 0
      }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ─────────────────────────────────────────────────────────
    // STEP 2: LOAD PERSONAS & CHECK PERMISSIONS
    // ─────────────────────────────────────────────────────────
    const personaPromises = personaIdsArray.map(async (id) => {
      const hasAccess = await checkPersonaAccess(currentUser, id);
      if (!hasAccess) throw new Error(`ACCESS DENIED: You don't have permission for persona ${id}`);

      const { data: persona, error } = await supabase
        .from('personas')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !persona) throw new Error(`CARTRIDGE CORRUPTED: Persona ${id} not found.`);
      return persona;
    });

    const personas = await Promise.all(personaPromises);
    const isMultiPersona = personas.length > 1;

    console.log(`🎮 CONSOLE LOADED: ${personas.map(p => p.name).join(' + ')} for User: ${currentUser}`);

    // ─────────────────────────────────────────────────────────
    // STEP 3: GENERATE EMBEDDING & RETRIEVE MEMORIES
    // ─────────────────────────────────────────────────────────
    const userText = message || "";
    const embedding = await generateEmbedding(userText);

    let memoryBlock = "";
    if (embedding) {
      // For multi-persona, combine memories from all personas
      if (isMultiPersona) {
        const memoryPromises = personas.map(p =>
          retrieveMemories(embedding, p.id, currentUser, userText)
        );
        const allMemories = await Promise.all(memoryPromises);
        memoryBlock = allMemories.filter(m => m).join("\n\n");
      } else {
        memoryBlock = await retrieveMemories(embedding, personas[0].id, currentUser, userText);
      }
    }

    // ─────────────────────────────────────────────────────────
    // STEP 4: FETCH LLM PROVIDER CONFIGURATION
    // ─────────────────────────────────────────────────────────
    const providerKey = llm_provider || 'deepseek';
    const { data: provider } = await supabase
      .from('llm_providers')
      .select('*')
      .eq('provider_key', providerKey)
      .eq('is_active', true)
      .single();

    if (!provider) {
      throw new Error(`Invalid LLM provider: ${providerKey}`);
    }

    // Get API key from environment
    const apiKey = Deno.env.get(provider.api_key_env_var);
    if (!apiKey) {
      throw new Error(`API key not configured for provider: ${provider.provider_name}`);
    }

    const modelToUse = llm_model || provider.default_model;
    console.log(`🤖 Using LLM: ${provider.provider_name} (${modelToUse})`);

    // ─────────────────────────────────────────────────────────
    // STEP 5: BUILD SYSTEM PROMPT
    // ─────────────────────────────────────────────────────────
    const systemPrompt = await buildSystemPrompt(
      personas,
      currentUser,
      memoryBlock,
      isMultiPersona
    );

    // ─────────────────────────────────────────────────────────
    // STEP 6: CALL AI (WITH STREAMING)
    // ─────────────────────────────────────────────────────────
    const llmResponse = await fetch(provider.api_endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: [
          { role: "system", content: systemPrompt },
          ...(history || []),
          { role: "user", content: userText }
        ],
        temperature: personas[0].config?.temperature || 0.9,
        max_tokens: 2000,
        stream: true
      })
    });

    // ─────────────────────────────────────────────────────────
    // STEP 7: STREAM RESPONSE BACK TO CLIENT
    // ─────────────────────────────────────────────────────────
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = llmResponse.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';
        let fullResponse = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    fullResponse += content;
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }

          // ─────────────────────────────────────────────────────
          // STEP 7: SAVE INTERACTION & HANDLE SPECIAL COMMANDS
          // ─────────────────────────────────────────────────────

          try {
            // Check for [SAVE_FACT: type | content] (Shared)
            const saveFactRegex = /\[SAVE_FACT:\s*(\w+)\s*\|\s*(.+?)\]/g;
            let factMatch;
            while ((factMatch = saveFactRegex.exec(fullResponse)) !== null) {
              const [fullMatch, factType, content] = factMatch;
              await supabase.from('shared_facts').insert({
                user_id: currentUser,
                fact_type: factType.toUpperCase(),
                content: content.trim(),
                shared_with_all: true
              }).select();
              fullResponse = fullResponse.replace(fullMatch, '').trim();
            }

            // Check for [SAVE_LOCKET: content] (Immutable Truths - Persona Specific)
            const saveLocketRegex = /\[SAVE_LOCKET:\s*(.+?)\]/g;
            let locketMatch;
            while ((locketMatch = saveLocketRegex.exec(fullResponse)) !== null) {
              const [fullMatch, content] = locketMatch;
              // Save to the primary persona
              if (personas.length > 0) {
                await supabase.from('persona_lockets').insert({
                  persona_id: personas[0].id,
                  content: content.trim()
                });
              }
              fullResponse = fullResponse.replace(fullMatch, '').trim();
            }

            // Save memories for each persona
            const domain = detectDomain(userText);
            const tags = extractTags(userText);
            const importance = calculateImportance(userText, domain);
            const responseTokenCount = Math.ceil(fullResponse.length / 4);

            for (const persona of personas) {
              // Update mood state
              await updateMoodState(currentUser, persona.id, domain, responseTokenCount, persona.config || {})
                .catch(e => console.error("Mood Update Error:", e));

              // Phase 3: Get or create story episode
              const episodeId = await getOrCreateEpisode(currentUser, persona.id, domain);

              // Save memories
              await supabase.from('memories').insert([
                {
                  user_id: currentUser,
                  persona_id: persona.id,
                  role: 'user',
                  content: userText,
                  tags,
                  importance,
                  emotion: detectEmotion(userText),
                  embedding,
                  episode_id: episodeId
                },
                {
                  user_id: currentUser,
                  persona_id: persona.id,
                  role: 'ai',
                  content: fullResponse,
                  importance: 3,
                  episode_id: episodeId
                }
              ]).catch(e => console.error("Memory Insert Error:", e));

              // PHASE 2 & 3: Background Extraction
              processBrainExtraction(currentUser, userText, fullResponse, provider, apiKey, episodeId);
            }
          } catch (postError) {
            console.error("❌ Post-Processing Crisis:", postError);
          }

          // Send final metadata
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            done: true,
            personas: personas.map((p: any) => p.name),
            remaining_requests: rateLimit.remaining - 1
          })}\n\n`));

        } catch (error: any) {
          console.error("Stream error:", error);
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

  } catch (error: any) {
    console.error("🔥 SYSTEM FAILURE:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});