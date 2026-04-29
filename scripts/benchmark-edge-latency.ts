import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Setup __dirname for ESM if needed, but we'll try to run with ts-node
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const PERSONA_ID = 'cb818d07-fab6-4035-971d-5d54a8a6a11a'; // Aurora
const USER_ID = 'a883479e-a6c5-44c3-8242-e271ffd7b643';
const NUM_CALLS = 10;

async function benchmark() {
  console.log(`\n🚀 LATENCY BENCHMARK: Supabase Edge Function "universal-console"`);
  console.log(`🔗 URL: ${SUPABASE_URL}/functions/v1/universal-console`);
  console.log(`👤 Persona ID: ${PERSONA_ID}`);
  console.log(`🔑 User ID: ${USER_ID}\n`);
  
  const results: number[] = [];
  
  for (let i = 1; i <= NUM_CALLS; i++) {
    const start = performance.now();
    
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/universal-console`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({
          message: "Benchmark test message " + i,
          persona_ids: [PERSONA_ID],
          user_id: USER_ID,
          history: []
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      // Measurement until first chunk of stream (Time to First Byte / Response)
      const reader = response.body?.getReader();
      if (reader) {
        await reader.read(); // Read first chunk
        const end = performance.now();
        results.push(end - start);
        console.log(`  [${i}/10] Latency: ${(end - start).toFixed(2)}ms`);
        reader.cancel(); // Close the stream
      } else {
        const end = performance.now();
        results.push(end - start);
        console.log(`  [${i}/10] Latency: ${(end - start).toFixed(2)}ms (fallback)`);
      }
    } catch (error: any) {
      console.error(`  [${i}/10] FAILED: ${error.message}`);
    }
  }

  if (results.length === 0) {
    console.error("\n❌ All calls failed. Benchmark aborted.");
    return;
  }

  // Calculate stats
  const coldStart = results[0];
  const warmTimes = results.slice(1);
  const average = results.reduce((a, b) => a + b, 0) / results.length;
  
  const sorted = [...results].sort((a, b) => a - b);
  const p95Index = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95));
  const p95 = sorted[p95Index];

  const overheadExceeded = average > 200;
  const recommendation = overheadExceeded ? "PATH B RECOMMENDED (Move logic to Next.js server)" : "PATH A (Edge Function Performance Acceptable)";

  const summary = {
    url: `${SUPABASE_URL}/functions/v1/universal-console`,
    timestamp: new Date().toISOString(),
    coldStartMs: parseFloat(coldStart.toFixed(2)),
    warmTimesMs: warmTimes.map(t => parseFloat(t.toFixed(2))),
    averageMs: parseFloat(average.toFixed(2)),
    p95Ms: parseFloat(p95.toFixed(2)),
    overheadExceeded,
    recommendation
  };

  console.log("\n📊 RESULTS TABLE:");
  console.table({
    "Cold Start": { "Value (ms)": coldStart.toFixed(2) },
    "Average": { "Value (ms)": average.toFixed(2) },
    "P95": { "Value (ms)": p95.toFixed(2) },
    "Recommendation": { "Value (ms)": recommendation }
  });

  if (overheadExceeded) {
    console.log("\n⚠️  WARNING: Average overhead > 200ms. PATH B RECOMMENDED.");
  }

  // Save results
  fs.writeFileSync(path.join(__dirname, 'benchmark-results.json'), JSON.stringify(summary, null, 2));
  console.log(`\n💾 Results saved to scripts/benchmark-results.json\n`);
}

benchmark();
