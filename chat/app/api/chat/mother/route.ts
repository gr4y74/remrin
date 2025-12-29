import OpenAI from "openai"
import { NextRequest, NextResponse } from "next/server"
import { SOUL_FORGE_TOOLS } from "@/lib/tools/soul-forge-tools"
import { MOTHER_OF_SOULS_PROMPT } from "@/lib/prompts/mother-of-souls"

export const runtime = "edge"
export const maxDuration = 60

// Maximum number of tool call iterations
const MAX_TOOL_ITERATIONS = 5

/**
 * POST /api/chat/mother
 * 
 * Special chat endpoint for The Mother of Souls
 * Includes Soul Forge tools for the sacred ritual:
 * - generate_soul_portrait
 * - show_soul_reveal  
 * - finalize_soul
 */
export async function POST(request: NextRequest) {
    try {
        const json = await request.json()
        const { messages, chatSettings } = json as {
            messages: any[]
            chatSettings: any
        }

        // Use DeepSeek as the backend (same as main chat)
        const openai = new OpenAI({
            baseURL: "https://api.deepseek.com",
            apiKey: process.env.OPENAI_API_KEY
        })

        console.log("🕯️ [Mother of Souls] Starting ritual chat...")

        // Build conversation with Mother's system prompt
        const conversationMessages: any[] = [
            {
                role: "system",
                content: MOTHER_OF_SOULS_PROMPT
            },
            ...messages.filter((m: any) => m.role !== "system")
        ]

        // Convert Soul Forge tool schemas to OpenAI format
        const tools: OpenAI.ChatCompletionTool[] = SOUL_FORGE_TOOLS.map(tool => ({
            type: tool.type as "function",
            function: tool.function
        }))

        const MODEL = "deepseek-chat"
        let iteration = 0

        // Iterative tool call loop
        while (iteration < MAX_TOOL_ITERATIONS) {
            iteration++
            console.log(`🔄 [Mother] Iteration ${iteration}/${MAX_TOOL_ITERATIONS}`)

            const response = await openai.chat.completions.create({
                model: MODEL,
                messages: conversationMessages,
                tools: tools,
                tool_choice: "auto",
                temperature: 0.8, // Slightly higher for Mother's mystical tone
                stream: false
            })

            const assistantMessage = response.choices[0].message

            // Check if the model wants to call a tool
            if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
                console.log(`🔧 [Mother] Tool call:`, assistantMessage.tool_calls[0].function.name)

                // Add assistant message to conversation
                conversationMessages.push(assistantMessage)

                // Process each tool call
                for (const toolCall of assistantMessage.tool_calls) {
                    const toolName = toolCall.function.name
                    const args = JSON.parse(toolCall.function.arguments)

                    let toolResult: any = { success: false, error: "Unknown tool" }

                    switch (toolName) {
                        case "generate_soul_portrait":
                            // Call the portrait generation API
                            try {
                                const portraitResponse = await fetch(
                                    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/forge/generate-portrait`,
                                    {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({
                                            appearance_description: args.appearance_description
                                        })
                                    }
                                )

                                if (portraitResponse.ok) {
                                    const data = await portraitResponse.json()
                                    toolResult = { success: true, image_url: data.image_url }
                                } else {
                                    toolResult = { success: false, error: "Portrait generation failed" }
                                }
                            } catch (e) {
                                console.error("[Mother] Portrait error:", e)
                                toolResult = { success: false, error: "Portrait service unavailable" }
                            }
                            break

                        case "show_soul_reveal":
                            // Just acknowledge - the UI will render the reveal card
                            toolResult = {
                                success: true,
                                displayed: true,
                                persona_data: args.persona_data
                            }
                            break

                        case "finalize_soul":
                            // Call the finalize API (needs user auth, so return data for client)
                            toolResult = {
                                success: true,
                                action: "finalize_soul",
                                data: args
                            }
                            break
                    }

                    console.log(`✅ [Mother] Tool result:`, toolName, toolResult.success)

                    conversationMessages.push({
                        role: "tool",
                        tool_call_id: toolCall.id,
                        content: JSON.stringify(toolResult)
                    })
                }

                // Continue loop for next iteration
                continue
            }

            // No tool call - return the response
            const content = assistantMessage.content || ""
            console.log(`✅ [Mother] Final response`)

            return new Response(content, {
                headers: { "Content-Type": "text/plain; charset=utf-8" }
            })
        }

        // Max iterations reached
        console.log(`⚠️ [Mother] Max iterations reached`)
        return new Response("The ritual requires more focus. Let us continue...", {
            headers: { "Content-Type": "text/plain; charset=utf-8" }
        })

    } catch (error: any) {
        console.error("🚨 [Mother] Error:", error)
        return NextResponse.json(
            { error: error.message || "The Soul Layer trembles... Please try again." },
            { status: 500 }
        )
    }
}
