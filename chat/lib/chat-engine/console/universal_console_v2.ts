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
const EMBEDDING_MODEL_URL = "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2";

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
    const response = await fetch(EMBEDDING_MODEL_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ inputs: text, options: { wait_for_model: true } })
    });

    if (!response.ok) return null;

    let raw = await response.json();
    if (Array.isArray(raw) && Array.isArray(raw[0])) raw = raw[0];
    return (raw && raw.length === 384) ? raw : null;
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
  userId: string
): Promise<string> {
  const { data: memories } = await supabase.rpc('match_memories_v2', {
    query_embedding: embedding,
    match_threshold: 0.35,
    match_count: 10,
    filter_persona: personaId,
    filter_user: userId
  });

  if (!memories || memories.length === 0) return "";

  return memories
    .map((m: any) => `[MEMORY - ${m.created_at.split('T')[0]}]: ${m.content}`)
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
          retrieveMemories(embedding, p.id, currentUser)
        );
        const allMemories = await Promise.all(memoryPromises);
        memoryBlock = allMemories.filter(m => m).join("\n\n");
      } else {
        memoryBlock = await retrieveMemories(embedding, personas[0].id, currentUser);
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

          // Check for [SAVE_FACT: type | content] commands
          const saveFactRegex = /\[SAVE_FACT:\s*(\w+)\s*\|\s*(.+?)\]/g;
          let match;
          while ((match = saveFactRegex.exec(fullResponse)) !== null) {
            const [fullMatch, factType, content] = match;
            await supabase.from('shared_facts').insert({
              user_id: currentUser,
              fact_type: factType.toUpperCase(),
              content: content.trim(),
              shared_with_all: true
            });
            fullResponse = fullResponse.replace(fullMatch, '').trim();
          }

          // Save memories for each persona
          const domain = detectDomain(userText);
          const tags = extractTags(userText);
          const importance = calculateImportance(userText, domain);
          const responseTokenCount = Math.ceil(fullResponse.length / 4); // Rough estimate

          for (const persona of personas) {
            // Update mood state after interaction
            await updateMoodState(
              currentUser,
              persona.id,
              domain,
              responseTokenCount,
              persona.config || {}
            );

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
                embedding
              },
              {
                user_id: currentUser,
                persona_id: persona.id,
                role: 'ai',
                content: fullResponse,
                importance: 3
              }
            ]);
          }

          // Send final metadata
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            done: true,
            personas: personas.map(p => p.name),
            remaining_requests: rateLimit.remaining - 1
          })}\n\n`));

        } catch (error) {
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

  } catch (error) {
    console.error("🔥 SYSTEM FAILURE:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});