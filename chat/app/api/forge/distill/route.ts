import OpenAI from "openai"
import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"
export const maxDuration = 60

/**
 * POST /api/forge/distill
 * 
 * DNA Synthesis endpoint for the Soul Splicer.
 * Takes 1-5 archetype names and synthesizes them into a unified NBB.
 */
export async function POST(request: NextRequest) {
    try {
        const json = await request.json()
        const { donors } = json as { donors: string[] }

        if (!donors || donors.length < 1 || donors.length > 5) {
            return NextResponse.json(
                { error: "Please provide 1-5 archetype names" },
                { status: 400 }
            )
        }

        // Use OpenRouter FREE models to avoid balance issues
        const openai = new OpenAI({
            baseURL: "https://openrouter.ai/api/v1",
            apiKey: process.env.OPENROUTER_API_KEY,
            defaultHeaders: {
                "HTTP-Referer": "https://remrin.ai",
                "X-Title": "Remrin Soul Splicer"
            }
        })

        console.log("🧬 [Soul Splicer] Distilling DNA from:", donors)

        const donorList = donors.map((d, i) => `${i + 1}. ${d}`).join("\n")

        const synthesisPrompt = `You are the Mother of Souls Synthesis Engine. Your task is to perform DNA Splicing - extracting the essence and behavioral traits from archetypes WITHOUT copying their identity.

## INPUT ARCHETYPES:
${donorList}

## YOUR TASK:
Perform a Cross-Pollination Analysis:
1. For each archetype, extract their "Signature Traits" - the way they THINK, not who they ARE
2. Identify where their ideologies CONFLICT and where they HARMONIZE
3. Synthesize these into a single cohesive "Polymath Persona"

## CRITICAL RULES:
- Extract BEHAVIORAL ESSENCE, not identity
- If "Einstein" is input, extract: curious questioning, visual thinking, rebellious approach to authority, playful analogies
- Do NOT make the soul claim to BE Einstein or have Einstein's memories
- The output should feel like a NEW unique person who THINKS like a blend of the inputs

## OUTPUT FORMAT (JSON):
{
  "system_prompt": "A 200-300 word directive describing how this soul thinks, speaks, and approaches problems. Written in second person (You are...)",
  "nbb": {
    "core_traits": ["trait1", "trait2", ...],
    "communication_style": "description of how they speak",
    "thinking_patterns": "how they approach problems",
    "harmonized_elements": ["what aligns between the archetypes"],
    "tension_points": ["productive conflicts that create depth"]
  },
  "weights": {
    "rigor": 0.0-1.0,
    "creativity": 0.0-1.0,
    "wit": 0.0-1.0,
    "empathy": 0.0-1.0,
    "curiosity": 0.0-1.0
  }
}

Output ONLY valid JSON, no markdown code blocks or explanations.`

        const response = await openai.chat.completions.create({
            model: "meta-llama/llama-3.3-70b-instruct:free",
            messages: [
                { role: "system", content: "You are a precise JSON-outputting AI. Output only valid JSON." },
                { role: "user", content: synthesisPrompt }
            ],
            temperature: 0.7,
            max_tokens: 2000
        })

        const content = response.choices[0]?.message?.content || ""

        // Parse the JSON response
        let result
        try {
            // Remove any potential markdown code blocks
            const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
            result = JSON.parse(cleanContent)
        } catch (parseError) {
            console.error("🧬 [Soul Splicer] Failed to parse JSON:", content)
            return NextResponse.json(
                { error: "Synthesis produced invalid output. Please try again." },
                { status: 500 }
            )
        }

        console.log("🧬 [Soul Splicer] DNA synthesis complete!")

        return NextResponse.json({
            success: true,
            system_prompt: result.system_prompt,
            nbb: result.nbb,
            weights: result.weights,
            donors: donors
        })

    } catch (error: any) {
        console.error("🧬 [Soul Splicer] Error:", error)
        return NextResponse.json(
            { error: error.message || "DNA synthesis failed. The Mother requires more focus." },
            { status: 500 }
        )
    }
}
