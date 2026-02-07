
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function testApi() {
    const url = 'http://localhost:3000/api/v2/studio/models?type=image';
    console.log(`📡 Fetching models from ${url}...`);
    try {
        const res = await fetch(url);
        const data = await res.json();
        console.log("📊 API Response:", JSON.stringify(data, null, 2));
    } catch (err: any) {
        console.error("❌ API Fetch failed:", err.message);
    }
}

testApi();
