/**
 * Test memory search API directly
 */

async function testMemorySearch() {
    console.log('--- Testing Memory Search API ---\n');

    const testQueries = [
        'Aurora-7-Nova',
        'quantum encryption',
        'late-night debugging',
        'secret code'
    ];

    for (const query of testQueries) {
        console.log(`\nTesting query: "${query}"`);

        try {
            const response = await fetch('http://localhost:3000/api/v2/memories/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    query,
                    personaId: '5720a26f-a61b-4641-ac19-d3a7b01c8bc8',
                    limit: 5
                })
            });

            if (!response.ok) {
                console.log(`❌ Status: ${response.status} ${response.statusText}`);
                continue;
            }

            const results = await response.json();
            console.log(`✅ Found ${results.length} results`);
            if (results.length > 0) {
                console.log('First result:', results[0].content.substring(0, 100) + '...');
            }
        } catch (e) {
            console.error(`❌ Error:`, e.message);
        }
    }
}

testMemorySearch();
