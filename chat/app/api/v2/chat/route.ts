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
import fs from 'fs'

function debugLog(msg: string) {
    const log = `[${new Date().toISOString()}] ${msg}\n`
    fs.appendFileSync('/tmp/chat-debug.log', log)
    console.log(msg)
}
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
import { SEARCH_TOOLS } from '@/lib/tools/search-tools'
import { ToolDescriptor } from '@/lib/chat-engine/types'
import { CarrotEngine, CarrotPersona } from '@/lib/chat-engine/carrot'
import { buildConsoleSystemPrompt } from '@/lib/forge/console-adapter'
import { LOCKET_TOOLS, handleUpdateLocket, UpdateLocketParams } from '@/lib/tools/locket-tools'
import { getOrCreateChatSession, saveMessage } from '@/lib/chat-engine/persistence'
import { MEMORY_TOOLS } from '@/lib/tools/memory-tools'

export const runtime = 'nodejs' // Use Node.js runtime for streaming

/**
 * Get user's subscription tier from profile
 */
async function getUserTier(userId: string): Promise<UserTier> {
    const cookieStore = await cookies()
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

    const supabase = (await import('@/lib/supabase/server')).createAdminClient()

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
        const cookieStore = await cookies()
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

        debugLog(`🔍 [Memory] Request Body: personaId=${personaId}, messages=${messages?.length}`)

        // Get persona and system prompt (persona prompt takes priority)
        const persona = await getPersona(personaId)
        debugLog(`🔍 [Memory] getPersona result: ${persona ? persona.name : 'NULL'}`)

        //Use Console Adapter to build enhanced system prompt (Locket + Facts + Mood + Auto-injected Memories)
        let systemPrompt = customSystemPrompt || ''

        if (persona) {
            debugLog(`🧠 [Memory] TRACE-1: persona found, id=${persona.id}, building prompt...`)
            try {
                systemPrompt = await buildConsoleSystemPrompt(persona as any, user.id)
                debugLog(`🧠 [Memory] TRACE-2: prompt built, length=${systemPrompt.length}`)
            } catch (e: any) {
                debugLog(`🧠 [Memory] TRACE-ERR: buildConsoleSystemPrompt failed: ${e.message}`)
                systemPrompt = persona.system_prompt || ''
            }

            // === AUTO-INJECT RELEVANT MEMORIES ===
            const lastUserMessage = messages.filter(m => m.role === 'user').slice(-1)[0]
            const userText = lastUserMessage?.content || ''
            debugLog(`🧠 [Memory Auto-Inject] User message: "${userText.substring(0, 60)}..."`)

            if (userText.length > 3) {
                try {
                    // Extract keywords (remove stop words)
                    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'can', 'may', 'might', 'tell', 'me', 'about', 'what', 'who', 'when', 'where', 'why', 'how', 'you', 'your', 'remember', 'know'])
                    const keywords = userText.toLowerCase()
                        .replace(/[^a-z0-9\s-]/g, ' ')
                        .split(/\s+/)
                        .filter(w => w.length > 2 && !stopWords.has(w))

                    debugLog(`🧠 [Memory Auto-Inject] Keywords: ${JSON.stringify(keywords)}`)

                    if (keywords.length > 0) {
                        // Use service role client to search memories
                        const adminSupabase = (await import('@/lib/supabase/server')).createAdminClient()

                        const filters = keywords.map(k => `content.ilike.%${k}%`).join(',')
                        debugLog(`🧠 [Memory Auto-Inject] Filters: ${filters}`)

                        const { data: memories, error: memError } = await adminSupabase
                            .from('memories')
                            .select('content, created_at, role, importance')
                            .eq('user_id', user.id)
                            .eq('persona_id', personaId)
                            .or(filters)
                            .order('importance', { ascending: false })
                            .order('created_at', { ascending: false })
                            .limit(5)

                        debugLog(`🧠 [Memory Auto-Inject] Query result: ${memories?.length || 0} memories, error: ${memError?.message || 'none'}`)

                        if (memories && memories.length > 0) {
                            const memoryLines = ['\n[📚 RELEVANT PAST MEMORIES]', 'The following are memories from your past conversations with this user:', '']
                            memories.forEach((mem, idx) => {
                                const date = new Date(mem.created_at).toLocaleDateString()
                                const speaker = mem.role === 'user' ? 'User said' : 'You said'
                                memoryLines.push(`${idx + 1}. [${date}] ${speaker}: "${mem.content.substring(0, 200)}${mem.content.length > 200 ? '...' : '"'}`)
                            })
                            memoryLines.push('')
                            systemPrompt += memoryLines.join('\n')
                            debugLog(`🧠 [Memory Auto-Inject] Injected ${memories.length} memories into system prompt`)
                        }
                    }
                } catch (memErr: any) {
                    debugLog(`🧠 [Memory Auto-Inject] Error: ${memErr.message}`)
                }
            }
            // === END AUTO-INJECT ===
        } else if (!systemPrompt) {
            systemPrompt = 'You are a helpful AI assistant. Be concise but thorough in your responses.'
        }

        // Fetch LLM configuration from database
        const { data: llmConfigs } = await supabase
            .from('llm_config')
            .select('*')
            .order('priority', { ascending: false })

        // Create provider manager based on user's tier, passing dynamic config
        const providerManager = createProviderManager(
            userTier,
            preferredProvider as ProviderId | undefined,
            llmConfigs || undefined
        )

        let providerInfo = providerManager.getProviderInfo()
        debugLog(`🚀 [ChatEngine] Selected Provider for ${user.id} (${userTier}): ${providerInfo.name} (${providerInfo.id})`)

        // Check if this is the Mother of Souls
        const isMother = isMotherOfSouls(persona as any)

        // Build tools array - all personas get search, Mother gets additional Soul Forge tools
        const tools: ToolDescriptor[] = [
            ...SEARCH_TOOLS.map(t => ({
                type: t.type,
                function: t.function
            })),
            ...LOCKET_TOOLS.map(t => ({
                type: t.type,
                function: t.function
            })),
            ...MEMORY_TOOLS.map(t => ({
                type: t.type,
                function: t.function
            }))
        ]

        if (isMother) {
            tools.push(...SOUL_FORGE_TOOLS.map(t => ({
                type: t.type,
                function: t.function
            })))
        }

        // Get provider info for logging
        providerInfo = providerManager.getProviderInfo()

        // Fetch global API keys from the secure api_keys table
        // Use service role client to bypass RLS for this internal check
        const { data: globalKeys } = await supabase
            .from('api_keys')
            .select('provider, api_key')

        const globalKeysMap: Record<string, string> = (globalKeys || []).reduce((acc: any, k: any) => {
            acc[k.provider] = k.api_key
            return acc
        }, {})

        // Priority Provider Key: Database > Environment (handled in BaseChatProvider if not passed here)
        const providerKey = globalKeysMap[providerInfo.id]

        console.log(`🚀 [ChatEngine] Request from ${userTier} tier user, using ${providerInfo.name}${isMother ? ' (Mother Mode)' : ''}`)

        // Create streaming response
        const encoder = new TextEncoder()
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    // --- PERSISTENCE: Get/Create Chat Session & Save User Message ---
                    let chatId: string | null = null
                    if (personaId) {
                        try {
                            const supabaseService = createClient(cookieStore) // Use existing client
                            chatId = await getOrCreateChatSession(supabaseService, user.id, personaId)
                            console.log(`💾 [Persistence] Chat Session ID: ${chatId}`)

                            // Save User Message
                            // Use the LAST user message (current one)
                            const lastUserMsg = messages[messages.length - 1]
                            if (lastUserMsg.role === 'user') {
                                await saveMessage(supabaseService, chatId, user.id, lastUserMsg)
                            }
                        } catch (e) {
                            console.error('❌ [Persistence] Failed to init session or save user msg:', e)
                        }
                    }

                    // Convert messages to the expected format - PRESERVE tool fields!
                    const formattedMessages: ChatMessageContent[] = messages.map(msg => ({
                        role: msg.role,
                        content: msg.content,
                        tool_call_id: msg.tool_call_id,
                        timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
                        metadata: (msg as any).tool_calls ? { toolCalls: (msg as any).tool_calls } : undefined
                    }))

                    const estimatedPromptTokens = providerManager.estimatePromptTokens(formattedMessages, systemPrompt)
                    const totalChars = formattedMessages.reduce((sum, m) => sum + (m.content?.length || 0), 0) + (systemPrompt?.length || 0)
                    debugLog(`📊 [CreditSafety] Estimated Prompt Tokens: ${estimatedPromptTokens} (Total Chars: ${totalChars})`)

                    // Stream response from provider
                    let tokenCount = 0
                    let fullContent = '' // Accumulate full response for follow-up

                    debugLog(`📡 [ChatEngine] Sending request to ${providerInfo.id} for persona ${persona?.name || 'unknown'}`)
                    debugLog(`🛠️ [ChatEngine] Tools count: ${tools.length}`)
                    if (tools.length > 0) debugLog(`🛠️ [ChatEngine] Tools: ${JSON.stringify(tools.map(t => t.function.name))}`)
                    debugLog(`📝 [ChatEngine] System Prompt Length: ${systemPrompt.length}`)
                    debugLog(`📊 [ChatEngine] Messages Count: ${formattedMessages.length}, Total Chars: ${totalChars}`)
                    debugLog(`💬 [ChatEngine] Last Message: ${formattedMessages[formattedMessages.length - 1].content.substring(0, 100)}`)

                    try {
                        for await (const chunk of providerManager.sendMessage(
                            formattedMessages,
                            systemPrompt,
                            {
                                temperature: isMother ? 0.8 : 0.7,
                                tools: tools as ToolDescriptor[],
                                apiKey: providerKey,
                                model: 'deepseek-chat' // STRICT: Always use deepseek-chat to prevent reasoner burn
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
                    } catch (streamError: any) {
                        debugLog(`❌ [ChatEngine] Streaming Error Details: ${streamError.message}`)
                        if (streamError.stack) debugLog(`❌ [ChatEngine] Stack Trace: ${streamError.stack}`)

                        const errorData = JSON.stringify({
                            error: streamError.message || 'Stream failed',
                            provider: providerInfo.id,
                            stack: streamError.stack
                        })
                        controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
                    }

                    // Send done signal
                    controller.enqueue(encoder.encode(`data: [DONE]\n\n`))

                    console.log(`✅ [ChatEngine] Response complete, ~${tokenCount} tokens for provider ${providerInfo.id}`)

                    // --- PERSISTENCE: Save Assistant Response ---
                    if (chatId && fullContent) {
                        const supabaseService = createClient(cookieStore)
                        await saveMessage(supabaseService, chatId, user.id, {
                            role: 'assistant',
                            content: fullContent,
                            timestamp: new Date()
                        }, providerInfo.id)
                        console.log(`💾 [Persistence] Saved assistant response`)

                        // --- UNIVERSAL CONSOLE: Fact Saving & Memory Sync ---
                        try {
                            const adminSupabase = (await import('@/lib/supabase/server')).createAdminClient()

                            // 1. Check for [SAVE_FACT: type | content]
                            const saveFactRegex = /\[SAVE_FACT:\s*(\w+)\s*\|\s*(.+?)\]/g
                            let match
                            while ((match = saveFactRegex.exec(fullContent)) !== null) {
                                const [fullMatch, factType, factContent] = match
                                debugLog(`✨ [Universal Console] Saving Fact: ${factType} | ${factContent}`)
                                await adminSupabase.from('shared_facts').insert({
                                    user_id: user.id,
                                    fact_type: factType.toUpperCase(),
                                    content: factContent.trim(),
                                    shared_with_all: true
                                })
                            }

                            // 2. Save to memories table for vector sync (Role: Assistant)
                            await adminSupabase.from('memories').insert({
                                user_id: user.id,
                                persona_id: personaId,
                                role: 'assistant',
                                content: fullContent.replace(/\[SAVE_FACT:.+?\]/g, '').trim(),
                                importance: 3,
                                domain: 'personal'
                            })

                            // 3. Save to memories table (Role: User) - if not already existing
                            const lastUserMsg = messages[messages.length - 1]
                            if (lastUserMsg.role === 'user') {
                                await adminSupabase.from('memories').insert({
                                    user_id: user.id,
                                    persona_id: personaId,
                                    role: 'user',
                                    content: lastUserMsg.content,
                                    importance: 5,
                                    domain: 'personal'
                                })
                            }
                            debugLog(`🧠 [Universal Console] Synced interaction to memories table`)
                        } catch (e: any) {
                            console.error('❌ [Universal Console] Failed to sync memories or facts:', e)
                        }
                    }

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
                            {
                                temperature: 0.8,
                                maxTokens: 100,
                                model: 'deepseek-chat' // STRICT: Always use deepseek-chat for follow-ups to save credits
                            }
                        )) {
                            const content = chunk.content || ''
                            followUpContent += content
                            const followUpData = JSON.stringify({
                                type: 'followup',
                                content: content,
                                provider: providerInfo.id
                            })
                            controller.enqueue(encoder.encode(`data: ${followUpData}\n\n`))
                        }

                        console.log(`✅ [Carrot] Follow-up complete`)
                    }

                } catch (error) {
                    debugLog(`❌ [ChatEngine] Streaming Error: ${error instanceof Error ? error.message : String(error)}`)
                    if (error instanceof Error && error.stack) debugLog(error.stack)

                    const errorData = JSON.stringify({
                        error: error instanceof Error ? error.message : 'Unknown error',
                        provider: providerInfo.id,
                        stack: error instanceof Error ? error.stack : undefined
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
        console.error('❌ [ChatEngine] CRITICAL ERROR:', error)
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
