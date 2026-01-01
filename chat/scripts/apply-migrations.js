const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://wftsctqfiqbdyllxwagi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmdHNjdHFmaXFiZHlsbHh3YWdpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDk1Njc3MCwiZXhwIjoyMDUwNTMyNzcwfQ.xWyPAqfZEQBGLNjlJMBZqwVLvCjQJkTbpZKrJRNNqRs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration(filePath) {
    console.log(`\n📄 Running migration: ${path.basename(filePath)}`);

    const sql = fs.readFileSync(filePath, 'utf8');

    // Split by semicolons and filter out comments and empty statements
    const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--') && s !== '');

    console.log(`   Found ${statements.length} SQL statements`);

    for (let i = 0; i < statements.length; i++) {
        const statement = statements[i] + ';';

        // Skip comment-only statements
        if (statement.trim().startsWith('--')) continue;

        try {
            const { data, error } = await supabase.rpc('exec_sql', { sql: statement });

            if (error) {
                console.error(`   ❌ Error on statement ${i + 1}:`, error.message);
                console.error(`   Statement: ${statement.substring(0, 100)}...`);
                throw error;
            }

            if ((i + 1) % 10 === 0) {
                console.log(`   ✓ Executed ${i + 1}/${statements.length} statements`);
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
        console.log('🚀 Starting database migrations...\n');

        // Migration 1
        await runMigration('supabase/migrations/20241230_tier_feature_system.sql');

        // Migration 2
        await runMigration('supabase/migrations/20241230_tier_auto_update.sql');

        console.log('\n🎉 All migrations completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('\n💥 Migration failed:', error);
        process.exit(1);
    }
}

main();
