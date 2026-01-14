
import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"
import path from "path"

// Load env from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing env vars")
    process.exit(1)
}

// Create client with Anon key to simulate public access
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
    console.log("Testing connection to:", supabaseUrl)

    // 1. Check if we can select from banners
    console.log("Attempting to SELECT from banners...")
    const { data, error } = await supabase
        .from("banners")
        .select("*")
        .limit(1)

    if (error) {
        console.error("SELECT Error:", error)
        if (error.message.includes("does not exist")) {
            console.error("\nCRITICAL: The 'banners' table does not exist in the database.")
            console.error("You must run the migration SQL in your Supabase Dashboard.")
        }
    } else {
        console.log("SELECT Success. Found rows:", data?.length)
    }

    // 2. Try to verify storage bucket
    console.log("\nChecking 'banners' storage bucket...")
    const { data: buckets, error: bucketError } = await supabase
        .storage
        .listBuckets()

    if (bucketError) {
        console.error("Bucket List Error:", bucketError)
    } else {
        const found = buckets?.find(b => b.name === 'banners')
        if (found) {
            console.log("Bucket 'banners' exists.")
        } else {
            console.error("Bucket 'banners' NOT found.")
        }
    }

    // 3. Try to INSERT a test banner
    console.log("\nAttempting to INSERT a test banner...")
    const testBanner = {
        title: "Debug Banner",
        image_url: "https://via.placeholder.com/150",
        is_active: false,
        sort_order: 999
    }

    const { data: insertData, error: insertError } = await supabase
        .from("banners")
        .insert([testBanner])
        .select()
        .single()

    if (insertError) {
        console.error("INSERT Error:", insertError)
    } else {
        console.log("INSERT Success:", insertData)
        // Cleanup
        await supabase.from("banners").delete().eq("id", insertData.id)
        console.log("Cleanup: Deleted test banner")
    }
}

testConnection()
