/**
 * OpenAI Provider
 * 
 * Native implementation for OpenAI models
 * Uses standard OpenAI API
 */

import { BaseChatProvider } from './base'
import {
    ProviderId,
    ChatMessageContent,
    ProviderOptions,
    PROVIDER_CONFIGS,
    ChatChunk
} from '../types'

export class OpenAIProvider extends BaseChatProvider {
    id: ProviderId = 'openai'
    name = 'OpenAI'

    constructor() {
        super(PROVIDER_CONFIGS.openai)
    }

    /**
     * Format messages for OpenAI API
     */
    protected formatMessages(
        messages: ChatMessageContent[],
        systemPrompt: string
    ): any[] {
        const formatted: any[] = []

        // Add system prompt
        if (systemPrompt) {
            formatted.push({
                role: 'system',
                content: systemPrompt
            })
        }

        // Add conversation messages
        for (const msg of messages) {
            const formattedMsg: any = {
                role: msg.role,
                content: msg.content
            }

            // Handle tool responses
            if (msg.role === 'tool' && msg.tool_call_id) {
                formattedMsg.tool_call_id = msg.tool_call_id
            }

            // Handle assistant messages with tool calls
            if (msg.role === 'assistant' && msg.metadata?.toolCalls) {
                formattedMsg.tool_calls = msg.metadata.toolCalls.map(tc => ({
                    id: tc.id,
                    type: 'function',
                    function: tc.function
                }))

                // If there's no content but there are tool calls, OpenAI still likes an empty string or null
                if (!formattedMsg.content) {
                    formattedMsg.content = null
                }
            }

            formatted.push(formattedMsg)
        }

        return formatted
    }

    /**
     * Send message and stream response
     */
    async *sendMessage(
        messages: ChatMessageContent[],
        systemPrompt: string,
        options: ProviderOptions
    ): AsyncGenerator<ChatChunk, void, unknown> {
        const apiKey = this.getApiKey(options)
        if (!apiKey) {
            throw new Error('OpenAI API key not configured')
        }

        const formattedMessages = this.formatMessages(messages, systemPrompt)

        const response = await fetch(this.config.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: options.model || this.config.defaultModel,
                messages: formattedMessages,
                temperature: options.temperature ?? 0.7,
                max_tokens: options.maxTokens || this.config.maxTokens,
                stream: true,
                tools: options.tools?.length ? options.tools : undefined
            }),
            signal: options.abortSignal
        })

        if (!response.ok) {
            const error = await response.json().catch(() => ({}))
            throw new Error(
                `OpenAI API error: ${response.status} - ${error.error?.message || 'Unknown error'}`
            )
        }

        // Parse SSE stream
        yield* this.parseSSEStream(
            response,
            (data) => {
                const choice = data.choices?.[0]
                if (!choice) return null

                return {
                    content: choice.delta?.content || undefined,
                    toolCalls: choice.delta?.tool_calls || undefined
                }
            },
            options.abortSignal
        )
    }
}

// Export singleton instance
export const openaiProvider = new OpenAIProvider()
