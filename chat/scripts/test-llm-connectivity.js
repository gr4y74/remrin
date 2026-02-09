
require('dotenv').config({ path: '.env.local' });

async function testDeepSeek() {
    console.log('--- Testing DeepSeek Connectivity ---');
    const apiKey = process.env.DEEPSEEK_API_KEY;
    const url = process.env.OPENAI_BASE_URL + '/chat/completions'; // Since it points to DeepSeek

    if (!apiKey) {
        console.error('DEEPSEEK_API_KEY not found in .env.local');
        return;
    }

    console.log(`URL: ${url}`);
    console.log(`Key snippet: ${apiKey.substring(0, 10)}...`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [{ role: 'user', content: 'Hello' }],
                stream: false
            })
        });

        console.log(`Status: ${response.status} ${response.statusText}`);
        const data = await response.json();
        if (response.ok) {
            console.log('✅ Response:', data.choices[0].message.content);
        } else {
            console.error('❌ Error:', data);
        }
    } catch (e) {
        console.error('❌ Fetch failed:', e.message);
        if (e.stack) console.error(e.stack);
    }
}

testDeepSeek();
