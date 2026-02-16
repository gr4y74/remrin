
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dns = require('dns');
const util = require('util');
require('dotenv').config({ path: '.env.local' });

const resolve4 = util.promisify(dns.resolve4);
const projectRef = 'wftsctqfiqbdyllxwagi';
const rawPassword = process.env.ADMIN_PASSWORD;

async function runPoolerMigration() {
    console.log('--- Phase 1: Pooler Migration ---');
    const filePath = path.join(process.cwd(), 'scripts/v3-phase1-db.sql');

    if (!fs.existsSync(filePath)) {
        console.error(`❌ SQL file not found: ${filePath}`);
        process.exit(1);
    }

    try {
        console.log('🔍 Resolving Pooler IPv4 (EU-WEST-3)...');
        let ip;
        try {
            const ips = await resolve4('aws-0-eu-west-3.pooler.supabase.com');
            ip = ips[0];
            console.log(`✅ Pooler IP: ${ip}`);
        } catch (e) {
            console.log('⚠️ Failed to resolve aws-0, trying aws-1...');
            const ips = await resolve4('aws-1-eu-west-3.pooler.supabase.com');
            ip = ips[0];
            console.log(`✅ Pooler IP: ${ip}`);
        }

        const client = new Client({
            host: ip,
            port: 6543,
            user: `postgres.${projectRef}`,
            password: rawPassword,
            database: 'postgres',
            ssl: {
                rejectUnauthorized: false,
                servername: 'aws-0-eu-west-3.pooler.supabase.com'
            }
        });

        console.log(`🔌 Connecting to ${ip}:6543 as postgres.${projectRef}...`);
        await client.connect();
        console.log('✅ Connected successfully!');

        const sql = fs.readFileSync(filePath, 'utf8');
        console.log('🚀 Executing SQL...');
        await client.query(sql);

        console.log('✅ Phase 1 Migration applied successfully!');
        await client.end();
        process.exit(0);

    } catch (err) {
        console.error('💥 Migration failed:', err);
        process.exit(1);
    }
}

runPoolerMigration();
