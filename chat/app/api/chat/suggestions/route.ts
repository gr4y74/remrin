import { NextResponse } from "next/server"

/**
 * POST /api/chat/suggestions
 * Generate suggested replies based on persona and recent conversation
 */
export async function POST(req: Request) {
    try {
        const { personaPrompt, recentMessages, personaName } = await req.json()

        // Simple rule-based suggestions when no AI available
        // These are contextual based on the persona's style
        const defaultSuggestions = [
            "Tell me more about yourself",
            "What do you like to do?",
            "Can you help me with something?"
        ]

        // If we have persona context, customize suggestions
        if (personaName) {
            return NextResponse.json({
                suggestions: [
                    `What's on your mind, ${personaName}?`,
                    "That's interesting! Tell me more",
                    "How does that make you feel?"
                ]
            })
        }

        // If we have recent messages, try to make context-aware suggestions
        if (recentMessages && recentMessages.length > 0) {
            const lastMessage = recentMessages[recentMessages.length - 1]

            // Simple sentiment-based suggestions
            const content = lastMessage?.content?.toLowerCase() || ""

            if (content.includes("?")) {
                return NextResponse.json({
                    suggestions: [
                        "Yes, I think so",
                        "No, not really",
                        "Can you explain more?"
                    ]
                })
            }

            if (content.includes("help") || content.includes("assist")) {
                return NextResponse.json({
                    suggestions: [
                        "That would be helpful",
                        "Could you give me an example?",
                        "What do you recommend?"
                    ]
                })
            }
        }

        return NextResponse.json({ suggestions: defaultSuggestions })
    } catch (error) {
        console.error("Error generating suggestions:", error)
        return NextResponse.json(
            { suggestions: ["Tell me more", "That's interesting", "What else?"] }
        )
    }
}
