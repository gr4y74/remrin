
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function transferOwnership() {
    const targetUserId = '5ee5ae79-01c9-4729-a99c-40dc68a51877'; // Remrin
    console.log(`🚀 Transferring all personas to user: ${targetUserId} (Remrin)...`);

    // 1. Get all personas
    const { data: personas, error: fetchError } = await supabase
        .from('personas')
        .select('id, name, owner_id');

    if (fetchError) {
        console.error('Error fetching personas:', fetchError);
        return;
    }

    console.log(`Found ${personas.length} personas.`);

    // 2. Filter valid personas to update (those not already owned by Remrin)
    const toUpdate = personas.filter(p => p.owner_id !== targetUserId);

    if (toUpdate.length === 0) {
        console.log('✅ All personas are already owned by Remrin.');
        return;
    }

    console.log(`Updating ${toUpdate.length} personas...`);
    const idsToUpdate = toUpdate.map(p => p.id);

    // 3. Update owner_id
    const { data: updated, error: updateError } = await supabase
        .from('personas')
        .update({ owner_id: targetUserId })
        .in('id', idsToUpdate)
        .select();

    if (updateError) {
        console.error('Error updating personas:', updateError);
    } else {
        console.log(`✅ Successfully transferred ${updated.length} personas.`);
        updated.forEach(p => console.log(`   - ${p.name}`));
    }
}

transferOwnership();
