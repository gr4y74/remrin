import { getServerProfile } from "@/lib/server/server-chat-helpers"
import { ChatSettings } from "@/types"
import { streamText, convertToCoreMessages, stepCountIs } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { tavily } from "@tavily/core"
import { z } from "zod"

export const maxDuration = 30

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const { chatSettings, messages } = json as {
      chatSettings: ChatSettings
      messages: any[]
    }

    const profile = await getServerProfile()

    // 1. FORCE the DeepSeek Configuration
    // We add '/v1' to be absolutely safe, as some SDK versions demand it.
    const deepseek = createOpenAI({
      baseURL: process.env.OPENAI_BASE_URL || 'https://api.deepseek.com/v1',
      apiKey: process.env.OPENAI_API_KEY,
    })

    const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY })

    // 2. Convert messages to the standard "Core" format (Better for Tools)
    const coreMessages = convertToCoreMessages(messages)

    const result = await streamText({
      model: deepseek("deepseek-chat"), // Force Model ID
      messages: coreMessages,           // Use Core Messages
      system: "You are a helpful assistant with access to the internet via the 'search' tool. You MUST use the search tool if the user asks about current events, news, crypto prices, or information you do not know. Do not say you cannot access the internet; just use the tool. Always cite your sources.",
      tools: {
        search: {
          description: 'Search the web for current information, news, and data.',
          parameters: z.object({
            query: z.string().describe('The search query (e.g. "price of bitcoin")')
          }),
          execute: async ({ query }) => {
            console.log("🔍 Searching Tavily for:", query)
            try {
              const searchResult = await tvly.search(query, {
                includeAnswer: true,
                maxResults: 5,
                topic: "general"
              })
              console.log("✅ Search success")
              return searchResult
            } catch (err: any) {
              console.error("❌ Search failed:", err)
              return `Search failed: ${err.message}`
            }
          }
        }
      },
      maxSteps: 5,       // Allow it to "Think" (Search -> Read -> Search -> Answer)
      toolChoice: 'auto' // Explicitly tell it "You are allowed to use tools"
    })

    // 3. THE CRITICAL FIX: Use the modern Data Stream response
    return result.toDataStreamResponse()

  } catch (error: any) {
    console.error("🚨 CHAT ROUTE ERROR:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}