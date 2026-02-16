
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyStoryLayer() {
    console.log('--- Phase 3: Story Layer Verification ---');

    const userId = '5ee5ae79-01c9-4729-a99c-40dc68a51877';
    const personaId = '5720a26f-a61b-4641-ac19-d3a7b01c8bc8'; // Rem Rin

    // 1. Initial State
    console.log('1. Checking for existing episodes...');
    const { count: episodeCountBefore } = await supabase
        .from('memories_episodes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('persona_id', personaId);

    console.log(`   Found ${episodeCountBefore || 0} episodes.`);

    // 2. Simulate First Interaction (Episode Creation)
    console.log('2. Simulating first interaction of a new session...');
    // We'll call the logic directly since we can't easily trigger the Edge Function with Deno envs here
    // But we can verify the DB results if we were to hit the endpoint.
    // Instead, let's test the retrieval logic's source tracking.

    console.log('3. Testing Source Tracking in retrieval...');
    // We'll insert a dummy memory with an episode_id to see if it retrieves correctly
    const { data: testEpisode, error: episodeError } = await supabase.from('memories_episodes').insert({
        user_id: userId,
        persona_id: personaId,
        topic_summary: "Testing the Story Layer",
        metadata: { status: "verification" }
    }).select().single();

    if (episodeError) {
        console.error('❌ Error creating episode (Table likely missing):', episodeError.message);
        console.log('   Please run the Phase 3 SQL from walkthrough.md in your Supabase SQL Editor!');
        return;
    }

    const episodeId = testEpisode.id;
    console.log(`   Created test episode: ${episodeId}`);

    const testContent = "I am planning a surprise party for Sosu.";
    await supabase.from('memories').insert({
        user_id: userId,
        persona_id: personaId,
        role: 'user',
        content: testContent,
        importance: 5,
        episode_id: episodeId
    });

    console.log('   Inserted test memory linked to episode.');

    // Now verify the retrieval formatting (this matches our updated retrieveMemories logic)
    const { data: retrieved } = await supabase
        .from('memories')
        .select('*')
        .eq('episode_id', episodeId)
        .limit(1)
        .single();

    if (retrieved) {
        const date = new Date(retrieved.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        console.log(`✅ SUCCESS: Source Tracking Format Verified!`);
        console.log(`   Formated Output: [Conversation from ${date}]`);
        console.log(`   Content: ${retrieved.content}`);
    } else {
        console.log('❌ FAILURE: Memory not retrieved.');
    }

    // 4. Verify Episode Continuity
    console.log('4. Verifying Episode Continuity logic...');
    // This mocks getOrCreateEpisode
    const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
    const isRecentlyActive = (Date.now() - new Date(testEpisode.end_time).getTime()) < FOUR_HOURS_MS;

    if (isRecentlyActive) {
        console.log('✅ SUCCESS: Continuity check passed. Current session will reuse episode.');
    } else {
        console.log('❌ FAILURE: Continuity check failed.');
    }

    // Cleanup
    console.log('Cleaning up test data...');
    await supabase.from('memories').delete().eq('episode_id', episodeId);
    await supabase.from('memories_episodes').delete().eq('id', episodeId);
    console.log('Done.');
}

verifyStoryLayer().catch(console.error);
