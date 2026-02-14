import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function queryUser() {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('username', 'GreatRabbit')
    .single();

  if (error) {
    console.error('Error fetching user:', error.message);
  } else {
    console.log('User found:', JSON.stringify(data, null, 2));
    
    // Also try to get email from auth.users if we have service role
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(data.user_id);
    if (authError) {
       console.error('Error fetching auth user:', authError.message);
    } else {
       console.log('Auth user email:', authUser.user.email);
    }
  }
}

queryUser();
