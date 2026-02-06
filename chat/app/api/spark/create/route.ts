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
        let { persona_id, image_url } = json

        if (!persona_id || !image_url) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        // Handle local images (for default characters like Kess)
        // We ensure image_url is a full absolute URL for Replicate
        if (image_url.startsWith("/")) {
            const host = request.headers.get("host") || "remrin.ai"
            const protocol = host.includes("localhost") ? "http" : "https"
            image_url = `${protocol}://${host}${image_url}`
            console.log(`Converted local path to absolute URL for Replicate: ${image_url}`)
        }

        // 1. Check Ownership
        const { data: persona } = await supabase
            .from("personas")
            .select("creator_id, name, description")
            .eq("id", persona_id)
            .single()

        if (!persona || persona.creator_id !== user.id) {
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
            version: "3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438", // Stable Video Diffusion (standard)
            input: {
                input_image: image_url,
                video_length: "25_frames_with_svd_xt",
                sizing_strategy: "maintain_aspect_ratio",
                frames_per_second: 6,
                motion_bucket_id: 127, // Standard motion
                cond_aug: 0.02, // Low noise = high fidelity to original image
                decoding_t: 7
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
