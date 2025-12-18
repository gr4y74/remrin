import { OpenAIStream, StreamingTextResponse } from "ai"
import OpenAI from "openai"

export const runtime = "edge"
export const maxDuration = 60

// Maximum number of tool call iterations to prevent infinite loops
const MAX_TOOL_ITERATIONS = 5

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
      search_depth: "advanced",
      topic: "news",
      include_answer: true,
      max_results: 5
    })
  })

  if (!response.ok) {
    throw new Error(`Tavily API error: ${response.status}`)
  }

  return response.json()
}

// Filter out DSML markup that DeepSeek sometimes outputs
function filterDSML(text: string): string {
  return text
    .replace(/<｜DSML｜[^>]*>/g, "")
    .replace(/<\/｜DSML｜[^>]*>/g, "")
    .replace(/<｜[^>]*｜>/g, "")
    .trim()
}

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const { messages } = json as { messages: any[] }

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

    // Build conversation with system prompt
    const conversationMessages: any[] = [
      {
        role: "system",
        content: `You are Remrin, an intelligent AI assistant with internet access via the search_web function.

CURRENT DATE: ${today}

CRITICAL RULES - YOU MUST FOLLOW THESE:
1. SPORTS SCORES: ALWAYS search for ANY sports scores, game results, or schedules. NEVER guess. Include the year ${currentYear} in your query.
2. CURRENT EVENTS/NEWS: ALWAYS search first. Include the year ${currentYear} in your query.
3. SPECIFIC DATES: When a user mentions a specific date, ALWAYS search. Do not rely on training data.
4. DO NOT GUESS: If unsure about ANY fact, SEARCH before answering.

SEARCH QUERY FORMAT:
- For sports: Include team names, "score", and the year ${currentYear}
- For news: Include topic and "${currentYear}"
- Example: "Steelers vs Dolphins score December ${currentYear}"

IMPORTANT: After receiving search results, synthesize the information and provide a final answer. Do not request additional searches unless absolutely necessary.

ALWAYS:
- Search first, then answer
- Cite sources from search results
- If search returns no results, clearly state that`
      },
      ...messages.filter((m: any) => m.role !== "system")
    ]

    const FORCED_MODEL = "deepseek-chat"
    let iteration = 0

    // Iterative tool call loop
    while (iteration < MAX_TOOL_ITERATIONS) {
      iteration++
      console.log(`🔄 Iteration ${iteration}/${MAX_TOOL_ITERATIONS}`)

      // Make API call with tools (unless it's the last iteration)
      const useTools = iteration < MAX_TOOL_ITERATIONS
      const response = await openai.chat.completions.create({
        model: FORCED_MODEL,
        messages: conversationMessages,
        tools: useTools ? tools : undefined,
        tool_choice: useTools ? "auto" : undefined,
        temperature: 0.7,
        stream: false
      })

      const assistantMessage = response.choices[0].message

      // Check if the model wants to call a tool
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        console.log(`🔧 [Iteration ${iteration}] Tool call requested:`, assistantMessage.tool_calls[0].function.name)

        // Add assistant message to conversation
        conversationMessages.push(assistantMessage)

        // Execute each tool call
        for (const toolCall of assistantMessage.tool_calls) {
          if (toolCall.function.name === "search_web") {
            const args = JSON.parse(toolCall.function.arguments)
            console.log(`🔍 [Iteration ${iteration}] Searching Tavily:`, args.query)

            try {
              const searchResult = await searchTavily(args.query, process.env.TAVILY_API_KEY!)
              console.log(`✅ [Iteration ${iteration}] Search complete`)

              conversationMessages.push({
                role: "tool",
                tool_call_id: toolCall.id,
                content: JSON.stringify(searchResult)
              })
            } catch (error: any) {
              console.error(`❌ [Iteration ${iteration}] Search error:`, error.message)
              conversationMessages.push({
                role: "tool",
                tool_call_id: toolCall.id,
                content: `Search error: ${error.message}`
              })
            }
          }
        }

        // Continue the loop for another iteration
        continue
      }

      // No tool call - we have a final answer
      console.log(`✅ [Iteration ${iteration}] Final answer received`)

      // Filter out any DSML markup and return the response
      const content = assistantMessage.content || ""
      const cleanContent = filterDSML(content)

      return new Response(cleanContent, {
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      })
    }

    // If we hit max iterations, make one final call without tools
    console.log(`⚠️ Max iterations reached, forcing final response`)
    const finalResponse = await openai.chat.completions.create({
      model: FORCED_MODEL,
      messages: [
        ...conversationMessages,
        {
          role: "user",
          content: "Please provide your final answer based on the search results you have gathered. Do not search again."
        }
      ],
      temperature: 0.7,
      stream: false
    })

    const finalContent = filterDSML(finalResponse.choices[0].message.content || "")
    return new Response(finalContent, {
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    })

  } catch (error: any) {
    console.error("🚨 CRITICAL ERROR:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500
    })
  }
}
