
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyBrainLayer() {
    console.log('--- Phase 2: Brain Layer Verification ---');

    const userId = '5ee5ae79-01c9-4729-a99c-40dc68a51877'; // Test User (Sosu)
    const personaId = '5720a26f-a61b-4641-ac19-d3a7b01c8bc8'; // Rem Rin

    // 1. Check current Profile Graph
    console.log('1. Checking current Profile Graph for user...');
    let { data: graphBefore } = await supabase
        .from('user_profile_graph')
        .select('*')
        .eq('user_id', userId);

    console.log(`Found ${graphBefore?.length || 0} existing entities.`);

    // 2. Simulate a conversation where user gives a fact
    const userMessage = "My sister's name is Maya. She's visiting from Tokyo next week.";
    const aiResponse = "How lovely! Maya from Tokyo... I'll remember that, Sosu. 💙";

    console.log(`2. Simulating extraction for: "${userMessage}"`);

    // We get the provider and key to run the extraction logic (mimicking processBrainExtraction)
    const { data: provider } = await supabase
        .from('llm_providers')
        .select('*')
        .eq('provider_key', 'deepseek')
        .single();

    const { data: keyData } = await supabase.from('api_keys').select('api_key').eq('provider', 'deepseek').single();
    const apiKey = keyData.api_key;

    // Run extraction logic (Ported from universal_console_v2.ts)
    const extractionPrompt = `
You are an Entity Extraction System. Analyze the conversation and extract persistent facts about the user.
Entities: People, Places, Preferences, Core Facts.

Rules:
1. ONLY extract confirmed facts.
2. Format as JSON array of objects: [{"name": string, "type": "person"|"place"|"preference"|"fact", "data": {"description": string}}]

Conversation:
User: ${userMessage}
AI: ${aiResponse}

JSON OUTPUT:`;

    console.log('   Sending to LLM for extraction...');
    const res = await fetch(provider.api_endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
            model: provider.default_model,
            messages: [{ role: "system", content: "You are a JSON extractor." }, { role: "user", content: extractionPrompt }],
            max_tokens: 500,
            temperature: 0.1
        })
    });

    if (!res.ok) {
        console.error('LLM Extraction failed:', await res.text());
        return;
    }

    const data = await res.json();
    const content = data.choices[0].message.content;
    const jsonMatch = content.match(/\[.*\]/s);

    if (jsonMatch) {
        const entities = JSON.parse(jsonMatch[0]);
        console.log(`   ✅ Extracted: ${JSON.stringify(entities, null, 2)}`);

        // Upsert into DB
        for (const entity of entities) {
            await supabase.from('user_profile_graph').upsert({
                user_id: userId,
                entity_name: entity.name,
                entity_type: entity.type,
                data: entity.data,
                last_updated: new Date().toISOString()
            }, { onConflict: 'user_id, entity_name, entity_type' });
        }
    } else {
        console.log('   ❌ No JSON found in LLM response.');
    }

    // 3. Verify it's in the graph now
    console.log('3. Verifying storage in user_profile_graph...');
    let { data: graphAfter } = await supabase
        .from('user_profile_graph')
        .select('*')
        .eq('user_id', userId)
        .ilike('entity_name', '%Maya%');

    if (graphAfter && graphAfter.length > 0) {
        console.log('✅ SUCCESS: Entity "Maya" found in Profile Graph!');
        console.log(`   Type: ${graphAfter[0].entity_type}`);
        console.log(`   Data: ${JSON.stringify(graphAfter[0].data)}`);
    } else {
        console.log('❌ FAILURE: Entity not found in database.');
    }
}

verifyBrainLayer().catch(console.error);
