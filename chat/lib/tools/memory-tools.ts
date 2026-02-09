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
        description: 'Search your long-term memory for past conversations, facts, and experiences with the user. Use this when the user asks "do you remember...", "what did we talk about...", or asks about specific past dates/events.',
        parameters: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'The search query to look up in the memory database. Be descriptive.'
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
