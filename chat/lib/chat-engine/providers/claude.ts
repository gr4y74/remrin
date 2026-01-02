/**
 * Claude Provider
 * 
 * Anthropic Claude API - Available for Pro+ tiers
 */

import { BaseChatProvider } from './base'
import {
    ProviderId,
    ChatMessageContent,
    ProviderOptions,
    PROVIDER_CONFIGS,
    ChatChunk
} from '../types'

export class ClaudeProvider extends BaseChatProvider {
    id: ProviderId = 'claude'
    name = 'Claude'

    constructor() {
        super(PROVIDER_CONFIGS.claude)
    }

    /**
     * Format messages for Anthropic Claude API
     * Claude has a different format than OpenAI
     */
    protected formatMessages(
        messages: ChatMessageContent[],
        systemPrompt: string
    ): { system: string; messages: any[] } {
        const formatted: any[] = []

        // Add conversation messages (Claude doesn't include system in messages array)
        for (const msg of messages) {
            formatted.push({
                role: msg.role === 'assistant' ? 'assistant' : 'user',
                content: msg.content
            })
        }

        return {
            system: systemPrompt || '',
            messages: formatted
        }
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
            throw new Error('Anthropic API key not configured')
        }

        const { system, messages: formattedMessages } = this.formatMessages(messages, systemPrompt)

        const response = await fetch(this.config.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: options.model || this.config.defaultModel,
                system: system,
                messages: formattedMessages,
                max_tokens: options.maxTokens || this.config.maxTokens,
                stream: true
            }),
            signal: options.abortSignal
        })

        if (!response.ok) {
            const error = await response.json().catch(() => ({}))
            throw new Error(
                `Claude API error: ${response.status} - ${error.error?.message || 'Unknown error'}`
            )
        }

        // Parse SSE stream (Claude format)
        yield* this.parseClaudeStream(response, options.abortSignal)
    }

    /**
     * Claude has a slightly different SSE format
     */
    private async *parseClaudeStream(
        response: Response,
        abortSignal?: AbortSignal
    ): AsyncGenerator<ChatChunk, void, unknown> {
        const reader = response.body?.getReader()
        if (!reader) throw new Error('No response body')

        const decoder = new TextDecoder()
        let buffer = ''

        try {
            while (true) {
                if (abortSignal?.aborted) {
                    reader.cancel()
                    break
                }

                const { done, value } = await reader.read()
                if (done) break

                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split('\n')
                buffer = lines.pop() || ''

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6).trim()

                        try {
                            const json = JSON.parse(data)

                            // Claude uses content_block_delta events
                            if (json.type === 'content_block_delta') {
                                const text = json.delta?.text
                                if (text) yield { content: text }
                            }

                            // Check for stop
                            if (json.type === 'message_stop') {
                                return
                            }
                        } catch {
                            // Skip invalid JSON
                        }
                    }
                }
            }
        } finally {
            reader.releaseLock()
        }
    }
}

// Export singleton instance
export const claudeProvider = new ClaudeProvider()
