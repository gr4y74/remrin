import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import Replicate from "replicate"

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const predictionId = searchParams.get("id")
        const personaId = searchParams.get("personaId")

        if (!predictionId || !personaId) {
            return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
        }

        const cookieStore = cookies()
        const supabase = createClient(cookieStore)

        // Auth check - ensure user owns this persona
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        // Replicate check
        const replicate = new Replicate({
            auth: process.env.REPLICATE_API_TOKEN,
        })

        const prediction = await replicate.predictions.get(predictionId)

        if (prediction.status === "succeeded") {
            const outputUrl = prediction.output
            // Output might be a string (URL) or array of strings. 
            // Seedance usually returns a video URL or array of them.

            const videoUrl = Array.isArray(outputUrl) ? outputUrl[0] : outputUrl

            // Update Database
            const { error } = await supabase
                .from("personas")
                .update({ video_url: videoUrl })
                .eq("id", personaId)
                .eq("owner_id", user.id) // Security check

            if (error) throw error

            return NextResponse.json({ status: "succeeded", videoUrl })
        } else if (prediction.status === "failed" || prediction.status === "canceled") {
            return NextResponse.json({ status: "failed", error: prediction.error })
        } else {
            // starting, processing
            return NextResponse.json({ status: prediction.status })
        }

    } catch (error: any) {
        console.error("Spark Status Error:", error)
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
    }
}
