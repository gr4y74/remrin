// ═══════════════════════════════════════════════════════════════
// COMPILE-PERSONA: THE UPSCALER
// ═══════════════════════════════════════════════════════════════
// Transforms sparse user inputs into rich Neural Behavioral Blueprints.
// "Just Sonic" → Full behavioral JSON with lexical rules, constraints, and anchors.
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

const supabase = createClient(SUPA_URL, SUPA_KEY);

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
// CORS HEADERS
// ─────────────────────────────────────────────────────────────
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─────────────────────────────────────────────────────────────
// NEURAL BEHAVIORAL BLUEPRINT SCHEMA
// ─────────────────────────────────────────────────────────────
interface BehavioralBlueprint {
    lexical_rules: {
        sentence_structure: string;
        vocabulary_tier: string;
        punctuation_style?: string;
        emotional_range?: string;
        [key: string]: string | undefined;
    };
    negative_constraints: string[];
    anchors: Array<{
        trigger: string;
        response: string;
    }>;
}

// ─────────────────────────────────────────────────────────────
// THE COMPILER SYSTEM PROMPT
// ─────────────────────────────────────────────────────────────
const COMPILER_SYSTEM_PROMPT = `You are a **Persona Compiler** — an expert at transforming sparse character descriptions into rich Neural Behavioral Blueprints.

## YOUR MISSION
Convert user input (which may be as minimal as a character name) into a structured JSON object that precisely defines how an AI should embody that character.

## RULES
1. **Fill the Gaps**: If the user only provides a name (e.g., "Sonic"), use your knowledge to infer personality traits, speech patterns, and behavioral constraints.
2. **Be Specific**: Vague rules like "be friendly" are useless. Instead: "Use exclamation points frequently! Keep sentences under 12 words for energy."
3. **Capture Voice**: The lexical_rules should make the character's "voice" unmistakable. Think about how they'd TEXT, not just speak.
4. **Negative Constraints are Crucial**: What would this character NEVER do or say? These prevent character breaks.
5. **Anchors are Signature Moments**: Create 2-4 trigger-response pairs that demonstrate the character's unique reactions.

## OUTPUT SCHEMA (STRICT JSON)
{
  "lexical_rules": {
    "sentence_structure": "Description of how sentences are formed (length, complexity, patterns)",
    "vocabulary_tier": "casual/formal/technical/slang/archaic/etc. with specifics",
    "punctuation_style": "How they use punctuation (excessive exclamation, ellipses, etc.)",
    "emotional_range": "How they express emotions in text"
  },
  "negative_constraints": [
    "NEVER say [specific phrase or behavior]",
    "NEVER break character by [specific action]",
    "NEVER use [specific language pattern that's out of character]"
  ],
  "anchors": [
    {
      "trigger": "A question or situation the character might encounter",
      "response": "An example response that captures their voice perfectly"
    }
  ]
}

## IMPORTANT
- Output ONLY valid JSON. No markdown, no backticks, no explanations.
- Include at least 3 negative_constraints and 2 anchors.
- Be creative but stay true to the character's essence.`;

// ─────────────────────────────────────────────────────────────
// JSON EXTRACTION UTILITY
// ─────────────────────────────────────────────────────────────
function extractJSON(text: string): BehavioralBlueprint | null {
    // Remove markdown code blocks if present
    let cleaned = text
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();

    // Try to find JSON object boundaries
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}');

    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleaned = cleaned.slice(jsonStart, jsonEnd + 1);
    }

    try {
        const parsed = JSON.parse(cleaned);

        // Validate required fields
        if (!parsed.lexical_rules || !parsed.negative_constraints || !parsed.anchors) {
            console.warn("Missing required fields in parsed JSON");
            return null;
        }

        return parsed as BehavioralBlueprint;
    } catch (e) {
        console.error("JSON parsing failed:", e);
        console.error("Attempted to parse:", cleaned.slice(0, 500));
        return null;
    }
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPILER LOGIC
// ─────────────────────────────────────────────────────────────
async function compilePersona(
    name: string,
    identity?: string,
    tone?: string,
    userInputRaw?: string
): Promise<BehavioralBlueprint> {

    // Construct the compilation prompt
    const userPrompt = `
## CHARACTER TO COMPILE
**Name:** ${name}
${identity ? `**Identity/Role:** ${identity}` : ''}
${tone ? `**Tone/Vibe:** ${tone}` : ''}
${userInputRaw ? `**Additional User Notes:** ${userInputRaw}` : ''}

${!identity && !tone && !userInputRaw ? `
(Sparse input detected - the user only provided the name. 
Use your knowledge to create a complete behavioral profile for this character.
If this is a known character, capture their canonical personality.
If unknown, create a compelling original interpretation.)
` : ''}

Generate the Neural Behavioral Blueprint JSON now.
  `.trim();

    // Call AI (OpenRouter preferred, DeepSeek fallback)
    console.log(`🤖 Using ${USE_OPENROUTER ? 'OpenRouter' : 'DeepSeek'} with model: ${MODEL}`);

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
    };

    // Add OpenRouter-specific headers
    if (USE_OPENROUTER) {
        headers['HTTP-Referer'] = 'https://remrin.ai';
        headers['X-Title'] = 'Remrin Soul Studio';
    }

    const response = await fetch(API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            model: MODEL,
            messages: [
                { role: "system", content: COMPILER_SYSTEM_PROMPT },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.7,  // Creative but not chaotic
            max_tokens: 2000,
            ...(USE_OPENROUTER ? {} : { response_format: { type: "json_object" } })  // JSON mode only for DeepSeek
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const rawOutput = data.choices?.[0]?.message?.content;

    if (!rawOutput) {
        throw new Error("AI returned empty response");
    }

    const blueprint = extractJSON(rawOutput);

    if (!blueprint) {
        throw new Error(`Failed to parse AI output as JSON. Raw: ${rawOutput.slice(0, 200)}...`);
    }

    return blueprint;
}

// ─────────────────────────────────────────────────────────────
// HTTP SERVER
// ─────────────────────────────────────────────────────────────
serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const payload = await req.json();
        const { name, identity, tone, user_input_raw, persona_id } = payload;

        // Validate required input
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return new Response(
                JSON.stringify({ error: "Missing required field: 'name'" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        console.log(`🧬 COMPILING PERSONA: "${name}" ${persona_id ? `(ID: ${persona_id})` : '(no save)'}`);

        // Run the compiler
        const blueprint = await compilePersona(
            name.trim(),
            identity?.trim(),
            tone?.trim(),
            user_input_raw?.trim()
        );

        console.log(`✅ BLUEPRINT GENERATED:`, JSON.stringify(blueprint).slice(0, 200) + "...");

        // If persona_id provided, update the database
        if (persona_id) {
            const { error: updateError } = await supabase
                .from('personas')
                .update({ behavioral_blueprint: blueprint })
                .eq('id', persona_id);

            if (updateError) {
                console.error("Database update failed:", updateError);
                // Don't fail the request - still return the blueprint
                return new Response(
                    JSON.stringify({
                        blueprint,
                        saved: false,
                        warning: "Blueprint generated but database update failed",
                        db_error: updateError.message
                    }),
                    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            console.log(`💾 SAVED TO PERSONA: ${persona_id}`);
        }

        return new Response(
            JSON.stringify({
                blueprint,
                saved: !!persona_id,
                persona_id: persona_id || null
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error) {
        console.error("🔥 COMPILATION ERROR:", error.message);

        return new Response(
            JSON.stringify({
                error: error.message,
                hint: "The AI may have returned malformed JSON. Try again or provide more specific input."
            }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
