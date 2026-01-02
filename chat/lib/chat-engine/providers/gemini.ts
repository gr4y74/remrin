/**
 * Gemini Provider
 * 
 * Google Gemini API - Available for Premium+ tiers
 */

import { BaseChatProvider } from './base'
import {
    ProviderId,
    ChatMessageContent,
    ProviderOptions,
    PROVIDER_CONFIGS,
    ChatChunk
} from '../types'

export class GeminiProvider extends BaseChatProvider {
    id: ProviderId = 'gemini'
    name = 'Gemini'

    constructor() {
        super(PROVIDER_CONFIGS.gemini)
    }

    /**
     * Format messages for Gemini API
     * Gemini uses a different format with 'parts' and 'role' mapping
     */
    protected formatMessages(
        messages: ChatMessageContent[],
        systemPrompt: string
    ): { systemInstruction: any; contents: any[] } {
        const contents: any[] = []

        // Add conversation messages
        for (const msg of messages) {
            contents.push({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            })
        }

        return {
            systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
            contents
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
            throw new Error('Google Gemini API key not configured')
        }

        const model = options.model || this.config.defaultModel
        const { systemInstruction, contents } = this.formatMessages(messages, systemPrompt)

        const url = `${this.config.apiEndpoint}/${model}:streamGenerateContent?key=${apiKey}&alt=sse`

        const body: any = {
            contents,
            generationConfig: {
                maxOutputTokens: options.maxTokens || this.config.maxTokens,
                temperature: options.temperature ?? 0.7
            }
        }

        if (systemInstruction) {
            body.systemInstruction = systemInstruction
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body),
            signal: options.abortSignal
        })

        if (!response.ok) {
            const error = await response.json().catch(() => ({}))
            throw new Error(
                `Gemini API error: ${response.status} - ${error.error?.message || 'Unknown error'}`
            )
        }

        // Parse SSE stream (Gemini format)
        yield* this.parseGeminiStream(response, options.abortSignal)
    }

    /**
     * Gemini has its own SSE format
     */
    private async *parseGeminiStream(
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

                            // Gemini format: candidates[0].content.parts[0].text
                            const text = json.candidates?.[0]?.content?.parts?.[0]?.text
                            if (text) yield { content: text }
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
export const geminiProvider = new GeminiProvider()
