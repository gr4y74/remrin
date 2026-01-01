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
    PROVIDER_CONFIGS
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
    ): AsyncGenerator<string, void, unknown> {
        const apiKey = this.getApiKey()
        if (!apiKey) {
            throw new Error('DeepSeek API key not configured')
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
                stream: true
            }),
            signal: options.abortSignal
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
            (data) => data.choices?.[0]?.delta?.content || null,
            options.abortSignal
        )
    }
}

// Export singleton instance
export const deepseekProvider = new DeepSeekProvider()
