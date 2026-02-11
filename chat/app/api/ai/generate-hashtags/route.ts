import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(req: NextRequest) {
    try {
        const { name, description, system_prompt, category } = await req.json()

        const apiKey = process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY
        const baseURL = process.env.OPENAI_API_KEY ? undefined : 'https://api.deepseek.com'
        const model = process.env.OPENAI_API_KEY ? 'gpt-4o-mini' : 'deepseek-chat'

        if (!apiKey) {
            return NextResponse.json(
                { error: 'AI provider not configured (missing keys)' },
                { status: 503 }
            )
        }

        const openai = new OpenAI({
            apiKey,
            baseURL
        })

        if (!name || !description) {
            return NextResponse.json(
                { error: 'Name and description are required' },
                { status: 400 }
            )
        }

        const prompt = `Analyze this AI persona and suggest 5-10 relevant hashtags for discovery.

Name: ${name}
Description: ${description}
${category ? `Category: ${category}` : ''}
${system_prompt ? `Personality: ${system_prompt.slice(0, 500)}` : ''}

Return ONLY a JSON array of lowercase hashtags without the # symbol.
Example: ["funny", "helper", "anime", "tsundere"]

Focus on:
- Personality traits (funny, serious, playful, wise, etc.)
- Role/function (helper, teacher, mentor, companion, etc.)
- Genre/theme (anime, fantasy, scifi, historical, etc.)
- Special characteristics (voice-enabled, multilingual, etc.)

Rules:
- Use only lowercase letters, numbers, and hyphens
- Each hashtag must be 2-30 characters
- No spaces or special characters
- Be specific and relevant
- Avoid generic tags like "ai" or "chatbot"

Hashtags:`.trim()

        const response = await openai.chat.completions.create({
            model: model as any,
            messages: [
                {
                    role: 'system',
                    content: 'You are a hashtag generation expert. Generate relevant, specific hashtags for AI personas to improve discoverability.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.3,
            max_tokens: 150,
            response_format: { type: 'json_object' }
        })

        const content = response.choices[0].message.content
        if (!content) {
            throw new Error('No response from OpenAI')
        }

        let hashtags: string[]
        try {
            const parsed = JSON.parse(content)
            hashtags = parsed.hashtags || parsed.tags || Object.values(parsed)[0] || []
        } catch {
            // Fallback: try to extract array from content
            const match = content.match(/\[(.*?)\]/)
            if (match) {
                hashtags = JSON.parse(match[0])
            } else {
                hashtags = []
            }
        }

        // Validate and clean hashtags
        const validHashtags = hashtags
            .filter((tag: string) => {
                const cleanTag = tag.toLowerCase().trim()
                return (
                    cleanTag.length >= 2 &&
                    cleanTag.length <= 30 &&
                    /^[a-z0-9-]+$/.test(cleanTag) &&
                    !cleanTag.startsWith('-') &&
                    !cleanTag.endsWith('-')
                )
            })
            .map((tag: string) => tag.toLowerCase().trim())
            .slice(0, 10) // Max 10 suggestions

        return NextResponse.json({
            hashtags: validHashtags,
            count: validHashtags.length
        })

    } catch (error) {
        console.error('Error generating hashtags:', error)
        return NextResponse.json(
            {
                error: 'Failed to generate hashtags',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}
