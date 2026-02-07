
import { Client } from "pg";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

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
            "supabase/migrations/20260206_ai_studio.sql",
            "supabase/migrations/20260206_ai_studio_seeds.sql",
            "supabase/migrations/20260207_ai_studio_expanded_seeds.sql"
        ];

        for (const migrationPath of migrations) {
            console.log(`📜 Applying migration: ${migrationPath}`);
            const sql = fs.readFileSync(path.join(process.cwd(), migrationPath), "utf-8");
            await client.query(sql);
            console.log(`✅ Applied ${migrationPath}`);
        }

        console.log("✨ All migrations applied successfully!");
    } catch (err: any) {
        console.error("❌ Migration failed:", err.message);
        if (err.message.includes("already exists")) {
            console.log("Note: Some tables/records already exist, which is fine if they match.");
        }
    } finally {
        await client.end();
    }
}

applyMigrations();
