
const { Client } = require("pg");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: ".env.local" });

const dbUrl = `postgresql://postgres:${process.env.ADMIN_PASSWORD}@db.wftsctqfiqbdyllxwagi.supabase.co:5432/postgres`;

async function applyMigrations() {
    console.log("🐘 Connecting to Postgres...");
    const client = new Client({
        connectionString: dbUrl,
    });

    try {
        await client.connect();
        console.log("✅ Connected to Postgres!");

        const migrations = [
            "supabase/migrations/20260206_fix_personas_and_buckets.sql",
            "supabase/migrations/20260208_add_persona_metadata_column.sql",
            "supabase/migrations/20260206_ai_studio.sql",
            "supabase/migrations/20260206_ai_studio_seeds.sql",
            "supabase/migrations/20260207_ai_studio_expanded_seeds.sql"
        ];

        for (const migrationPath of migrations) {
            console.log(`📜 Applying migration: ${migrationPath}`);
            const sql = fs.readFileSync(path.join(process.cwd(), migrationPath), "utf-8");
            // We split the SQL into individual statements if necessary, but pg.query(sql) often works for multiple commands
            await client.query(sql);
            console.log(`✅ Applied ${migrationPath}`);
        }

        console.log("✨ All migrations applied successfully!");
    } catch (err) {
        console.error("❌ Migration failed:", err.message);
    } finally {
        await client.end();
    }
}

applyMigrations();
