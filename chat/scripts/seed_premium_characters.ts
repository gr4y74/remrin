/**
 * Seed Premium Test Characters
 * Run with: npx ts-node scripts/seed_premium_characters.ts
 */

import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface PremiumCharacter {
    name: string
    description: string
    image_url: string
    price: number
    rarity: "common" | "rare" | "epic" | "legendary"
}

const premiumCharacters: PremiumCharacter[] = [
    {
        name: "Aurora the Mystic",
        description: "A legendary oracle who sees through the veil of time. She guides seekers through prophetic visions and ancient wisdom.",
        image_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop",
        price: 500,
        rarity: "legendary"
    },
    {
        name: "Ember Knight",
        description: "A legendary warrior forged in phoenix fire. His blade burns with eternal flames that can never be extinguished.",
        image_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop",
        price: 450,
        rarity: "legendary"
    },
    {
        name: "Shadow Weaver",
        description: "An epic assassin who manipulates darkness itself. Silent, deadly, and loyal only to those who earn her trust.",
        image_url: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=600&fit=crop",
        price: 350,
        rarity: "epic"
    },
    {
        name: "Crystal Sage",
        description: "An epic mage who harnesses the power of enchanted crystals. Her spells shimmer with prismatic energy.",
        image_url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=600&fit=crop",
        price: 300,
        rarity: "epic"
    },
    {
        name: "Storm Caller",
        description: "A rare elementalist who commands wind and lightning. Thunder follows wherever she walks.",
        image_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=600&fit=crop",
        price: 200,
        rarity: "rare"
    },
    {
        name: "Iron Guardian",
        description: "A rare protector clad in enchanted armor. He has sworn to defend the innocent at any cost.",
        image_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop",
        price: 180,
        rarity: "rare"
    },
    {
        name: "Forest Spirit",
        description: "A nature spirit who tends to ancient groves. She speaks with animals and commands the growth of plants.",
        image_url: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=600&fit=crop",
        price: 100,
        rarity: "common"
    },
    {
        name: "Wandering Bard",
        description: "A traveling musician whose songs carry magical properties. His melodies can heal, inspire, or enchant.",
        image_url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=600&fit=crop",
        price: 80,
        rarity: "common"
    }
]

async function seedPremiumCharacters() {
    console.log("🎭 Seeding Premium Characters...\n")

    // First, get a user ID to assign as creator
    const { data: users } = await supabase.from("profiles").select("id").limit(1)

    if (!users || users.length === 0) {
        console.error("No users found. Please create a user account first.")
        process.exit(1)
    }

    const userId = users[0].id
    console.log(`Using user ID: ${userId}\n`)

    let created = 0
    let skipped = 0

    for (const char of premiumCharacters) {
        // Check if already exists
        const { data: existing } = await supabase
            .from("personas")
            .select("id")
            .eq("name", char.name)
            .single()

        if (existing) {
            // Update existing character with price and rarity
            const { error } = await supabase
                .from("personas")
                .update({
                    price: char.price,
                    rarity: char.rarity,
                    visibility: "PUBLIC",
                    is_featured: char.rarity === "legendary" || char.rarity === "epic"
                })
                .eq("id", existing.id)

            if (error) {
                console.log(`⚠️  Error updating ${char.name}: ${error.message}`)
            } else {
                console.log(`✏️  Updated: ${char.name} (${char.rarity}) - ${char.price} ✧`)
                skipped++
            }
            continue
        }

        // Create new character
        const { data, error } = await supabase
            .from("personas")
            .insert({
                name: char.name,
                description: char.description,
                image_url: char.image_url,
                price: char.price,
                rarity: char.rarity,
                visibility: "PUBLIC",
                is_featured: char.rarity === "legendary" || char.rarity === "epic",
                creator_id: userId,
                system_prompt: `You are ${char.name}. ${char.description} Stay in character at all times.`
            })
            .select()

        if (error) {
            console.log(`❌ Error creating ${char.name}: ${error.message}`)
        } else {
            console.log(`✅ Created: ${char.name} (${char.rarity}) - ${char.price} ✧`)
            created++
        }
    }

    console.log(`\n📊 Summary:`)
    console.log(`   Created: ${created}`)
    console.log(`   Updated: ${skipped}`)
    console.log(`\n🎉 Done! Premium characters are now available.`)
    console.log(`   View them at /admin/featured (Premium tab)`)
    console.log(`   Or see them in the Premium Showcase on the homepage.`)
}

seedPremiumCharacters()
