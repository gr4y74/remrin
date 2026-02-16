
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPersona() {
    console.log('Searching for persona named "Rem Rin" or similar...');
    const { data: personas, error } = await supabase
        .from('personas')
        .select('id, name')
        .ilike('name', '%Rem%');

    if (error) {
        console.error('Error fetching personas:', error);
        return;
    }

    console.log('Matches:');
    personas.forEach(p => console.log(`- ID: ${p.id}, Name: ${p.name}`));
}

checkPersona().catch(console.error);
