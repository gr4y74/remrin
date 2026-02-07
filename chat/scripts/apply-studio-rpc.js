
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration(filePath) {
    console.log(`\n📄 Running migration: ${path.basename(filePath)}`);
    const sql = fs.readFileSync(filePath, 'utf8');

    // Split by semicolons for exec_sql
    const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--') && s !== '');

    console.log(`   Found ${statements.length} SQL statements`);

    for (let i = 0; i < statements.length; i++) {
        const statement = statements[i] + ';';
        try {
            const { error } = await supabase.rpc('exec_sql', { sql: statement });
            if (error) {
                console.error(`   ❌ Error on statement ${i + 1}:`, error.message);
                // Continue if table already exists
                if (error.message.includes("already exists")) {
                    console.log("   (Skipping since it already exists)");
                } else {
                    throw error;
                }
            }
        } catch (err) {
            console.error(`   ❌ Failed on statement ${i + 1}`);
            throw err;
        }
    }
    console.log(`   ✅ Migration complete!`);
}

async function main() {
    try {
        console.log('🚀 Applying AI Studio Migrations...\n');

        await runMigration('supabase/migrations/20260206_ai_studio.sql');
        await runMigration('supabase/migrations/20260207_ai_studio_expanded_seeds.sql');

        console.log('\n🎉 All studio migrations completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('\n💥 Migration failed:', error);
        process.exit(1);
    }
}

main();
