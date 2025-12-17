import { OpenAIStream, StreamingTextResponse } from "ai"
import OpenAI from "openai"
import { tavily } from "@tavily/core"

export const runtime = "edge"
export const maxDuration = 60

/**
 * REMRIN COMMERCIAL - DeepSeek + Tavily Hardcoded Route
 * 
 * This route IGNORES frontend model selection and forces:
 * - Engine: DeepSeek (via OPENAI_BASE_URL)
 * - Model: deepseek-chat
 * - Search: Tavily (always enabled)
 */
export async function POST(request: Request) {
  try {
    const json = await request.json()
    const { messages } = json as { messages: any[] }
    // Note: chatSettings is IGNORED - we force DeepSeek

    // HARDCODED: DeepSeek client
    const openai = new OpenAI({
      baseURL: 'https://api.deepseek.com',
      apiKey: process.env.OPENAI_API_KEY,
    })

    // HARDCODED: Tavily for search
    const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY })

    console.log("📞 [Remrin] DeepSeek + Tavily Search Route")

    // Define the search tool
    const tools: OpenAI.ChatCompletionTool[] = [
      {
        type: "function",
        function: {
          name: "search_web",
          description: "Search the internet for current information. Use this for any questions about current events, prices, news, weather, or real-time data.",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "The search query"
              }
            },
            required: ["query"]
          }
        }
      }
    ]

    // Force system message with search instructions
    const messagesWithSystem = [
      {
        role: 'system',
        content: `You are Remrin, an intelligent AI assistant with access to the internet via the search_web function.

IMPORTANT: When asked about current events, prices (stocks, crypto, commodities), news, weather, sports scores, or ANY real-time information, you MUST call the search_web function BEFORE answering. Never say you don't have access to real-time data - you DO have it via search.

Be helpful, accurate, and cite your sources when using search results.`
      },
      ...messages.filter((m: any) => m.role !== 'system') // Remove any user-provided system messages
    ]

    // HARDCODED model: deepseek-chat
    const FORCED_MODEL = "deepseek-chat"

    // First call - may return a function call
    const initialResponse = await openai.chat.completions.create({
      model: FORCED_MODEL,
      messages: messagesWithSystem,
      tools: tools,
      tool_choice: "auto",
      temperature: 0.7,
      stream: false
    })

    const assistantMessage = initialResponse.choices[0].message

    // Check if the model wants to call a function
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      console.log("🔧 Function call requested:", assistantMessage.tool_calls[0].function.name)

      const toolResults: any[] = []

      for (const toolCall of assistantMessage.tool_calls) {
        if (toolCall.function.name === "search_web") {
          const args = JSON.parse(toolCall.function.arguments)
          console.log("🔍 Searching Tavily for:", args.query)

          try {
            const searchResult = await tvly.search(args.query, {
              includeAnswer: true,
              maxResults: 5
            })
            console.log("✅ Tavily search complete")

            toolResults.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify(searchResult)
            })
          } catch (error: any) {
            console.error("❌ Tavily error:", error.message)
            toolResults.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: `Search error: ${error.message}`
            })
          }
        }
      }

      // Second call with function results - stream this one
      const streamResponse = await openai.chat.completions.create({
        model: FORCED_MODEL,
        messages: [
          ...messagesWithSystem,
          assistantMessage,
          ...toolResults
        ],
        temperature: 0.7,
        stream: true
      })

      const stream = OpenAIStream(streamResponse)
      return new StreamingTextResponse(stream)
    }

    // No function call - stream the response directly
    const streamResponse = await openai.chat.completions.create({
      model: FORCED_MODEL,
      messages: messagesWithSystem,
      temperature: 0.7,
      stream: true
    })

    const stream = OpenAIStream(streamResponse)
    return new StreamingTextResponse(stream)

  } catch (error: any) {
    console.error("🚨 CRITICAL ERROR:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
