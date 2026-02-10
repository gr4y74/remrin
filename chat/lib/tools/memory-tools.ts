/**
 * Memory Search Tools
 * 
 * Tool definitions for searching persona's long-term memory (memories table)
 */

import { ToolDescriptor } from '@/lib/chat-engine/types'

export const MEMORY_SEARCH_TOOL: ToolDescriptor = {
    type: 'function',
    function: {
        name: 'search_memories',
        description: 'Search your long-term memory database for PAST CONVERSATIONS and interactions with this specific user. Use this tool when the user asks about previous chats, specific dates, or past topics you discussed together. Examples: "do you remember when we talked about...", "what did I tell you about...", "we discussed this on [date]", "who is [topic we discussed before]". This retrieves YOUR actual conversation history, not general knowledge.',
        parameters: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'The search query to find in past conversations. Include key topics, dates, or specific phrases the user mentioned. Examples: "V8 engine November 2025", "what user told me about preferences", "conversation about JavaScript"'
                },
                limit: {
                    type: 'number',
                    description: 'Maximum number of memories to retrieve (1-20). Default is 10.',
                    default: 10
                },
                domain: {
                    type: 'string',
                    description: 'Optional filter for memory domain (e.g., "personal", "universal")'
                }
            },
            required: ['query']
        }
    }
}

export const MEMORY_TOOLS = [MEMORY_SEARCH_TOOL]
