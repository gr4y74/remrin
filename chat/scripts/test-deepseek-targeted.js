
require('dotenv').config({ path: '.env.local' });

async function testDeepSeek() {
    console.log('--- Testing Targeted DeepSeek Connectivity ---');
    const apiKey = process.env.DEEPSEEK_API_KEY;
    // EXACT SAME URL as in lib/chat-engine/types.ts
    const url = 'https://api.deepseek.com/v1/chat/completions';

    if (!apiKey) {
        console.error('DEEPSEEK_API_KEY not found in .env.local');
        return;
    }

    console.log(`URL: ${url}`);

    // Tools as defined in MEMORY_TOOLS
    const tools = [
        {
            type: 'function',
            function: {
                name: 'search_memories',
                description: 'Search your long-term memory for past conversations, facts, and experiences with the user. Use this when the user asks "do you remember...", "what did we talk about...", or asks about specific past dates/events.',
                parameters: {
                    type: 'object',
                    properties: {
                        query: {
                            type: 'string',
                            description: 'The search query to look up in the memory database. Be descriptive.'
                        },
                        limit: {
                            type: 'number',
                            description: 'Maximum number of memories to retrieve (1-20). Default is 10.',
                            default: 10
                        },
                        domain: {
                            type: 'string',
                            description: 'Optional filter for memory domain (e.g., "personal", "universal")'
                        }
                    },
                    required: ['query']
                }
            }
        }
    ];

    try {
        console.log('Sending request with tools...');
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
                stream: false
            })
        });

        console.log(`Status: ${response.status} ${response.statusText}`);
        const data = await response.json();
        if (response.ok) {
            console.log('✅ Response content:', data.choices[0].message.content);
            if (data.choices[0].message.tool_calls) {
                console.log('🛠️ Tool Calls:', JSON.stringify(data.choices[0].message.tool_calls, null, 2));
            }
        } else {
            console.error('❌ Error response:', JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error('❌ Fetch failed:', e.message);
        if (e.stack) console.error(e.stack);
    }
}

testDeepSeek();
