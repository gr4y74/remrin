
const { Client } = require("pg");
const dotenv = require("dotenv");

dotenv.config({ path: ".env.local" });

const dbUrl = `postgresql://postgres:${process.env.ADMIN_PASSWORD}@db.wftsctqfiqbdyllxwagi.supabase.co:5432/postgres`;

async function listColumns() {
    const client = new Client({
        connectionString: dbUrl,
    });

    try {
        await client.connect();
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'personas'
            ORDER BY ordinal_position;
        `);
        console.log("Columns in 'personas' table:");
        res.rows.forEach(row => {
            console.log(`- ${row.column_name} (${row.data_type})`);
        });
    } catch (err) {
        console.error("Failed to list columns:", err.message);
    } finally {
        await client.end();
    }
}

listColumns();
