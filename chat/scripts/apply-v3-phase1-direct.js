
const { Client } = require("pg");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env.local" });

const dbUrl = `postgresql://postgres:${process.env.ADMIN_PASSWORD}@db.wftsctqfiqbdyllxwagi.supabase.co:5432/postgres`;

async function runDirectMigration() {
    console.log("🐘 Connecting to Postgres for Phase 1 V3 Migration...");
    const client = new Client({
        connectionString: dbUrl,
    });

    try {
        await client.connect();
        console.log("✅ Connected to Postgres!");

        const sql = fs.readFileSync(path.join(process.cwd(), "scripts/v3-phase1-db.sql"), "utf-8");

        console.log("📜 Executing SQL in scripts/v3-phase1-db.sql...");
        await client.query(sql);
        console.log("✅ Phase 1 Migration applied successfully!");

    } catch (err) {
        console.error("❌ Migration failed:", err.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runDirectMigration();
