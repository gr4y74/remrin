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
import { generateEmbedding } from '@/lib/chat-engine/embeddings'
import { searchManager } from '@/lib/chat-engine/capabilities/search'
import { User } from '@supabase/supabase-js'

function debugLog(msg: string) {
    if (process.env.NODE_ENV === 'development') {
        console.log(`[ChatEngine] ${msg}`)
    }
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
import { LOCKET_TOOLS } from '@/lib/tools/locket-tools'
import { getOrCreateChatSession, saveMessage } from '@/lib/chat-engine/persistence'
import { MEMORY_TOOLS } from '@/lib/tools/memory-tools'

export const runtime = 'nodejs' // Use Node.js runtime for streaming

/**
 * Get user's subscription tier from profile
 */
async function getUserTier(userId: string): Promise<UserTier> {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Tier is now stored in the wallets table
    const { data: wallet } = await supabase
        .from('wallets')
        .select('tier')
        .eq('user_id', userId)
        .maybeSingle()

    // Map database tiers (wanderer, soul_weaver, architect, titan) 
    // to Chat Engine tiers (free, pro, premium, enterprise)
    const dbTier = wallet?.tier || 'wanderer'

    const tierMap: Record<string, UserTier> = {
        'wanderer': 'free',
        'soul_weaver': 'pro',
        'architect': 'premium',
        'titan': 'enterprise'
    }

    return tierMap[dbTier] || 'free'
}

/**
 * Get the persona if persona is selected
 */
async function getPersona(personaId: string | undefined): Promise<CarrotPersona | null> {
    if (!personaId) return null

    const supabase = (await import('@/lib/supabase/server')).createAdminClient()

    const { data: persona } = await supabase
        .from('personas')
        .select('id, name, description, system_prompt')
        .eq('id', personaId)
        .single()

    return persona as CarrotPersona | null
}

export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies()
        const allCookies = cookieStore.getAll()
        debugLog(`🍪 [ChatEngine] Cookies count: ${allCookies.length}`)

        const supabase = createClient(cookieStore)

        // Use getSession first
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) debugLog(`❌ [ChatEngine] Session Error: ${sessionError.message}`)

        let user: User | null = session?.user || null

        // Fallback to get user from Authorization header if session/cookies failed
        if (!user) {
            const authHeader = request.headers.get('Authorization')
            if (authHeader?.startsWith('Bearer ')) {
                const token = authHeader.split(' ')[1]
                const { data: { user: verifiedUser } } = await supabase.auth.getUser(token)
                user = verifiedUser
            }
        }

        // Final Fallback to getUser from cookies
        if (!user) {
            debugLog(`⚠️ [ChatEngine] No session/token, trying getUser from cookies...`)
            const { data: { user: verifiedUser } } = await supabase.auth.getUser()
            user = verifiedUser
        }

        if (!user) {
            debugLog(`🚫 [ChatEngine] Unauthorized: No user found after session, token & cookie checks.`)
            return new Response('Unauthorized', { status: 401 })
        }

        const userId = user.id
        debugLog(`✅ [ChatEngine] Authorized: user=${userId}`)

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
            workspaceId,
            customName,
            llm_model
        } = body

        // Validate messages
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return new Response('Messages are required', { status: 400 })
        }

        // Get user's tier
        const userTier = await getUserTier(userId)

        // Process persona and system prompt
        const persona = await getPersona(personaId)
        let systemPrompt = customSystemPrompt || ''

        // === PROCESS FILE ATTACHMENTS (V2) ===
        if (body.files && body.files.length > 0) {
            console.log(`📂 [ChatAPI] Received ${body.files.length} file attachments.`)
            try {
                const { processFileAttachments } = await import('@/lib/chat-engine/capabilities/files')
                const fileContext = await processFileAttachments(body.files as any)
                if (fileContext) {
                    console.log(`✅ [ChatAPI] Processed file context length: ${fileContext.length} chars.`)
                    // Inject into the LAST user message for maximum model focus
                    const userMessages = messages.filter(m => m.role === 'user')
                    if (userMessages.length > 0) {
                        const lastUserMsg = userMessages[userMessages.length - 1]
                        lastUserMsg.content = `${lastUserMsg.content}\n\n---\n[📂 ATTACHED DOCUMENTS - VERIFIED_V2]\n${fileContext}\n[END ATTACHMENTS]`
                    } else {
                        // Fallback to system prompt if no user messages (rare)
                        systemPrompt += `\n\n[📂 ATTACHED DOCUMENTS - VERIFIED_V2]\nThe following documents have been provided:\n${fileContext}\n`
                    }
                }
            } catch (fileErr) {
                console.error('❌ [ChatEngine] File processing error:', fileErr)
            }
        }

        if (persona) {
            try {
                const basePrompt = await buildConsoleSystemPrompt(persona as any, userId)
                systemPrompt = basePrompt + (systemPrompt ? `\n\n${systemPrompt}` : '')
            } catch (e: any) {
                systemPrompt = (persona.system_prompt || '') + (systemPrompt ? `\n\n${systemPrompt}` : '')
            }

            // === AUTO-INJECT RELEVANT MEMORIES ===
            const lastUserMessage = messages.filter(m => m.role === 'user').slice(-1)[0]
            const userText = lastUserMessage?.content || ''

            if (userText.length > 3 && personaId) {
                try {
                    const userEmbedding = await generateEmbedding(userText)
                    const adminSupabase = (await import('@/lib/supabase/server')).createAdminClient()

                    const { data: memories } = await adminSupabase
                        .rpc('match_memories', {
                            query_embedding: userEmbedding,
                            match_user_id: userId,
                            match_persona_id: personaId,
                            match_threshold: 0.5,
                            match_count: 10
                        })

                    if (memories && memories.length > 0) {
                        const memoryLines = ['\n[📚 RELEVANT PAST MEMORIES]', 'The following are memories from your past conversations with this user (sorted by relevance):', '']
                        memories.forEach((mem: { created_at: string; role: string; similarity: number; content: string }, idx: number) => {
                            const date = new Date(mem.created_at).toLocaleDateString()
                            const speaker = mem.role === 'user' ? 'User said' : 'You said'
                            const similarity = Math.round((1 - mem.similarity) * 100)
                            memoryLines.push(`${idx + 1}. [${date}, ${similarity}% match] ${speaker}: "${mem.content.substring(0, 200)}${mem.content.length > 200 ? '...' : '"'}`)
                        })
                        memoryLines.push('')
                        systemPrompt += memoryLines.join('\n')
                    }
                } catch (memErr) { }
            }
        } else if (!systemPrompt) {
            systemPrompt = 'You are a helpful AI assistant. Be concise but thorough in your responses.'
        }

        // Fetch LLM configuration
        const { data: llmConfigs } = await supabase
            .from('llm_config')
            .select('*')
            .order('priority', { ascending: false })

        // Create provider manager
        const providerManager = createProviderManager(
            userTier,
            preferredProvider as ProviderId | undefined,
            llmConfigs || undefined
        )

        let providerInfo = providerManager.getProviderInfo()
        const isMother = isMotherOfSouls(persona as any)

        const tools: ToolDescriptor[] = [
            ...SEARCH_TOOLS.map(t => ({ type: t.type, function: t.function })),
            ...LOCKET_TOOLS.map(t => ({ type: t.type, function: t.function })),
            ...MEMORY_TOOLS.map(t => ({ type: t.type, function: t.function }))
        ]

        if (isMother) {
            tools.push(...SOUL_FORGE_TOOLS.map(t => ({ type: t.type, function: t.function })))
        }

        const { data: globalKeys } = await supabase.from('api_keys').select('provider, api_key')
        const globalKeysMap: Record<string, string> = (globalKeys || []).reduce((acc: Record<string, string>, k: { provider: string; api_key: string }) => {
            acc[k.provider] = k.api_key
            return acc
        }, {})

        const providerKey = globalKeysMap[providerInfo.id]

        // Create streaming response
        const encoder = new TextEncoder()
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    const executeTool = async (toolName: string, params: any, pId: string, uId: string) => {
                        try {
                            const adminSupabase = (await import('@/lib/supabase/server')).createAdminClient()
                            switch (toolName) {
                                case 'search_memories': {
                                    const { query, limit = 5 } = params
                                    const embedding = await generateEmbedding(query)
                                    let memories: any[] = []
                                    if (embedding) {
                                        const { data: matched } = await adminSupabase.rpc('match_memories_v2', {
                                            query_embedding: embedding,
                                            match_threshold: 0.5,
                                            match_count: limit,
                                            filter_persona: pId,
                                            filter_user: uId
                                        })
                                        if (matched) memories = matched
                                    }
                                    return JSON.stringify(memories)
                                }
                                case 'web_search': {
                                    const { query, max_results = 5 } = params
                                    const response = await searchManager.search(query, max_results)
                                    return JSON.stringify(response.results || [])
                                }
                                default:
                                    return `Tool ${toolName} not implemented.`
                            }
                        } catch (e: any) {
                            return `Error: ${e.message}`
                        }
                    }

                    const runChatRound = async (currentMessages: ChatMessageContent[], depth = 0): Promise<string> => {
                        if (depth > 3) return ""
                        let roundContent = ""
                        let roundToolCalls: any[] = []

                        for await (const chunk of providerManager.sendMessage(
                            currentMessages,
                            systemPrompt,
                            {
                                temperature: isMother ? 0.8 : 0.7,
                                tools: tools as ToolDescriptor[],
                                apiKey: providerKey,
                                model: llm_model || 'deepseek-chat'
                            }
                        )) {
                            if (chunk.content) roundContent += chunk.content
                            if (chunk.toolCalls) {
                                chunk.toolCalls.forEach((tc: any) => {
                                    const index = tc.index ?? 0
                                    if (!roundToolCalls[index]) roundToolCalls[index] = { id: tc.id, function: { name: '', arguments: '' } }
                                    if (tc.id) roundToolCalls[index].id = tc.id
                                    if (tc.function?.name) roundToolCalls[index].function.name += tc.function.name
                                    if (tc.function?.arguments) roundToolCalls[index].function.arguments += tc.function.arguments
                                });
                            }
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                                content: chunk.content,
                                reasoning: chunk.reasoning,
                                toolCalls: chunk.toolCalls,
                                provider: providerInfo.id,
                                depth
                            })}\n\n`))
                        }

                        const activeToolCalls = roundToolCalls.filter(tc => tc && tc.function?.name)
                        if (activeToolCalls.length > 0) {
                            const nextMessages = [...currentMessages]
                            nextMessages.push({ role: 'assistant', content: roundContent, metadata: { toolCalls: activeToolCalls } } as any)
                            const results = await Promise.all(activeToolCalls.map(async (tc) => {
                                let args = {}
                                try { args = JSON.parse(tc.function.arguments) } catch (e) { }
                                const result = await executeTool(tc.function.name, args, personaId!, userId)
                                return { role: 'tool', tool_call_id: tc.id, content: result }
                            }))
                            nextMessages.push(...results as any)
                            return roundContent + await runChatRound(nextMessages, depth + 1)
                        }
                        return roundContent
                    }

                    let chatId: string | null = null
                    let userMessageId: string | null = null
                    if (personaId) {
                        chatId = await getOrCreateChatSession(supabase, userId, personaId, { customName, workspaceId })
                        const lastUserMsg = messages[messages.length - 1]
                        if (lastUserMsg.role === 'user') {
                            userMessageId = await saveMessage(supabase, chatId, userId, lastUserMsg)
                        }
                    }

                    const formattedMessages: ChatMessageContent[] = messages.map(msg => ({
                        role: msg.role,
                        content: msg.content,
                        tool_call_id: msg.tool_call_id,
                        timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
                        metadata: (msg as any).tool_calls ? { toolCalls: (msg as any).tool_calls } : undefined
                    }))

                    console.log(`🤖 [ChatAPI] Calling AI. Last message preview: ${formattedMessages[formattedMessages.length-1].content.substring(0, 500)}...`)
                    const finalContent = await runChatRound(formattedMessages)

                    if (chatId && finalContent) {
                        const assistantMessageId = await saveMessage(supabase, chatId, userId, {
                            role: 'assistant',
                            content: finalContent,
                            timestamp: new Date()
                        }, providerInfo.id)

                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, userMessageId, assistantMessageId })}\n\n`))
                        controller.enqueue(encoder.encode(`data: [DONE]\n\n`))

                        // Async tasks (memories, etc.)
                        const assistantContent = finalContent.replace(/\[SAVE_FACT:.+?\]/g, '').trim()
                        const assistantEmbedding = await generateEmbedding(assistantContent)
                        const adminSupabase = (await import('@/lib/supabase/server')).createAdminClient()

                        await adminSupabase.from('memories').insert({
                            user_id: userId,
                            persona_id: personaId,
                            role: 'assistant',
                            content: assistantContent,
                            importance: 3,
                            domain: 'personal',
                            embedding: assistantEmbedding
                        })

                        const lastUserMsg = messages[messages.length - 1]
                        if (lastUserMsg && lastUserMsg.role === 'user') {
                            const userEmbedding = await generateEmbedding(lastUserMsg.content)
                            await adminSupabase.from('memories').insert({
                                user_id: userId,
                                persona_id: personaId,
                                role: 'user',
                                content: lastUserMsg.content,
                                importance: 5,
                                domain: 'personal',
                                embedding: userEmbedding
                            })
                        }
                    }

                    // Carrot Follow-up
                    if (persona && CarrotEngine.shouldGenerateFollowUp(formattedMessages, persona)) {
                        await new Promise(resolve => setTimeout(resolve, 1500))
                        const followUpPrompt = CarrotEngine.generateFollowFollowUpPrompt(finalContent, formattedMessages, persona)
                        let followUpContent = ''
                        for await (const chunk of providerManager.sendMessage(
                            [...formattedMessages, { role: 'assistant', content: finalContent, timestamp: new Date() } as ChatMessageContent],
                            followUpPrompt,
                            { temperature: 0.8, maxTokens: 100, model: 'deepseek-chat' }
                        )) {
                            followUpContent += chunk.content || ''
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'followup', content: chunk.content || '', provider: providerInfo.id })}\n\n`))
                        }
                    }

                } catch (error) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' })}\n\n`))
                } finally {
                    controller.close()
                }
            }
        })

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            }
        })

    } catch (error) {
        return handleApiError(error)
    }
}

export async function GET(request: NextRequest) {
    try {
        const cookieStore = await cookies()
        const supabase = createClient(cookieStore)
        const { data: { session } } = await supabase.auth.getSession()
        let user: User | null = session?.user || null
        if (!user) {
            const { data: { user: verifiedUser } } = await supabase.auth.getUser()
            user = verifiedUser
        }
        if (!user) return new Response('Unauthorized', { status: 401 })

        const userTier = await getUserTier(user.id)
        const providerManager = createProviderManager(userTier)

        return new Response(
            JSON.stringify({
                tier: userTier,
                providers: providerManager.getAvailableProviders().map(p => ({ id: p.id, name: p.name })),
                defaultProvider: providerManager.getProviderInfo()
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
    } catch (error) {
        return handleApiError(error)
    }
}
