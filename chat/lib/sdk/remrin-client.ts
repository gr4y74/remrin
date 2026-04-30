/**
 * Remrin JS SDKpports streaming chat completions via Server-Sent Events (SSE).
 */

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
}

export interface ChatRequest {
    personaId: string;
    messages: ChatMessage[];
    systemPrompt?: string;
    llm_provider?: string;
    llm_model?: string;
}

export interface ChatChunk {
    content?: string;
    toolCalls?: any[];
    isDone?: boolean;
}

/**
 * The primary entry point for the Remrin API.
 */
export class RemrinClient {
    private apiKey: string;
    private baseUrl: string;

    /**
     * @param apiKey Your Remrin API key (rmrn_pk_... or rmrn_sk_...)
     * @param options Optional configuration
     */
    constructor(apiKey: string, options?: { baseUrl?: string }) {
        this.apiKey = apiKey;
        this.baseUrl = options?.baseUrl || 'https://remrin.ai/api/v1';
    }

    /**
     * Access chat-related endpoints.
     */
    get chat() {
        return {
            /**
             * Streams a chat completion response.
             * @param request The chat request parameters
             * @returns An async iterator that yields response chunks
             */
            stream: async function* (this: RemrinClient, request: ChatRequest): AsyncGenerator<ChatChunk> {
                const response = await fetch(`${this.baseUrl}/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(request),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Remrin API Error (${response.status}): ${errorText}`);
                }

                if (!response.body) {
                    throw new Error('Response body is empty');
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';

                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split('\n');

                        // Keep the last partial line in the buffer
                        buffer = lines.pop() || '';

                        for (const line of lines) {
                            const trimmedLine = line.trim();
                            if (!trimmedLine) continue;

                            if (trimmedLine.startsWith('data: ')) {
                                const dataStr = trimmedLine.slice(6);
                                if (dataStr === '[DONE]') {
                                    yield { isDone: true };
                                    return;
                                }

                                try {
                                    const parsed = JSON.parse(dataStr);
                                    yield {
                                        content: parsed.content,
                                        toolCalls: parsed.toolCalls,
                                        isDone: false
                                    };
                                } catch (e) {
                                    console.warn('Failed to parse SSE data chunk:', dataStr);
                                }
                            }
                        }
                    }
                } finally {
                    reader.releaseLock();
                }
            }.bind(this)
        };
    }
}
 * A lightweight client for interacting with the Remrin B2B API.
 * Supports streaming chat completions via Server - Sent Events(SSE).
 */

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
}

export interface ChatRequest {
    personaId: string;
    messages: ChatMessage[];
    systemPrompt?: string;
    llm_provider?: string;
    llm_model?: string;
}

export interface ChatChunk {
    content?: string;
    toolCalls?: any[];
    isDone?: boolean;
}

/**
 * The primary entry point for the Remrin API.
 */
export class RemrinClient {
    private apiKey: string;
    private baseUrl: string;

    /**
     * @param apiKey Your Remrin API key (rmrn_pk_... or rmrn_sk_...)
     * @param options Optional configuration
     */
    constructor(apiKey: string, options?: { baseUrl?: string }) {
        this.apiKey = apiKey;
        this.baseUrl = options?.baseUrl || 'https://remrin.ai/api/v1';
    }

    /**
     * Access chat-related endpoints.
     */
    get chat() {
        return {
            /**
             * Streams a chat completion response.
             * @param request The chat request parameters
             * @returns An async iterator that yields response chunks
             */
            stream: async function* (this: RemrinClient, request: ChatRequest): AsyncGenerator<ChatChunk> {
                const response = await fetch(`${this.baseUrl}/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(request),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Remrin API Error (${response.status}): ${errorText}`);
                }

                if (!response.body) {
                    throw new Error('Response body is empty');
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';

                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split('\n');

                        // Keep the last partial line in the buffer
                        buffer = lines.pop() || '';

                        for (const line of lines) {
                            const trimmedLine = line.trim();
                            if (!trimmedLine) continue;

                            if (trimmedLine.startsWith('data: ')) {
                                const dataStr = trimmedLine.slice(6);
                                if (dataStr === '[DONE]') {
                                    yield { isDone: true };
                                    return;
                                }

                                try {
                                    const parsed = JSON.parse(dataStr);
                                    yield {
                                        content: parsed.content,
                                        toolCalls: parsed.toolCalls,
                                        isDone: false
                                    };
                                } catch (e) {
                                    console.warn('Failed to parse SSE data chunk:', dataStr);
                                }
                            }
                        }
                    }
                } finally {
                    reader.releaseLock();
                }
            }.bind(this)
        };
    }
}
