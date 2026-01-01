import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
    try {
        const { text, voiceId } = await req.json()

        if (!text) {
            return NextResponse.json(
                { error: "Text is required" },
                { status: 400 }
            )
        }

        const apiKey = process.env.ELEVENLABS_API_KEY
        if (!apiKey) {
            console.error("ELEVENLABS_API_KEY is missing")
            return NextResponse.json(
                { error: "Server configuration error" },
                { status: 500 }
            )
        }

        // Default voice ID (Rachel) if none provided
        const finalVoiceId = voiceId || "21m00Tcm4TlvDq8ikWAM"

        const response = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${finalVoiceId}`,
            {
                method: "POST",
                headers: {
                    Accept: "audio/mpeg",
                    "Content-Type": "application/json",
                    "xi-api-key": apiKey,
                },
                body: JSON.stringify({
                    text,
                    model_id: "eleven_monolingual_v1",
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.5,
                    },
                }),
            }
        )

        if (!response.ok) {
            const errorText = await response.text()
            console.error("ElevenLabs API Error:", errorText)
            return NextResponse.json(
                { error: "Failed to generate speech" },
                { status: response.status }
            )
        }

        const audioBuffer = await response.arrayBuffer()

        return new NextResponse(audioBuffer, {
            headers: {
                "Content-Type": "audio/mpeg",
                "Content-Length": audioBuffer.byteLength.toString(),
            },
        })
    } catch (error) {
        console.error("TTS Route Error:", error)
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}
