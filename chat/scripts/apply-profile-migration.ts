// Apply profile system migration using Supabase client
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function applyMigration() {
    try {
        const migrationPath = join(process.cwd(), 'supabase/migrations/20260109_profile_system.sql');
        const sql = readFileSync(migrationPath, 'utf-8');

        console.log('Applying profile system migration...');

        // Execute the SQL
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

        if (error) {
            console.error('Migration failed:', error);
            process.exit(1);
        }

        console.log('✅ Migration applied successfully!');
        console.log('Created tables: user_profiles, achievements, user_achievements, profile_analytics, profile_themes, featured_creations, social_links');
        console.log('Seeded 20 achievement badges');

    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

applyMigration();
