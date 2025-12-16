import { checkApiKey, getServerProfile } from "@/lib/server/server-chat-helpers"
import { ChatSettings } from "@/types"
import { streamText, convertToCoreMessages } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { tavily } from "@tavily/core"
import { z } from "zod"

export const maxDuration = 30

export async function POST(request: Request) {
  const json = await request.json()
  const { chatSettings, messages } = json as {
    chatSettings: ChatSettings
    messages: any[]
  }

  try {
    const profile = await getServerProfile()

    checkApiKey(profile.openai_api_key, "OpenAI")

    // DeepSeek Provider Configuration
    // explicitly using environment variables as requested
    const deepseek = createOpenAI({
      baseURL: process.env.OPENAI_BASE_URL,
      apiKey: process.env.OPENAI_API_KEY,
    })

    const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY })

    const result = await streamText({
      model: deepseek(chatSettings.model),
      messages: convertToCoreMessages(messages),
      tools: {
        search: {
          description: 'A powerful search engine for finding up-to-date information on the web.',
          parameters: z.object({
            query: z.string().describe('The search query')
          }),
          execute: async ({ query }) => {
            console.log("Searching Tavily for:", query) // Debug log
            const result = await tvly.search(query, {
              includeAnswer: true,
              maxResults: 5,
              topic: "general"
            })
            return result
          }
        }
      },
      maxSteps: 5
    })

    return result.toDataStreamResponse()
  } catch (error: any) {
    let errorMessage = error.message || "An unexpected error occurred"
    const errorCode = error.status || 500

    if (errorMessage.toLowerCase().includes("api key not found")) {
      errorMessage =
        "OpenAI API Key not found. Please set it in your profile settings."
    } else if (errorMessage.toLowerCase().includes("incorrect api key")) {
      errorMessage =
        "OpenAI API Key is incorrect. Please fix it in your profile settings."
    }

    return new Response(JSON.stringify({ message: errorMessage }), {
      status: errorCode
    })
  }
}
