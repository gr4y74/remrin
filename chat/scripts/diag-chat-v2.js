
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const { ProviderManager } = require('./lib/chat-engine/providers/index');
const { buildConsoleSystemPrompt } = require('./lib/forge/console-adapter');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testPersona(name) {
    console.log(`\n--- Testing Persona: ${name} ---`);
    try {
        const { data: persona } = await supabase.from('personas').select('*').eq('name', name).single();
        if (!persona) throw new Error(`Persona ${name} not found`);

        const userId = '2fbd5597-0c2a-4cd6-8dc4-db8cbf19d73d'; // sosu

        console.log('Building system prompt...');
        const systemPrompt = await buildConsoleSystemPrompt(persona, userId);
        console.log('System Prompt head (100 chars):', systemPrompt.substring(0, 100));

        const { data: llmConfigs } = await supabase.from('llm_config').select('*').order('priority', { ascending: false });

        const pm = new ProviderManager('free', undefined, llmConfigs);
        const provider = pm.getProvider();
        console.log('Selected Provider:', provider.name, `(${provider.id})`);

        console.log('Attempting direct fetch via provider.sendMessage...');
        const messages = [{ role: 'user', content: 'Hello' }];
        const generator = provider.sendMessage(messages, systemPrompt, { model: llmConfigs[0]?.model_id });

        for await (const chunk of generator) {
            if (chunk.content) process.stdout.write(chunk.content);
        }
        console.log('\n✅ Fetch successful!');

    } catch (e) {
        console.error(`❌ Error testing ${name}:`, e);
        if (e.stack) console.error(e.stack);
    }
}

async function run() {
    await testPersona('Rem Rin');
    await testPersona('Aurora');
}

run();
