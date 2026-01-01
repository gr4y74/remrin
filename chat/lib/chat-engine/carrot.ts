/**
 * Carrot Protocol - Follow-up Engine
 * 
 * Logic for deciding when and how to generate natural follow-up questions.
 */

import { ChatMessageContent } from './types';

export interface CarrotPersona {
    id: string;
    name: string;
    description: string | null;
    system_prompt: string;
    follow_up_likelihood?: number; // 0-100, default 40
}

export class CarrotEngine {
    /**
     * Determine if a follow-up should be generated.
     */
    static shouldGenerateFollowUp(
        messages: ChatMessageContent[],
        persona?: CarrotPersona
    ): boolean {
        // Only follow up on assistant responses
        if (messages.length === 0) return false;

        const likelihood = persona?.follow_up_likelihood ?? 40;

        // Don't follow up if likelihood is 0
        if (likelihood <= 0) return false;

        // Random chance based on likelihood
        const randomValue = Math.random() * 100;
        if (randomValue > likelihood) return false;

        // Basic heuristics:
        // 1. Don't follow up if the conversation is too short (unless it's a deep topic)
        if (messages.length < 2) return false;

        // 2. Check for engagement (message length)
        const userMessages = messages.filter(m => m.role === 'user');
        const lastUserMessage = userMessages[userMessages.length - 1];
        if (lastUserMessage && lastUserMessage.content.length < 5) {
            // Low engagement user message, maybe follow up less often
            if (Math.random() > 0.5) return false;
        }

        return true;
    }

    /**
     * Create a prompt to generate a natural follow-up question.
     */
    static generateFollowFollowUpPrompt(
        lastResponse: string,
        messages: ChatMessageContent[],
        persona: CarrotPersona
    ): string {
        const conversationContext = messages
            .slice(-3) // Take last few messages for context
            .map(m => `${m.role.toUpperCase()}: ${m.content}`)
            .join('\n');

        return `
You are ${persona.name}. You just finished saying:
"${lastResponse}"

Based on the conversation history:
${conversationContext}

YOUR TASK:
Generate a single, natural, and engaging follow-up question to keep the conversation flowing.
- It should feel like a continuation of your personality.
- It should be brief (1 sentence).
- It should be open-ended if possible.
- DO NOT repeat yourself.
- DO NOT answer for the user.
- Just output the question itself, nothing else.

NATURAL FOLLOW-UP QUESTION:`.trim();
    }
}
