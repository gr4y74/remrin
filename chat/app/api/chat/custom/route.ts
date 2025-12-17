import { streamText, convertToCoreMessages, tool } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { tavily } from "@tavily/core"
import { z } from "zod"

// Allow streaming responses up to 60 seconds
export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const { messages } = json as { messages: any[] }

    // 1. Setup DeepSeek (Hardcoded URL for safety)
    const deepseek = createOpenAI({
      baseURL: 'https://api.deepseek.com',
      apiKey: process.env.OPENAI_API_KEY,
    })

    const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY })

    // 2. Convert messages to standard format
    const coreMessages = convertToCoreMessages(messages)

    console.log("📞 Calling DeepSeek Custom Route...")

    // 3. The Stream
    const result = streamText({
      model: deepseek('deepseek-chat'),
      messages: coreMessages,
      system: "You are a helpful assistant with access to the internet via the 'search' tool. You MUST use it for current events.",
      tools: {
        search: tool({
          description: 'Search the web for current information.',
          parameters: z.object({
            query: z.string().describe('The search query')
          }),
          // STRICT MODE FIX: Explicitly type the input argument
          execute: async ({ query }: { query: string }) => {
            console.log("🔍 Searching Tavily for:", query)
            try {
              const searchResult = await tvly.search(query, {
                includeAnswer: true,
                maxResults: 5
              })
              return searchResult
            } catch (error: any) {
              return `Error searching: ${error.message}`
            }
          }
        })
      },
      maxSteps: 5,
    })

    // 4. Return the modern data stream
    return result.toDataStreamResponse()

  } catch (error: any) {
    console.error("🚨 CRITICAL ERROR:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}