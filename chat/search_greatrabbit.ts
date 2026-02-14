import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function search() {
  console.log('Searching for GreatRabbit...');
  
  const { data: userProfiles, error: upError } = await supabase
    .from('user_profiles')
    .select('*')
    .ilike('username', '%GreatRabbit%');

  if (upError) console.error('user_profiles error:', upError.message);
  else console.log('user_profiles results:', JSON.stringify(userProfiles, null, 2));

  const { data: profiles, error: pError } = await supabase
    .from('profiles')
    .select('*')
    .ilike('username', '%GreatRabbit%');

  if (pError) console.error('profiles error:', pError.message);
  else console.log('profiles results:', JSON.stringify(profiles, null, 2));

  // Also check auth users if we have service role
  const { data: authUsers, error: aError } = await supabase.auth.admin.listUsers();
  if (aError) {
    console.error('auth.users error:', aError.message);
  } else {
    const matched = authUsers.users.filter(u => 
      u.email?.includes('GreatRabbit') || 
      u.user_metadata?.username === 'GreatRabbit' ||
      u.user_metadata?.name === 'GreatRabbit'
    );
    console.log('auth.users matched:', JSON.stringify(matched, null, 2));
  }
}

search();
