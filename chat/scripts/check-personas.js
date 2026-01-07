
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPersonas() {
    const userId = '5ee5ae79-01c9-4729-a99c-40dc68a51877';
    console.log('Checking personas for Remrin:', userId);

    const { data: personas, error } = await supabase
        .from('personas')
        .select('id, name')
        .eq('owner_id', userId);

    if (error) {
        console.error('Error fetching personas:', error);
        return;
    }

    console.log(`Found ${personas.length} personas.`);
    personas.forEach(p => console.log(`- ${p.name} (${p.id})`));
}

checkPersonas();
