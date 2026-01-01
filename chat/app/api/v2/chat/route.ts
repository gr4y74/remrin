/**
 * Remrin Chat Engine API v2
 * 
 * Unified chat endpoint with tier-based routing
 * Replaces all the complex ChatbotUI routing
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { createProviderManager } from '@/lib/chat-engine/providers'
import {
    ChatRequest,
    ChatMessageContent,
    UserTier,
    ProviderId
} from '@/lib/chat-engine/types'
import { handleApiError } from '@/lib/errors'
import { rateLimit } from '@/lib/rate-limit'
import { isMotherOfSouls } from '@/lib/forge/is-mother-chat'
import { SOUL_FORGE_TOOLS } from '@/lib/tools/soul-forge-tools'
import { ToolDescriptor } from '@/lib/chat-engine/types'

export const runtime = 'nodejs' // Use Node.js runtime for streaming

/**
 * Get user's subscription tier from profile
 */
async function getUserTier(userId: string): Promise<UserTier> {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', userId)
        .single()

    // Default to free tier
    const tier = (profile?.subscription_tier || 'free') as UserTier

    // Validate tier
    if (!['free', 'pro', 'premium', 'enterprise'].includes(tier)) {
        return 'free'
    }

    return tier
}

/**
 * Get the persona if persona is selected
 */
async function getPersona(personaId: string | undefined): Promise<CarrotPersona | null> {
    if (!personaId) return null

    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    const { data: persona } = await supabase
        .from('personas')
        .select('id, name, description, system_prompt, follow_up_likelihood')
        .eq('id', personaId)
        .single()

    return persona as CarrotPersona | null
}

export async function POST(request: NextRequest) {
    try {
        // Get current user
        const cookieStore = cookies()
        const supabase = createClient(cookieStore)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return new Response('Unauthorized', { status: 401 })
        }

        // Rate limiting
        const ip = request.headers.get('x-forwarded-for') || 'unknown'
        if (!rateLimit(ip)) {
            return new Response('Too Many Requests', { status: 429 })
        }

        // Parse request
        const body: ChatRequest = await request.json()
        const {
            messages,
            personaId,
            systemPrompt: customSystemPrompt,
            preferredProvider,
            enableSearch,
            files
        } = body

        // Validate messages
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return new Response('Messages are required', { status: 400 })
        }

        // Get user's tier
        const userTier = await getUserTier(user.id)

        // Get persona and system prompt (persona prompt takes priority)
        const persona = await getPersona(personaId)
        const systemPrompt = persona?.system_prompt || customSystemPrompt ||
            'You are a helpful AI assistant. Be concise but thorough in your responses.'

        // Create provider manager based on user's tier
        const providerManager = createProviderManager(
            userTier,
            preferredProvider as ProviderId | undefined
        )

        // Check if this is the Mother of Souls
        const isMother = isMotherOfSouls(persona as any)
        const tools = isMother ? SOUL_FORGE_TOOLS.map(t => ({
            type: t.type,
            function: t.function
        })) : undefined

        // Get provider info for logging
        const providerInfo = providerManager.getProviderInfo()
        console.log(`🚀 [ChatEngine] Request from ${userTier} tier user, using ${providerInfo.name}${isMother ? ' (Mother Mode)' : ''}`)

        // Create streaming response
        const encoder = new TextEncoder()
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    // Convert messages to the expected format
                    const formattedMessages: ChatMessageContent[] = messages.map(msg => ({
                        role: msg.role,
                        content: msg.content,
                        timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
                    }))

                    // Stream response from provider
                    let tokenCount = 0
                    let fullContent = '' // Accumulate full response for follow-up
                    for await (const chunk of providerManager.sendMessage(
                        formattedMessages,
                        systemPrompt,
                        {
                            temperature: isMother ? 0.8 : 0.7,
                            tools: tools as ToolDescriptor[]
                        }
                    )) {
                        if (chunk.content) fullContent += chunk.content

                        // Send chunk as SSE
                        const data = JSON.stringify({
                            content: chunk.content,
                            toolCalls: chunk.toolCalls,
                            provider: providerInfo.id
                        })
                        controller.enqueue(encoder.encode(`data: ${data}\n\n`))
                        tokenCount += Math.ceil((chunk.content?.length || 0) / 4)
                    }

                    // Send done signal
                    controller.enqueue(encoder.encode(`data: [DONE]\n\n`))

                    console.log(`✅ [ChatEngine] Response complete, ~${tokenCount} tokens`)

                    // --- Carrot Follow-up Logic ---
                    if (persona && CarrotEngine.shouldGenerateFollowUp(formattedMessages, persona)) {
                        console.log(`🥕 [Carrot] Generating follow-up for persona: ${persona.name}`)

                        // Add 1-2 second delay
                        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000))

                        // Add assistant response to context for follow-up generation
                        const messagesWithResponse = [
                            ...formattedMessages,
                            { role: 'assistant', content: fullContent, timestamp: new Date() } as ChatMessageContent
                        ]

                        const followUpPrompt = CarrotEngine.generateFollowFollowUpPrompt(
                            fullContent,
                            formattedMessages,
                            persona
                        )

                        let followUpContent = ''
                        for await (const chunk of providerManager.sendMessage(
                            messagesWithResponse,
                            followUpPrompt,
                            { temperature: 0.8, maxTokens: 100 }
                        )) {
                            followUpContent += chunk
                            const followUpData = JSON.stringify({
                                type: 'followup',
                                content: chunk,
                                provider: providerInfo.id
                            })
                            controller.enqueue(encoder.encode(`data: ${followUpData}\n\n`))
                        }

                        console.log(`✅ [Carrot] Follow-up complete`)
                    }

                } catch (error) {
                    console.error('❌ [ChatEngine] Error:', error)
                    const errorData = JSON.stringify({
                        error: error instanceof Error ? error.message : 'Unknown error'
                    })
                    controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
                } finally {
                    controller.close()
                }
            }
        })

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'X-Provider': providerInfo.id
            }
        })

    } catch (error) {
        return handleApiError(error)
    }
}

/**
 * GET endpoint to check available providers for current user
 */
export async function GET(request: NextRequest) {
    try {
        const cookieStore = cookies()
        const supabase = createClient(cookieStore)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return new Response('Unauthorized', { status: 401 })
        }

        const userTier = await getUserTier(user.id)
        const providerManager = createProviderManager(userTier)

        const availableProviders = providerManager.getAvailableProviders().map(p => ({
            id: p.id,
            name: p.name
        }))

        return new Response(
            JSON.stringify({
                tier: userTier,
                providers: availableProviders,
                defaultProvider: providerManager.getProviderInfo()
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        return handleApiError(error)
    }
}
