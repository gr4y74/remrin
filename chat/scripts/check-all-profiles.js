
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkOtherProfiles() {
    // IDs from list-users.js
    const ids = [
        '757a0793-0719-4abb-811e-25e4a7da69ab', // ibnsnow
        '5ee5ae79-01c9-4729-a99c-40dc68a51877', // sosu.remrin
        'cc81e11f-933a-41b1-a868-6be88ade8b1c', // jwgr4y
        '2059bfbd-a3aa-4300-ac04-8ee379573da9', // gr4y74
        '04f219c3-7206-4807-a9a6-73072c351ae7'  // sui
    ];

    console.log('Checking profiles...');
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, has_onboarded')
        .in('user_id', ids);

    if (error) {
        console.error('Error:', error);
        return;
    }

    const profileMap = {};
    profiles.forEach(p => profileMap[p.user_id] = p);

    ids.forEach(id => {
        const p = profileMap[id];
        if (p) {
            console.log(`✅ User ${id}: ${p.display_name} (Onboarded: ${p.has_onboarded})`);
        } else {
            console.log(`❌ User ${id}: NO PROFILE`);
        }
    });

    // Check wallets for Remrin (5ee5ae79) vs Phantom (ac5edd6c)
    console.log('\nChecking wallets...');
    const { data: wallets } = await supabase.from('wallets').select('user_id, tier').in('user_id', [...ids, 'ac5edd6c-7dcc-465a-bd8f-d4a5d592589d']);
    wallets.forEach(w => console.log(`Wallet found for ${w.user_id}: Tier=${w.tier}`));
}

checkOtherProfiles();
