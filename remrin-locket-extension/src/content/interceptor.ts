/**
 * Input Interceptor
 * Wraps user messages with persona context before submission
 */

import type { Soul } from '../types'
import { isNewChat, getInputText, setInputText } from './sites/selectors'

export class InputInterceptor {
    private sessionInjected = false
    private lastSoulId: string | null = null

    /**
     * Wrap user input with persona context
     */
    async wrapInput(
        inputElement: HTMLElement,
        soul: Soul,
        ragContext: string = ''
    ): Promise<string> {
        const userText = getInputText(inputElement)
        if (!userText.trim()) return userText

        // Check if we need full injection or light injection
        const needsFullInjection =
            isNewChat() ||
            !this.sessionInjected ||
            this.lastSoulId !== soul.id

        let wrappedText: string

        if (needsFullInjection) {
            wrappedText = this.buildFullInjection(soul, ragContext, userText)
            this.sessionInjected = true
            this.lastSoulId = soul.id
        } else {
            wrappedText = this.buildLightInjection(ragContext, userText)
        }

        return wrappedText
    }

    /**
     * Build full persona injection for new conversations
     */
    private buildFullInjection(soul: Soul, rag: string, userText: string): string {
        const parts: string[] = []

        // Persona system block
        parts.push(`[REMRIN PERSONA ACTIVE]
You are now embodying the following character. Maintain this persona throughout our conversation.

## Character: ${soul.name}
${soul.system_prompt}`)

        // Core memories if available
        if (soul.locket_data) {
            parts.push(`
## Core Memories (Locket):
${soul.locket_data}`)
        }

        // RAG context if available
        if (rag) {
            parts.push(`
## Relevant Context:
${rag}`)
        }

        // End marker and user message
        parts.push(`
---
[END OF PERSONA SYSTEM - Respond as ${soul.name}]

${userText}`)

        return parts.join('\n')
    }

    /**
     * Build light context injection for ongoing conversations
     */
    private buildLightInjection(rag: string, userText: string): string {
        if (rag && rag.trim()) {
            return `[Relevant context from memory:\n${rag}]\n\n${userText}`
        }
        return userText
    }

    /**
     * Reset session state (call on navigation)
     */
    reset(): void {
        this.sessionInjected = false
        this.lastSoulId = null
    }
}
