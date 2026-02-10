
require('dotenv').config({ path: '.env.local' });

async function testDeepSeekStreaming() {
    console.log('--- Testing Streaming DeepSeek Connectivity ---');
    const apiKey = process.env.DEEPSEEK_API_KEY;
    const url = 'https://api.deepseek.com/v1/chat/completions';

    if (!apiKey) {
        console.error('DEEPSEEK_API_KEY not found in .env.local');
        return;
    }

    const tools = [
        {
            type: 'function',
            function: {
                name: 'search_memories',
                description: 'Search your long-term memory for past conversations, facts, and experiences with the user.',
                parameters: {
                    type: 'object',
                    properties: {
                        query: { type: 'string' }
                    },
                    required: ['query']
                }
            }
        }
    ];

    try {
        console.log('Sending streaming request...');
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [{ role: 'user', content: 'What do you remember about our last chat?' }],
                tools: tools,
                stream: true
            })
        });

        console.log(`Status: ${response.status} ${response.statusText}`);
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            console.error('❌ Error response:', JSON.stringify(error, null, 2));
            return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let done = false;

        console.log('Streaming chunks:');
        while (!done) {
            const { value, done: doneReading } = await reader.read();
            done = doneReading;
            const chunkValue = decoder.decode(value);
            process.stdout.write(chunkValue);
        }
        console.log('\n✅ Stream complete');
    } catch (e) {
        console.error('❌ Fetch failed:', e.message);
        if (e.stack) console.error(e.stack);
        if (e.cause) console.error('Cause:', e.cause);
    }
}

testDeepSeekStreaming();
