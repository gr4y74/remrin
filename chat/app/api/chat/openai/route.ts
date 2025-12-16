import { checkApiKey, getServerProfile } from "@/lib/server/server-chat-helpers"
import { ChatSettings } from "@/types"
import { streamText, convertToCoreMessages, stepCountIs } from "ai"
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

    // 1. DELETE or COMMENT OUT this line! We use the .env key now.
    // checkApiKey(profile.openai_api_key, "OpenAI") 

    // DeepSeek Provider Configuration
    const deepseek = createOpenAI({
      baseURL: process.env.OPENAI_BASE_URL,
      apiKey: process.env.OPENAI_API_KEY,
    })

    const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY })

    // ... (Your message mapping logic stays the same) ...
    const initialMessages = messages.map((m: any) => {
      let content = m.content
      if (Array.isArray(m.content)) {
        content = m.content.map((c: any) => {
          if (c.type === 'image_url') {
            return { type: 'image', image: c.image_url.url }
          }
          if (c.type === 'text') {
            return { type: 'text', text: c.text }
          }
          return c
        })
      }
      const role = (m.role === 'user' || m.role === 'assistant' || m.role === 'system') ? m.role : 'user';
      return { role, content }
    })

    const result = streamText({
      model: deepseek(chatSettings.model),
      messages: initialMessages as any,
      // 2. ADD THIS SYSTEM PROMPT TO FORCE SEARCH:
      system: "You are a helpful assistant with access to the internet via the 'search' tool. You MUST use the search tool if the user asks about current events, news, or information you do not know. Do not say you cannot access the internet; just use the tool.",
      tools: {
        search: {
          description: 'A powerful search engine for finding up-to-date information on the web.',
          inputSchema: z.object({
            query: z.string().describe('The search query')
          }),
          execute: async ({ query }: { query: string }) => {
            console.log("Searching Tavily for:", query)
            try {
              const searchResult = await tvly.search(query, {
                includeAnswer: true,
                maxResults: 5,
                topic: "general"
              })
              console.log("Search done")
              return searchResult
            } catch (err: any) {
              console.error("Tavily Search Error:", err)
              return `Search failed: ${err.message}`
            }
          }
        }
      },
      stopWhen: stepCountIs(5)
    })

    return result.toUIMessageStreamResponse()
  } catch (error: any) {
    console.error("CHAT ROUTE ERROR:", error); // Log the actual error to terminal
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
