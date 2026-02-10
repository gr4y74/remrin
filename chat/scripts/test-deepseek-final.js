
require('dotenv').config({ path: '.env.local' });

async function testDeepSeekUpdated() {
    console.log('--- Testing Updated DeepSeek Endpoint ---');
    const apiKey = process.env.DEEPSEEK_API_KEY;
    // Updated URL without /v1
    const url = 'https://api.deepseek.com/chat/completions';

    if (!apiKey) {
        console.error('DEEPSEEK_API_KEY not found in .env.local');
        return;
    }

    console.log(`URL: ${url}`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [{ role: 'user', content: 'Ping' }],
                stream: false
            })
        });

        console.log(`Status: ${response.status} ${response.statusText}`);
        const data = await response.json();
        if (response.ok) {
            console.log('✅ Success! Data received.');
        } else {
            console.error('❌ Error response:', JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error('❌ Fetch failed:', e.message);
    }
}

testDeepSeekUpdated();
