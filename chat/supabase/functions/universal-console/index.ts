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
// Primary: OpenRouter (FREE models available)
const OPENROUTER_KEY = Deno.env.get('OPENROUTER_API_KEY');
// Fallback: DeepSeek (if OpenRouter not configured)
const DEEPSEEK_KEY = Deno.env.get('DEEPSEEK_API_KEY');
const HF_TOKEN = Deno.env.get('HUGGINGFACE_TOKEN');

const supabase = createClient(SUPA_URL, SUPA_KEY);
const EMBEDDING_MODEL_URL = "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2";

// Choose API configuration: prefer OpenRouter (has free models)
const USE_OPENROUTER = !!OPENROUTER_KEY;
const API_KEY = OPENROUTER_KEY || DEEPSEEK_KEY;
const API_URL = USE_OPENROUTER
  ? 'https://openrouter.ai/api/v1/chat/completions'
  : 'https://api.deepseek.com/chat/completions';
const MODEL = USE_OPENROUTER
  ? 'meta-llama/llama-3.3-70b-instruct:free'  // FREE model
  : 'deepseek-chat';

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
    .select('visibility, owner_id')
    .eq('id', personaId)
    .single();

  if (!persona) return false;
  if (persona.visibility === 'PUBLIC') return true;
  if (persona.owner_id === userId) return true;

  const { data: access } = await supabase
    .from('persona_access')
    .select('*')
    .eq('persona_id', personaId)
    .eq('user_id', userId)
    .single();

  return !!access;
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

[🔒 IMMUTABLE TRUTHS - THE LOCKET]:
${locketText || "None yet."}

[SHARED FACTS ABOUT THE USER]:
${sharedFacts || "None yet."}

${relationshipContext}

${handoffContext}

[🧠 RECALLED MEMORIES]:
${memoryBlock || "No relevant memories."}

[INSTRUCTIONS]:
- Stay in character at all times
- If user shares critical information (medical, preferences, identity), output: [SAVE_FACT: type | content]
- Be natural, avoid robotic phrases
- Adjust formality based on relationship level
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
    const { message, history, persona_ids, user_id } = payload;

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
    // STEP 4: BUILD SYSTEM PROMPT
    // ─────────────────────────────────────────────────────────
    const systemPrompt = await buildSystemPrompt(
      personas,
      currentUser,
      memoryBlock,
      isMultiPersona
    );

    // ─────────────────────────────────────────────────────────
    // STEP 5: CALL AI (WITH STREAMING)
    // ─────────────────────────────────────────────────────────
    console.log(`🤖 Using ${USE_OPENROUTER ? 'OpenRouter' : 'DeepSeek'} with model: ${MODEL}`);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    };

    // Add OpenRouter-specific headers
    if (USE_OPENROUTER) {
      headers['HTTP-Referer'] = 'https://remrin.ai';
      headers['X-Title'] = 'Remrin Universal Console';
    }

    const aiResponse = await fetch(API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          ...(history || []),
          { role: "user", content: userText }
        ],
        temperature: personas[0].config?.temperature || 0.9,
        max_tokens: 2000,
        stream: true // ENABLE STREAMING
      })
    });

    // ─────────────────────────────────────────────────────────
    // STEP 6: STREAM RESPONSE BACK TO CLIENT
    // ─────────────────────────────────────────────────────────
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = aiResponse.body?.getReader();
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

          for (const persona of personas) {
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