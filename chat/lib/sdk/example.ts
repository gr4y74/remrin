import { RemrinClient } from './remrin-client';

/**
 * Example usage of the Remrin JS SDK.
 * 
 * To run this example:
 * 1. Ensure you have a valid sandbox key from /developers
 * 2. Update the apiKey and personaId below
 * 3. Run with: npx ts-node example.ts
 */
async function main() {
    const apiKey = 'rmrn_sk_YOUR_SANDBOX_KEY';
    const personaId = 'YOUR_PERSONA_ID';

    const client = new RemrinClient(apiKey);

    console.log('--- Starting Stream ---');

    try {
        const stream = client.chat.stream({
            personaId,
            messages: [
                { role: 'user', content: 'Hello! Who are you and what is your purpose?' }
            ]
        });

        for await (const chunk of stream) {
            if (chunk.content) {
                process.stdout.write(chunk.content);
            }
            
            if (chunk.isDone) {
                console.log('\n--- Stream Complete ---');
            }
        }
    } catch (error) {
        console.error('Failed to stream:', error);
    }
}

main();
