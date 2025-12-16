import { getServerProfile } from "@/lib/server/server-chat-helpers"
import { streamText, convertToCoreMessages, tool } from "ai" // Added 'tool' import
import { createOpenAI } from "@ai-sdk/openai"
import { tavily } from "@tavily/core"
import { z } from "zod"

export const maxDuration = 60 // Increased duration for search

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const { messages } = json as { messages: any[] }

    // --- DEBUG LOGS ---
    console.log("🚀 Starting Custom Route Request...")

    // 1. HARDCODED CONFIGURATION
    const deepseek = createOpenAI({
      baseURL: 'https://api.deepseek.com',
      apiKey: process.env.OPENAI_API_KEY,
    })

    const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY })

    // 2. Convert messages
    const coreMessages = convertToCoreMessages(messages)

    console.log("📞 Calling DeepSeek (Model: deepseek-chat)...")

    const result = streamText({ // removed 'await' here, streamText is synchronous in setup
      model: deepseek('deepseek-chat'),
      messages: coreMessages,
      system: "You are a helpful assistant. You have access to the internet via the 'search' tool. You MUST use it for current events or unknown info.",
      tools: {
        // We use the 'tool' helper to fix the 'parameters' error
        search: tool({
          description: 'Search the web for current information.',
          parameters: z.object({
            query: z.string().describe('The search query')
          }),
          execute: async ({ query }) => {
            console.log("🔍 Searching Tavily for:", query)
            try {
              const searchResult = await tvly.search(query, {
                includeAnswer: true,
                maxResults: 5
              })
              console.log("✅ Search success")
              return searchResult
            } catch (error: any) {
              console.error("❌ Search failed:", error)
              return `Error searching: ${error.message}`
            }
          }
        })
      },
      maxSteps: 5,
    })

    // 3. Return the Data Stream (This requires 'ai@latest')
    return result.toDataStreamResponse()

  } catch (error: any) {
    console.error("🚨 CRITICAL ERROR:", error)
    return new Response(JSON.stringify({ error: error.message, stack: error.stack }), { status: 500 })
  }
}