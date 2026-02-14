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

async function getUser() {
  const userId = 'cc81e11f-933a-41b1-a868-6be88ade8b1c';
  console.log('Fetching auth user details for:', userId);
  
  const { data: { user }, error } = await supabase.auth.admin.getUserById(userId);

  if (error) {
    console.error('Error fetching auth user:', error.message);
  } else if (user) {
    console.log('Auth user found:');
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('Metadata:', JSON.stringify(user.user_metadata, null, 2));
  } else {
    console.log('No auth user found for this ID.');
  }
}

getUser();
