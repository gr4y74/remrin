/**
 * Base Chat Provider
 * 
 * Abstract base class for all LLM providers
 */

import {
    IChatProvider,
    ProviderId,
    ChatMessageContent,
    ProviderOptions,
    ProviderConfig
} from '../types'

export abstract class BaseChatProvider implements IChatProvider {
    abstract id: ProviderId
    abstract name: string
    protected config: ProviderConfig

    constructor(config: ProviderConfig) {
        this.config = config
    }

    /**
     * Get the API key from environment
     */
    protected getApiKey(): string | null {
        if (!this.config.apiKeyEnv) return null
        return process.env[this.config.apiKeyEnv] || null
    }

    /**
     * Check if provider is available (has API key and is enabled)
     */
    isAvailable(): boolean {
        if (!this.config.isEnabled) return false
        const apiKey = this.getApiKey()
        return !!apiKey && apiKey.length > 0
    }

    /**
     * Convert our message format to provider-specific format
     */
    protected abstract formatMessages(
        messages: ChatMessageContent[],
        systemPrompt: string
    ): any // Different providers have different formats

    /**
     * Send message and stream response
     */
    abstract sendMessage(
        messages: ChatMessageContent[],
        systemPrompt: string,
        options: ProviderOptions
    ): AsyncGenerator<string, void, unknown>

    /**
     * Estimate token count (rough approximation: ~4 chars per token)
     */
    estimateTokens(messages: ChatMessageContent[]): number {
        const totalChars = messages.reduce((sum, msg) => sum + msg.content.length, 0)
        return Math.ceil(totalChars / 4)
    }

    /**
     * Helper to parse SSE stream
     */
    protected async *parseSSEStream(
        response: Response,
        extractContent: (data: any) => string | null,
        abortSignal?: AbortSignal
    ): AsyncGenerator<string, void, unknown> {
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
                        if (data === '[DONE]') return

                        try {
                            const json = JSON.parse(data)
                            const content = extractContent(json)
                            if (content) yield content
                        } catch {
                            // Skip invalid JSON lines
                        }
                    }
                }
            }
        } finally {
            reader.releaseLock()
        }
    }
}
