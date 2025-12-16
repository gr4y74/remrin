import { getServerProfile } from "@/lib/server/server-chat-helpers"
import { ChatSettings } from "@/types"
import { streamText, convertToCoreMessages } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { tavily } from "@tavily/core"
import { z } from "zod"

export const maxDuration = 30

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const { messages } = json as { messages: any[] }

    // --- DEBUGGING LOGS (Check your terminal!) ---
    console.log("🚀 Starting Request...")

    // 1. HARDCODED CONFIGURATION (Bypassing .env for now)
    // DeepSeek V3 specific endpoint
    const deepseek = createOpenAI({
      baseURL: 'https://api.deepseek.com',  // No '/v1' here, the SDK adds it automatically
      apiKey: process.env.OPENAI_API_KEY,   // We still trust your key
    })

    const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY })

    // 2. Convert messages
    const coreMessages = convertToCoreMessages(messages)

    console.log("📞 Calling DeepSeek with model: deepseek-chat")

    const result = await streamText({
      model: deepseek('deepseek-chat'),
      messages: coreMessages,
      system: "You are a helpful assistant. You have access to the internet via the 'search' tool. Use it for current events.",
      tools: {
        search: {
          description: 'Search the web for current information.',
          parameters: z.object({
            query: z.string()
          }),
          execute: async ({ query }) => {
            console.log("🔍 Searching Tavily for:", query)
            const searchResult = await tvly.search(query, {
              includeAnswer: true,
              maxResults: 5
            })
            return searchResult
          }
        }
      },
      maxSteps: 5,
    })

    return result.toDataStreamResponse()

  } catch (error: any) {
    console.error("🚨 CRITICAL ERROR:", error)
    // This helps us see the real error in the browser
    return new Response(JSON.stringify({ error: error.message, stack: error.stack }), { status: 500 })
  }
}