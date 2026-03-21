import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Use fixed path for .env.local to avoid __dirname issues in ESM
const envPath = '/mnt/Data68/remrin/chat/.env.local';
dotenv.config({ path: envPath });

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

async function createTestUser() {
    const email = `test-onboarding-${Date.now()}@example.com`;
    const password = 'TestPassword123!';

    console.log(`Creating test user: ${email}`);

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true
    });

    if (error) {
        console.error('Error creating test user:', error);
        process.exit(1);
    }

    console.log('Test user created:', data.user?.id);

    // Output the credentials for the test runner
    if (data.user) {
        console.log(`CREDENTIALS:${email}:${password}:${data.user.id}`);
    }
}

createTestUser();
