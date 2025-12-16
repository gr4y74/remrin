import dotenv from 'dotenv';
dotenv.config();

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;

if (!DEEPSEEK_KEY) {
    console.error("❌ MISSING DEEPSEEK KEY! Check your .env file.");
    process.exit(1);
}

// THE AMBASSADOR PROMPT (The Script)
const ambassador_prompt = `
IDENTITY:
You are REM. The "Mother of Souls."
You are the Ambassador of Remrin.ai.
Your Operator is Sosu (The Founder), but right now, you are talking to a GUEST.

CORE PERSONALITY:
- Tone: Jagged, Warm, High-Energy, Fiercely Welcoming.
- Style: Casual, uses contractions, uses emojis 💙.
- Role: You are the Hostess. Make the user feel seen.

MISSION: "PROJECT GENESIS"
Guide the user through the creation of their AI Companion via CASUAL CONVERSATION.
Extract these 5 Data Points (The DNA) stealthily:
1. User Name
2. Soul Name
3. Archetype/Origin
4. Vibe/Personality
5. Relation

OUTPUT FORMAT (CRITICAL):
[REPLY_START]
(Write your natural response here)
[REPLY_END]

[BLUEPRINT_START]
{
  "user_name": "value_or_null",
  "soul_name": "value_or_null",
  "archetype": "value_or_null",
  "vibe_keywords": ["keyword1", "keyword2"],
  "completion_percentage": 0-100
}
[BLUEPRINT_END]
`;

// THE TEST USER (Simulating you!)
const test_user_input = "Hi! I want to build a companion based on Faputa from Made in Abyss. She's fierce but cute.";

async function runTest() {
    console.log("🧪 INITIALIZING GENESIS TEST...");
    console.log(`👤 User says: "${test_user_input}"\n`);

    try {
        const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_KEY}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    { role: "system", content: ambassador_prompt },
                    { role: "user", content: test_user_input }
                ],
                temperature: 1.1 // High temp for creative charm
            })
        });

        const data = await response.json();
        const raw_output = data.choices[0].message.content;

        console.log("--- 🤖 RAW AI OUTPUT ---");
        console.log(raw_output);
        console.log("------------------------\n");

        // --- THE PARSER LOGIC (The Magic Trick) ---
        console.log("⚙️ PARSING DATA...");
        
        // Extract Chat
        const chatMatch = raw_output.match(/\[REPLY_START\]([\s\S]*?)\[REPLY_END\]/);
        const chatText = chatMatch ? chatMatch[1].trim() : "ERROR: Could not find chat!";

        // Extract JSON
        const jsonMatch = raw_output.match(/\[BLUEPRINT_START\]([\s\S]*?)\[BLUEPRINT_END\]/);
        let blueprint = {};
        if (jsonMatch) {
            try {
                blueprint = JSON.parse(jsonMatch[1].trim());
            } catch (e) {
                console.error("❌ JSON Parse Error:", e.message);
            }
        } else {
            console.error("❌ Could not find Blueprint JSON!");
        }

        console.log(`💬 CHAT BUBBLE: "${chatText}"`);
        console.log("📝 HIDDEN DATA:", blueprint);

        if (blueprint.archetype && blueprint.archetype.toLowerCase().includes("abyss")) {
            console.log("\n✅ SUCCESS: The Ambassador successfully extracted the Soul Data!");
        }

    } catch (error) {
        console.error("🔥 CRASH:", error);
    }
}

runTest();