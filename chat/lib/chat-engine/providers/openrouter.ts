/**
 * OpenRouter Provider
 * 
 * FREE tier default provider using OpenRouter's free models
 * No API credits needed for free models!
 */

import { BaseChatProvider } from './base'
import {
    ProviderId,
    ChatMessageContent,
    ProviderOptions,
    ChatChunk
} from '../types'

const OPENROUTER_CONFIG = {
    id: 'openrouter' as ProviderId,
    name: 'OpenRouter',
    apiEndpoint: 'https://openrouter.ai/api/v1/chat/completions',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    isEnabled: true,
    defaultModel: 'mistralai/mistral-7b-instruct:free', // FREE - no credits needed
    maxTokens: 4096
}

export class OpenRouterProvider extends BaseChatProvider {
    id: ProviderId = 'openrouter'
    name = 'OpenRouter'

    constructor() {
        super(OPENROUTER_CONFIG)
    }

    /**
     * Format messages for OpenRouter API (OpenAI-compatible)
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
            formatted.push({
                role: msg.role,
                content: msg.content
            })
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
        const apiKey = this.getApiKey()
        if (!apiKey) {
            throw new Error('OpenRouter API key not configured. Add OPENROUTER_API_KEY to .env.local')
        }

        const formattedMessages = this.formatMessages(messages, systemPrompt)
        const model = options.model || this.config.defaultModel

        console.log(`🌐 [OpenRouter] Using model: ${model}`)

        const response = await fetch(this.config.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://remrin.com', // Required by OpenRouter
                'X-Title': 'Remrin Chat' // Optional but recommended
            },
            body: JSON.stringify({
                model: model,
                messages: formattedMessages,
                temperature: options.temperature ?? 0.7,
                max_tokens: options.maxTokens || this.config.maxTokens,
                stream: true,
                tools: options.tools
            }),
            signal: options.abortSignal
        })

        if (!response.ok) {
            const error = await response.json().catch(() => ({}))
            throw new Error(
                `OpenRouter API error: ${response.status} - ${error.error?.message || JSON.stringify(error)}`
            )
        }

        // Parse SSE stream (OpenAI-compatible format)
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
export const openrouterProvider = new OpenRouterProvider()
