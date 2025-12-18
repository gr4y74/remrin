import { OpenAIStream, StreamingTextResponse } from "ai"
import OpenAI from "openai"

export const runtime = "edge"
export const maxDuration = 60

/**
 * REMRIN COMMERCIAL - DeepSeek + Tavily Hardcoded Route
 *
 * This route IGNORES frontend model selection and forces:
 * - Engine: DeepSeek (via OPENAI_BASE_URL)
 * - Model: deepseek-chat
 * - Search: Tavily (via REST API - Edge compatible)
 */

// Tavily search using fetch (Edge-compatible)
async function searchTavily(query: string, apiKey: string) {
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query: query,
      search_depth: "advanced",  // CRITICAL: 'basic' misses recent scores
      topic: "news",             // Prioritize news sources
      include_answer: true,
      max_results: 5
    })
  })

  if (!response.ok) {
    throw new Error(`Tavily API error: ${response.status}`)
  }

  return response.json()
}

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const { messages } = json as { messages: any[] }
    // Note: chatSettings is IGNORED - we force DeepSeek

    // HARDCODED: DeepSeek client
    const openai = new OpenAI({
      baseURL: "https://api.deepseek.com",
      apiKey: process.env.OPENAI_API_KEY
    })

    // === DYNAMIC DATE INJECTION ===
    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    const currentYear = new Date().getFullYear()

    console.log(`📞 [Remrin] DeepSeek + Tavily Search Route | Date: ${today}`)

    // Define the search tool
    const tools: OpenAI.ChatCompletionTool[] = [
      {
        type: "function",
        function: {
          name: "search_web",
          description:
            "Search the internet for current information. Use this for any questions about current events, prices, news, weather, or real-time data.",
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

    // === SYSTEM PROMPT WITH DATE ===
    const messagesWithSystem = [
      {
        role: "system",
        content: `You are Remrin, an intelligent AI assistant with internet access via the search_web function.

CURRENT DATE: ${today}

CRITICAL RULES - YOU MUST FOLLOW THESE:
1. SPORTS SCORES: ALWAYS search for ANY sports scores, game results, or schedules. NEVER guess. When searching for sports, you MUST append the current year (${currentYear}) to the query.
2. CURRENT EVENTS/NEWS: ALWAYS search first. When searching for news/sports, you MUST append the current year (${currentYear}) to the query.
3. SPECIFIC DATES: When a user mentions a specific date, ALWAYS search. Do not rely on training data.
4. DO NOT GUESS: If unsure about ANY fact, SEARCH before answering. Search first.

SEARCH QUERY FORMAT:
- For sports: Include team names, "score", the month, and the year ${currentYear}
- For news: Include topic and "${currentYear}" or specific month/date
- Example: "Steelers vs Dolphins score December ${currentYear}"

ALWAYS:
- Search first, then answer
- Cite sources from search results
- If search returns no results, clearly state that`
      },
      ...messages.filter((m: any) => m.role !== "system") // Remove any user-provided system messages
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
      console.log(
        "🔧 Function call requested:",
        assistantMessage.tool_calls[0].function.name
      )

      const toolResults: any[] = []

      for (const toolCall of assistantMessage.tool_calls) {
        if (toolCall.function.name === "search_web") {
          const args = JSON.parse(toolCall.function.arguments)
          console.log("🔍 Searching Tavily for:", args.query)

          try {
            // Use fetch-based Tavily search (Edge-compatible)
            const searchResult = await searchTavily(
              args.query,
              process.env.TAVILY_API_KEY!
            )
            console.log("✅ Tavily deep search complete")

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
        messages: [...messagesWithSystem, assistantMessage, ...toolResults],
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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500
    })
  }
}
