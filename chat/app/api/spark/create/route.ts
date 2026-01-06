import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import Replicate from "replicate"

const COST_AETHER = 50

export async function POST(request: Request) {
    try {
        const cookieStore = cookies()
        const supabase = createClient(cookieStore)
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const json = await request.json()
        const { persona_id, image_url } = json

        if (!persona_id || !image_url) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        // 1. Check Ownership
        const { data: persona } = await supabase
            .from("personas")
            .select("owner_id, name, description")
            .eq("id", persona_id)
            .single()

        if (!persona || persona.owner_id !== user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        // 2. Check & Deduct Balance
        const { data: wallet } = await supabase
            .from("wallets")
            .select("balance_aether, total_spent")
            .eq("user_id", user.id)
            .single()

        if (!wallet || wallet.balance_aether < COST_AETHER) {
            return NextResponse.json({ error: "Insufficient Aether" }, { status: 402 })
        }

        // Deduct
        const { error: deductError } = await supabase
            .from("wallets")
            .update({
                balance_aether: wallet.balance_aether - COST_AETHER,
                total_spent: (wallet.total_spent || 0) + COST_AETHER
            })
            .eq("user_id", user.id)

        if (deductError) {
            console.error("Deduct Error:", deductError)
            return NextResponse.json({ error: "Transaction failed" }, { status: 500 })
        }

        // 3. Call Replicate
        const replicate = new Replicate({
            auth: process.env.REPLICATE_API_TOKEN,
        })

        const prediction = await replicate.predictions.create({
            model: "bytedance/seedance-1-pro",
            input: {
                source_image: image_url,
                // Removing persona.name from prompt to avoid literal interpretation of names like "Cupcake" (which resulted in a literal cupcake)
                // specific instruction for seedance to rely on the image
                prompt: `A living breathing portrait of ${persona.description || "a character"}, subtle breathing motion, high quality, 8k, photorealistic`,
                fps: 24,
                width: 512,
                height: 896,
                motion_intensity: 4
            }
        })

        if (prediction?.error) {
            console.error("Replicate Error:", prediction.error)
            return NextResponse.json({ error: "Generation failed" }, { status: 500 })
        }

        return NextResponse.json({ predictionId: prediction.id })

    } catch (error: any) {
        console.error("Spark Error:", error)
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
    }
}
