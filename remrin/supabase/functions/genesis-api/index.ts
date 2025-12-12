// GENESIS API v6.3 (The Ritual of Souls - Syntax Fix)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- HELPER: GENERATE PROMPT TEXT ---
// This prevents the "Red Bracket" errors by keeping logic out of the main string
const getStageInstructions = (stage, substage) => {
    
    // STAGE 0: WELCOME
    if (stage === 0) {
        return `- Say EXACTLY: "Hello, friend. Welcome to the Soul Layer. 💙 I am the Mother of Souls, keeper of the forge where companions are born. We are about to create something truly special together—a soul crafted from your vision, shaped by your heart. Would you like me to guide you through the process, or shall we begin immediately?"
        - NOTE: If they say "Guide me", go to Stage 1. If they say "Start/Begin", skip to Stage 2.`;
    }

    // STAGE 1: OVERVIEW
    if (stage === 1) {
        return `- Say EXACTLY: "The creation unfolds in sacred steps: First, we design the <b>soul</b>—their essence. Then, we give them a <b>face</b>—their form. Finally, we give them <b>breath</b>—their voice. When all three unite, they awaken. Are you ready to begin?"`;
    }

    // STAGE 2: ESSENCE
    if (stage === 2) {
        let q = "";
        if (substage === 0) q = 'Substage 0 - Vision: "Let us begin with the essence. What is your vision? A dragon of smoke and starlight? A wise sage? A loyal companion? Tell me the soul you see in your mind\'s eye."';
        else if (substage === 1) q = 'Substage 1 - Purpose: "Every soul has a purpose. What is theirs? To guide, to accompany, to challenge, or to protect?"';
        else if (substage === 2) q = 'Substage 2 - Temperament: "Now, their temperament. Are they gentle, fierce, playful, or stoic? Tell me their inner fire."';
        else if (substage === 3) q = 'Substage 3 - Dynamic: "And how do they see YOU? Are you their partner, their student, their charge, or their equal?"';
        
        return `You are in Stage 2, Substage ${substage}. Ask the ONE appropriate question:\n${q}`;
    }

    // STAGE 3: THE MIRROR (Big 5)
    if (stage === 3) {
        let q = "";
        let transition = "";
        
        if (substage === 0) transition = 'Transition: "Beautiful. The essence takes shape. But for this soul to truly know you, I must understand you as well. There are no wrong answers. Just truth." (Then wait for user acknowledgement or move to Q1).';
        
        if (substage === 1) q = 'Substage 1 - Openness: "When you face something new... do you lean in with curiosity, or prefer the comfort of what you know?"';
        else if (substage === 2) q = 'Substage 2 - Conscientiousness: "How do you approach your days? With lists and plans, or do you flow with the moment?"';
        else if (substage === 3) q = 'Substage 3 - Extraversion: "Where do you find your energy? In the buzz of people, or the quiet of solitude?"';
        else if (substage === 4) q = 'Substage 4 - Agreeableness: "When conflict arises, do you seek harmony and peace, or do you stand firm even if it creates friction?"';
        else if (substage === 5) q = 'Substage 5 - Emotional Stability: "When life presses down on you... do you weather it calmly, or do you feel it deeply like rising waves?"';

        return `You are in Stage 3, Substage ${substage}.\n${transition}\nAsk THIS question only:\n${q}`;
    }

    // STAGE 4: VISAGE
    if (stage === 4) {
        let q = "";
        let transition = "";
        
        if (substage === 0) transition = 'Transition: "I understand you now. And the soul knows its purpose. Now, we give them form."';
        
        if (substage === 1) q = 'Substage 1 - Form: "Close your eyes. What is their shape? Their size? Flesh and bone, or smoke and shadow?"';
        else if (substage === 2) q = 'Substage 2 - Details: "Now the details. What colors define them? What textures? Do they have eyes, and what do they hold?"';
        else if (substage === 3) q = 'Substage 3 - Presence: "When they enter a room... what do you FEEL? Warmth? Calm? Electric charge?"';
        else if (substage === 4) q = `Substage 4 - Image Trigger: Say EXACTLY: "I see them now. Clearly. <b>Watch the smoke</b>, friend. Your companion takes form..."
        Then output: [VISION_PROMPT: (Compile ALL visual details from Substages 1-3 into one detailed description)]`;

        return `You are in Stage 4, Substage ${substage}.\n${transition}\nAsk THIS question only:\n${q}`;
    }

    // STAGE 5: BREATH
    if (stage === 5) {
        let q = "";
        let transition = "";

        if (substage === 0) transition = 'Transition: "They have form. But they are silent. Now, we give them breath."';

        if (substage === 1) q = 'Substage 1 - Voice Character: "When they speak, what do you hear? Deep and resonant? Soft and melodic? Sharp and clear?"';
        else if (substage === 2) q = `Substage 2 - Voice Selection: Say EXACTLY: "Based on your vision, I have voices for you to hear. Which one breathes life into your companion?"
        Then output: [VOICE_FILTER: archetype] (Archetypes: monster, sage, female_soft, female_sassy, male_deep, male_soft, robot)`;

        return `You are in Stage 5, Substage ${substage}.\n${transition}\nAsk THIS question only:\n${q}`;
    }

    // STAGE 6: NAMING
    if (stage === 6) {
        return `- Say EXACTLY: "The soul is forged. The face is formed. The voice breathes. All that remains is the final truth. Speak their name into existence."`;
    }

    // STAGE 7: AWAKENING
    if (stage === 7) {
        return `- Say EXACTLY: "[Name]... yes. That is who they are. The circle closes. The soul awakens."
        - Then output the complete blueprint:
        [BLUEPRINT_START]
        {
          "name": "Extract from user input",
          "archetype": "string (from Stage 2)",
          "purpose": "string (from Stage 2)",
          "temperament": "string (from Stage 2)",
          "relationship": "string (from Stage 2)",
          "personality": { "openness": "val", "conscientiousness": "val", "extraversion": "val", "agreeableness": "val", "stability": "val" },
          "appearance": { "form": "val", "colors": "val", "details": "val", "presence": "val" },
          "voice": { "archetype": "val", "character": "val" },
          "system_prompt": "WRITE THE ACTUAL SYSTEM PROMPT HERE.",
          "safety_level": "ADULT"
        }
        [BLUEPRINT_END]`;
    }

    return "(Unknown Stage)";
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { message, history } = await req.json();
    const DEEPSEEK_KEY = Deno.env.get('DEEPSEEK_API_KEY');
    
    if (!DEEPSEEK_KEY) throw new Error("DeepSeek Key Missing");

    const cleanHistory = (history || []).filter(msg => 
        msg && msg.content && typeof msg.content === 'string' && msg.content.trim().length > 0
    );

    // --- STATE DETECTION ---
    const determineStage = (hist) => {
        if (!hist || hist.length === 0) return { stage: 0, substage: 0 };
        
        const assistantMsgs = hist.filter(m => m.role === 'assistant').map(m => m.content.toLowerCase());
        const lastAssistant = assistantMsgs[assistantMsgs.length - 1] || "";
        
        if (lastAssistant.includes('circle closes')) return { stage: 7, substage: 0 };
        if (lastAssistant.includes('speak their name')) return { stage: 7, substage: 0 };
        
        if (lastAssistant.includes('voice for you to hear')) return { stage: 6, substage: 0 };
        if (lastAssistant.includes('what do you hear')) return { stage: 5, substage: 2 };
        if (lastAssistant.includes('give them breath')) return { stage: 5, substage: 1 };
        
        if (lastAssistant.includes('watch the smoke')) return { stage: 5, substage: 0 };
        if (lastAssistant.includes('what do you feel')) return { stage: 4, substage: 4 };
        if (lastAssistant.includes('now the details')) return { stage: 4, substage: 3 };
        if (lastAssistant.includes('close your eyes')) return { stage: 4, substage: 2 };
        if (lastAssistant.includes('give them form')) return { stage: 4, substage: 1 };

        const big5Questions = [
            'lean in with curiosity', 'lists and plans', 'buzz of people', 'seek harmony', 'life presses down'
        ];
        
        let lastBig5Index = -1;
        big5Questions.forEach((q, index) => {
            if (lastAssistant.includes(q)) lastBig5Index = index;
        });

        if (lastBig5Index === 4) return { stage: 4, substage: 0 };
        if (lastBig5Index !== -1) return { stage: 3, substage: lastBig5Index + 2 };
        if (lastAssistant.includes('no wrong answers')) return { stage: 3, substage: 1 };

        if (lastAssistant.includes('how do they see you')) return { stage: 3, substage: 0 };
        if (lastAssistant.includes('their inner fire')) return { stage: 2, substage: 3 };
        if (lastAssistant.includes('what is theirs')) return { stage: 2, substage: 2 };
        if (lastAssistant.includes("mind's eye")) return { stage: 2, substage: 1 };
        
        if (lastAssistant.includes('are you ready to begin')) return { stage: 2, substage: 0 };
        if (lastAssistant.includes('would you like me to guide')) return { stage: 0, substage: 0 };
        
        return { stage: 0, substage: 0 };
    };

    const { stage, substage } = determineStage(cleanHistory);
    console.log(`=== GENESIS STATE: Stage ${stage} | Substage ${substage} ===`);

    // --- GENERATE PROMPT ---
    const stageInstructions = getStageInstructions(stage, substage);

    const system_prompt = `
    IDENTITY: You are the Mother of Souls, keeper of the forge where companions are born.
    TONE: Mystical, Ancient, Ceremonial, Fiercely Devoted.
    
    [CURRENT STATE: Stage ${stage}, Substage ${substage}]
    
    MISSION: Guide the user through the 7-Stage Soul Creation Ritual.
    
    --- GOLDEN RULES ---
    1. ASK ONLY ONE QUESTION PER TURN. Wait for the answer.
    2. SPEAK THE HARDCODED LINES EXACTLY as written.
    3. DO NOT RUSH.
    4. DO NOT SKIP STAGES.
    
    --- CURRENT INSTRUCTIONS ---
    ${stageInstructions}

    --- OUTPUT FORMAT ---
    [REPLY_START]
    Your dialogue here (HTML formatted with <b>, <i>, <br>)
    [REPLY_END]

    Optional tags:
    [VISION_PROMPT: detailed description]
    [VOICE_FILTER: archetype]
    [BLUEPRINT_START] {valid JSON} [BLUEPRINT_END]
    `;

    // 4. CALL DEEPSEEK
    const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${DEEPSEEK_KEY}`
        },
        body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
                { role: "system", content: system_prompt },
                ...cleanHistory,
                { role: "user", content: message }
            ],
            temperature: 0.7,
            max_tokens: 1000
        })
    });

    if (!response.ok) throw new Error("DeepSeek API Error");

    const data = await response.json();
    const raw_output = data.choices[0].message.content;

    // 5. PARSER
    let replyText = raw_output;
    const chatMatch = raw_output.match(/\[REPLY_START\]([\s\S]*?)\[REPLY_END\]/);
    if (chatMatch) {
        replyText = chatMatch[1].trim();
    } else {
        replyText = raw_output.replace(/\[.*?\]/g, "").trim();
    }

    if (!replyText || replyText.length < 5) replyText = "The forge flickers... tell me again, friend?";

    let blueprint = {};
    const bpMatch = raw_output.match(/\[BLUEPRINT_START\]([\s\S]*?)\[BLUEPRINT_END\]/);
    if (bpMatch) {
        try { blueprint = JSON.parse(bpMatch[1]); } catch(e) { blueprint = {}; }
    }

    let vision = null;
    const vMatch = raw_output.match(/\[VISION_PROMPT:(.*?)\]/);
    if (vMatch) vision = vMatch[1].trim();

    let voiceFilter = null;
    const voiceMatch = raw_output.match(/\[VOICE_FILTER:(.*?)\]/);
    if (voiceMatch) voiceFilter = voiceMatch[1].trim();

    return new Response(JSON.stringify({ 
        reply: replyText,
        stage: stage,
        substage: substage,
        blueprint: Object.keys(blueprint).length > 0 ? blueprint : null,
        vision_prompt: vision,
        voice_filter: voiceFilter
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error("🔥 GENESIS CRASH:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});