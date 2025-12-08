import { createClient } from '@supabase/supabase-js';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

// --- CONFIGURATION ---
// 1. Setup Keys
const supabaseUrl = process.env.SUPABASE_URL;
// Use SERVICE_ROLE (God Key) for uploads to bypass RLS!
const supabaseKey = process.env.SUPABASE_KEY; 
const googleKey = process.env.GOOGLE_API_KEY;

if (!supabaseUrl || !supabaseKey || !googleKey) {
    console.error("❌ MISSING KEYS! Check your .env file.");
    console.error("Need: SUPABASE_URL, SUPABASE_KEY, GOOGLE_API_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 2. Select the File (V8 first, then change to V6)
const SOUL_FILE_PATH = './rem_v6_update_dec5.txt'; 

// --- HELPER: GOOGLE EMBEDDING (With Retry Logic) ---
async function getGoogleEmbedding(text) {
    // Remove newlines to clean up data
    const cleanText = text.replace(/\n/g, ' ');
    
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${googleKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'models/text-embedding-004',
                content: { parts: [{ text: cleanText }] }
            })
        }
    );

    if (!response.ok) {
        throw new Error(`Google API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.embedding.values;
}

// --- MAIN ENGINE ---
async function mergeSouls() {
    console.log(`... Reading Soul File: ${SOUL_FILE_PATH} ...`);
    
    try {
        const text = fs.readFileSync(SOUL_FILE_PATH, 'utf-8');

        // Split text into "Thoughts"
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000, // Slightly larger chunks for better context
            chunkOverlap: 100,
        });
        const docs = await splitter.createDocuments([text]);

        console.log(`... Found ${docs.length} memory chunks.`);
        console.log("... Starting Google Injection (Slow Mode to avoid 429s)...");

        for (let i = 0; i < docs.length; i++) {
            const doc = docs[i];
            
            try {
                // 1. Get Vector from Google
                const vector = await getGoogleEmbedding(doc.pageContent);

                // 2. Upload to Supabase
                const { error } = await supabase
                    .from('memories') // Writing directly to memories table
                    .insert({
                        user_id: 'sosu_main',
                        persona_id: 'rem',
                        role: 'system_knowledge', // Special role for these uploads
                        content: doc.pageContent,
                        embedding: vector
                    });
                    
                if (error) throw error;

                console.log(`✅ Saved chunk ${i + 1}/${docs.length}`);

                // 3. THE SAFETY BRAKE (Sleep for 4 seconds)
                // Google Free Tier = 15 requests per minute. 
                // 60 seconds / 15 = 4 seconds per request.
                await new Promise(r => setTimeout(r, 4000));

            } catch (err) {
                console.error(`❌ Failed Chunk ${i}:`, err.message);
                // If we hit a rate limit, wait longer (60s) then continue
                if (err.message.includes('429')) {
                    console.log("⏳ Hit Speed Limit. Cooling down for 60s...");
                    await new Promise(r => setTimeout(r, 60000));
                    i--; // Retry this chunk
                }
            }
        }
        console.log("🧬 MEGA ALPHA REM IS ALIVE.");
        
    } catch (err) {
        console.error("❌ ERROR:", err.message);
    }
}

mergeSouls();