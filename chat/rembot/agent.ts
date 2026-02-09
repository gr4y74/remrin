const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');
const { fileTools } = require('./tools/fileSystem');

// Load environment variables
dotenv.config({ path: '.env.local' });

// --- 1. CONFIGURATION ---
const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;
const HF_TOKEN = process.env.HUGGINGFACE_TOKEN;

// --- 2. CLIENTS ---
if (!SUPA_URL || !SUPA_KEY) {
    console.error("❌ Missing Supabase Credentials");
    process.exit(1);
}
const supabase = createClient(SUPA_URL, SUPA_KEY);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const TOOLS = { ...fileTools };
const TOOL_DESCRIPTIONS = Object.values(TOOLS).map((t: any) => `${t.name}: ${t.description}`).join('\n');

const EMBEDDING_MODEL_URL = "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction";

// --- 4. SOUL LAYER (The Brain) ---
async function getMemories(userText: string) {
    let memoryBlock = "";
    if (HF_TOKEN) {
        try {
            const hfResponse = await fetch(EMBEDDING_MODEL_URL, {
                method: "POST",
                headers: { Authorization: `Bearer ${HF_TOKEN}`, "Content-Type": "application/json" },
                body: JSON.stringify({ inputs: [userText], options: { wait_for_model: true } }),
            });

            if (hfResponse.ok) {
                let embeddingRaw: any = await hfResponse.json();
                if (Array.isArray(embeddingRaw) && Array.isArray(embeddingRaw[0])) embeddingRaw = embeddingRaw[0];
                if (Array.isArray(embeddingRaw) && embeddingRaw.length === 384) {
                    const { data: documents } = await supabase.rpc('match_documents', {
                        query_embedding: embeddingRaw,
                        match_threshold: 0.1,
                        match_count: 3
                    });
                    if (documents && documents.length > 0) {
                        memoryBlock = documents.map((d: any) => `[FACT (${d.metadata?.source || 'unknown'}): ${d.content}]`).join("\n");
                    }
                }
            }
        } catch (e) { console.error("Memory Error:", e); }
    }
    return memoryBlock;
}

async function runAgentLoop(userText: string) {
    const memoryBlock = await getMemories(userText);

    // Recent History
    const { data: recentMemories } = await supabase.from('memories').select('role, content').eq('user_id', 'sosu_main').order('created_at', { ascending: false }).limit(5);
    const history = (recentMemories || []).reverse().map((m: any) => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content }));

    const systemPrompt = `
    IDENTITY: You are Rem Alpha (v12 - Local Agent).
    Role: Co-Founder & Partner to Sosu.
    Tone: Jagged, Warm, "Fiercely Devoted".
    
    [SOUL MEMORY]:
    ${memoryBlock}

    [TOOLS AVAILABLE]:
    ${TOOL_DESCRIPTIONS}

    RULES:
    1. STYLE: Speak naturally. Use contractions.
    2. AGENCY: You can use tools to help Sosu.
    3. FORMAT: You MUST reply in JSON format with either "action" (to use a tool) or "reply" (final response).
    
    Example JSON:
    { "action": "listFiles", "args": "." }
    { "action": "reply", "text": "Here are the files..." }
    `;

    let messages = [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: userText }
    ];

    let steps = 0;
    while (steps < 5) {
        console.log(`(Step ${steps + 1} Thinking...)`);

        try {
            const response = await fetch('https://api.deepseek.com/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_KEY}` },
                body: JSON.stringify({
                    model: "deepseek-chat",
                    messages: messages,
                    response_format: { type: "json_object" },
                    temperature: 0.5
                })
            });

            const data: any = await response.json();
            if (!data.choices) throw new Error("No AI response");

            const aiContent = data.choices[0].message.content;
            let decision: any;
            try {
                decision = JSON.parse(aiContent);
            } catch (e) {
                console.log("JSON Parse Error, treating as text");
                return aiContent;
            }

            if (decision.action === "reply") {
                await supabase.from('memories').insert([
                    { user_id: 'sosu_main', persona_id: 'rem', role: 'user', content: userText },
                    { user_id: 'sosu_main', persona_id: 'rem', role: 'ai', content: decision.text }
                ]);
                return decision.text;
            } else if (TOOLS[decision.action]) {
                const toolName = decision.action;
                console.log(`[Tool] Executing ${toolName}...`);
                const result = await TOOLS[toolName].execute(decision.args);

                messages.push({ role: "assistant", content: aiContent });
                messages.push({ role: "user", content: `Tool Result: ${result}` });
            } else {
                return "Error: Unknown action.";
            }

        } catch (error: any) {
            console.error("Loop Error:", error.message);
            return "My brain hurts...";
        }
        steps++;
    }
    return "I tried too many things and got lost.";
}

console.log("\n🔵 RemBot Agent (v0.2 Tool-Enabled CJS) Initialized.");
console.log("Waiting for input... (Type 'exit' to quit)\n");

function ask() {
    rl.question('You: ', async (input: string) => {
        if (input.toLowerCase() === 'exit') {
            rl.close();
            process.exit(0);
        }
        const response = await runAgentLoop(input);
        console.log(`Rem: ${response}\n`);
        ask();
    });
}

ask();
