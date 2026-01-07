
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixWallets() {
    // Real Users
    const users = [
        '5ee5ae79-01c9-4729-a99c-40dc68a51877', // Remrin
        '2059bfbd-a3aa-4300-ac04-8ee379573da9', // Sosu
        'cc81e11f-933a-41b1-a868-6be88ade8b1c', // Sosu2
        '757a0793-0719-4abb-811e-25e4a7da69ab'  // ibnsnow
    ];

    console.log('💎 Upgrading all active users to Soul Weaver...');

    for (const userId of users) {
        // Check if wallet exists
        const { data: wallet } = await supabase.from('wallets').select('*').eq('user_id', userId).single();

        if (wallet) {
            await supabase.from('wallets').update({
                tier: 'soul_weaver',
                balance_brain: Math.max(wallet.balance_brain || 0, 5000)
            }).eq('user_id', userId);
            console.log(`Updated wallet for ${userId}`);
        } else {
            await supabase.from('wallets').insert({
                user_id: userId,
                tier: 'soul_weaver',
                balance_brain: 5000,
                balance_aether: 0,
                is_creator: true
            });
            console.log(`Created wallet for ${userId}`);
        }
    }

    console.log('💀 Deleting zombie wallet ac5edd6c...');
    await supabase.from('wallets').delete().eq('user_id', 'ac5edd6c-7dcc-465a-bd8f-d4a5d592589d');
    console.log('Done.');
}

fixWallets();
