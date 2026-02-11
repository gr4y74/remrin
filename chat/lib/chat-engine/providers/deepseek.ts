/**
 * DeepSeek Provider
 * 
 * Default provider for FREE tier
 * Uses OpenAI-compatible API
 */

import { BaseChatProvider } from './base'
import {
    ProviderId,
    ChatMessageContent,
    ProviderOptions,
    PROVIDER_CONFIGS,
    ChatChunk
} from '../types'

export class DeepSeekProvider extends BaseChatProvider {
    id: ProviderId = 'deepseek'
    name = 'DeepSeek'

    constructor() {
        super(PROVIDER_CONFIGS.deepseek)
    }

    /**
     * Format messages for DeepSeek API (OpenAI-compatible)
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
                // For tool role, content MUST be a string
                if (typeof formattedMsg.content !== 'string') {
                    formattedMsg.content = JSON.stringify(formattedMsg.content)
                }
            }

            // Handle assistant messages with tool calls
            if (msg.role === 'assistant' && msg.metadata?.toolCalls) {
                formattedMsg.tool_calls = msg.metadata.toolCalls.map(tc => ({
                    id: tc.id,
                    type: 'function',
                    function: tc.function
                }))

                // If there's no content but there are tool calls, OpenAI still likes an empty string
                if (!formattedMsg.content) {
                    formattedMsg.content = null
                }
            }

            formatted.push(formattedMsg)
        }

        return formatted
    }

    /**
     * Send message and stream response with retries
     */
    async *sendMessage(
        messages: ChatMessageContent[],
        systemPrompt: string,
        options: ProviderOptions
    ): AsyncGenerator<ChatChunk, void, unknown> {
        const apiKey = this.getApiKey(options)
        if (!apiKey) {
            throw new Error('DeepSeek API key not configured')
        }

        const formattedMessages = this.formatMessages(messages, systemPrompt)

        const timeoutSignal = AbortSignal.timeout(60000) // 1 minute timeout
        let finalSignal = timeoutSignal
        if (options.abortSignal) {
            const controller = new AbortController()
            options.abortSignal.addEventListener('abort', () => controller.abort(options.abortSignal?.reason))
            timeoutSignal.addEventListener('abort', () => controller.abort(timeoutSignal.reason))
            finalSignal = controller.signal
        }

        const model = options.model || this.config.defaultModel
        console.log(`📡 [DeepSeek] Sending request using model: ${model} to ${this.config.apiEndpoint} (Size: ${JSON.stringify(formattedMessages).length} chars)`)

        const MAX_RETRIES = 3
        let lastError: any = null

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
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
                        tools: options.tools
                    }),
                    signal: finalSignal,
                    keepalive: true // [STABILITY] Use keepalive to maintain connection
                })

                if (!response.ok) {
                    const error = await response.json().catch(() => ({}))
                    throw new Error(
                        `DeepSeek API error: ${response.status} - ${error.error?.message || 'Unknown error'}`
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

                return // Success!
            } catch (error: any) {
                lastError = error
                const isNetworkError = error.message?.includes('fetch failed') || error.name === 'TypeError'

                console.error(`❌ [DeepSeek] Attempt ${attempt}/${MAX_RETRIES} failed: ${error.message}${error.cause ? ` (Cause: ${error.cause})` : ''}`)

                if (attempt < MAX_RETRIES && isNetworkError) {
                    const delay = Math.pow(2, attempt) * 1000 // Exponential backoff: 2s, 4s, 8s
                    console.log(`🔄 [DeepSeek] Retrying in ${delay}ms...`)
                    await new Promise(resolve => setTimeout(resolve, delay))
                    continue
                }

                throw error
            }
        }
    }
}

// Export singleton instance
export const deepseekProvider = new DeepSeekProvider()
