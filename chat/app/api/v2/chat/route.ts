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

        let user: any = session?.user

        // Fallback to get user from Authorization header if session/cookies failed
        if (!user) {
            const authHeader = request.headers.get('Authorization')
            debugLog(`🔑 [ChatEngine] Auth Header found: ${!!authHeader} (starts with Bearer: ${authHeader?.startsWith('Bearer ')})`)

            if (authHeader?.startsWith('Bearer ')) {
                const token = authHeader.split(' ')[1]
                debugLog(`🛡️ [ChatEngine] Token Length: ${token?.length}, prefix: ${token?.substring(0, 10)}...`)

                const { data: { user: verifiedUser }, error: verifyError } = await supabase.auth.getUser(token)
                if (verifyError) {
                    debugLog(`❌ [ChatEngine] Token Verify Error: ${verifyError.message}`)
                } else {
                    user = verifiedUser
                    debugLog(`✅ [ChatEngine] Token Authorized: user=${user?.id}`)
                }
            }
        }

        // Final Fallback to getUser from cookies
        if (!user) {
            debugLog(`⚠️ [ChatEngine] No session/token, trying getUser from cookies...`)
            const { data: { user: verifiedUser }, error: userError } = await supabase.auth.getUser()
            if (userError) debugLog(`❌ [ChatEngine] User Error: ${userError.message}`)
            user = verifiedUser
        }

        if (!user) {
            debugLog(`🚫 [ChatEngine] Unauthorized: No user found after session, token & cookie checks.`)
            return new Response('Unauthorized', { status: 401 })
        }

        debugLog(`✅ [ChatEngine] Authorized: user=${user.id}`)

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
            files,
            customName,
            workspaceId,
            llm_model,
            llm_provider
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
                    // --- HELPERS FOR TOOL EXECUTION ---
                    const executeTool = async (toolName: string, params: any, personaId: string, userId: string) => {
                        console.log(`🛠️ [ChatEngine] Executing Tool: ${toolName}`, params);

                        try {
                            const adminSupabase = (await import('@/lib/supabase/server')).createAdminClient();

                            switch (toolName) {
                                case 'search_memories': {
                                    const { query, limit = 5 } = params;
                                    debugLog(`🧠 [ChatEngine] Memory Search Tool: "${query}"`);
                                    const embedding = await generateEmbedding(query);

                                    // 1. Semantic Search
                                    let memories: any[] = [];
                                    if (embedding) {
                                        const { data: matched } = await adminSupabase.rpc('match_memories_v2', {
                                            query_embedding: embedding,
                                            match_threshold: 0.35,
                                            match_count: limit,
                                            filter_persona: personaId,
                                            filter_user: userId
                                        });
                                        if (matched) memories = matched;
                                    }

                                    // 2. Keyword Fallback (simplified)
                                    if (memories.length < limit) {
                                        const { data: keyword } = await adminSupabase
                                            .from('memories')
                                            .select('*')
                                            .eq('user_id', userId)
                                            .eq('persona_id', personaId)
                                            .ilike('content', `%${query}%`)
                                            .limit(limit - memories.length);
                                        if (keyword) memories = [...memories, ...keyword];
                                    }

                                    // 3. Locket Search
                                    const { data: lockets } = await adminSupabase
                                        .from('persona_lockets')
                                        .select('*')
                                        .eq('persona_id', personaId)
                                        .ilike('content', `%${query}%`);

                                    const resultDescription = [...(lockets?.map(l => ({ ...l, type: 'locket' })) || []), ...memories];
                                    if (resultDescription.length === 0) return "No relevant memories or locket truths found for this query.";
                                    return JSON.stringify(resultDescription);
                                }

                                case 'update_locket': {
                                    const { content, action = 'add' } = params;
                                    if (action === 'add') {
                                        await adminSupabase.from('persona_lockets').insert({ persona_id: personaId, content });
                                        return "Truth locked.";
                                    } else {
                                        await adminSupabase.from('persona_lockets').delete().eq('persona_id', personaId).ilike('content', content);
                                        return "Truth removed.";
                                    }
                                }

                                case 'web_search': {
                                    const { query, max_results = 5 } = params;
                                    debugLog(`🔍 [ChatEngine] Web Search Tool: "${query}"`);
                                    const response = await searchManager.search(query, max_results);
                                    debugLog(`✅ [ChatEngine] Web Search Got ${response.results?.length || 0} results from ${response.provider}`);
                                    if (!response.results || response.results.length === 0) {
                                        return `No web search results found for "${query}". The user might be asking about something too recent or niche.`;
                                    }
                                    return JSON.stringify(response.results);
                                }

                                default:
                                    return `Tool ${toolName} execution failed: Not implemented on server.`;
                            }
                        } catch (e: any) {
                            console.error(`❌ [ChatEngine] Tool Execution Failed (${toolName}):`, e.message);
                            return `Error: ${e.message}`;
                        }
                    };

                    // --- RECURSIVE CHAT HANDLER ---
                    const runChatRound = async (currentMessages: ChatMessageContent[], depth = 0): Promise<string> => {
                        if (depth > 3) return ""; // Safety limit

                        let roundContent = "";
                        let roundToolCalls: any[] = [];

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
                            if (chunk.content) roundContent += chunk.content;
                            if (chunk.toolCalls) {
                                // Consolidate tool call chunks
                                chunk.toolCalls.forEach((tc: any) => {
                                    const index = tc.index ?? 0;
                                    if (!roundToolCalls[index]) roundToolCalls[index] = { id: tc.id, function: { name: '', arguments: '' } };
                                    if (tc.id) roundToolCalls[index].id = tc.id;
                                    if (tc.function?.name) roundToolCalls[index].function.name += tc.function.name;
                                    if (tc.function?.arguments) roundToolCalls[index].function.arguments += tc.function.arguments;
                                });
                            }

                            // Stream to client
                            const data = JSON.stringify({
                                content: chunk.content,
                                reasoning: chunk.reasoning,
                                toolCalls: chunk.toolCalls,
                                provider: providerInfo.id,
                                depth
                            });
                            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                        }

                        // Handle Tool Calls
                        const activeToolCalls = roundToolCalls.filter(tc => tc && tc.function?.name);
                        if (activeToolCalls.length > 0) {
                            console.log(`🛠️ [ChatEngine] Round ${depth} generated ${activeToolCalls.length} tool calls.`);

                            const nextMessages = [...currentMessages];
                            nextMessages.push({
                                role: 'assistant',
                                content: roundContent,
                                metadata: { toolCalls: activeToolCalls }
                            } as any);

                            // Execute all tools in parallel
                            const results = await Promise.all(activeToolCalls.map(async (tc) => {
                                let args = {};
                                try { args = JSON.parse(tc.function.arguments); } catch (e) { }
                                const result = await executeTool(tc.function.name, args, personaId!, user.id);
                                return {
                                    role: 'tool',
                                    tool_call_id: tc.id,
                                    content: result
                                };
                            }));

                            // Append results and continue
                            nextMessages.push(...results as any);
                            return roundContent + await runChatRound(nextMessages, depth + 1);
                        }

                        return roundContent;
                    };

                    // --- PERSISTENCE: Get/Create Chat Session & Save User Message ---
                    let chatId: string | null = null;
                    if (personaId) {
                        try {
                            const supabaseService = createClient(cookieStore);
                            chatId = await getOrCreateChatSession(supabaseService, user.id, personaId, { customName, workspaceId });
                            const lastUserMsg = messages[messages.length - 1];
                            if (lastUserMsg.role === 'user') {
                                await saveMessage(supabaseService, chatId, user.id, lastUserMsg);
                            }
                        } catch (e) {
                            console.error('❌ [Persistence] Failed to init session or save user msg:', e);
                        }
                    }

                    // Start the recursive loop
                    const formattedMessages: ChatMessageContent[] = messages.map(msg => ({
                        role: msg.role,
                        content: msg.content,
                        tool_call_id: msg.tool_call_id,
                        timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
                        metadata: (msg as any).tool_calls ? { toolCalls: (msg as any).tool_calls } : undefined
                    }));

                    const finalContent = await runChatRound(formattedMessages);

                    // Send done signal
                    controller.enqueue(encoder.encode(`data: [DONE]\n\n`));

                    // --- PERSISTENCE: Save Final Assistant Response ---
                    if (chatId && finalContent) {
                        const supabaseService = createClient(cookieStore);
                        await saveMessage(supabaseService, chatId, user.id, {
                            role: 'assistant',
                            content: finalContent,
                            timestamp: new Date()
                        }, providerInfo.id);
                        console.log(`💾 [Persistence] Saved final recursive response`);

                        // --- UNIVERSAL CONSOLE: Fact Saving & Memory Sync ---
                        try {
                            const adminSupabase = (await import('@/lib/supabase/server')).createAdminClient();
                            const assistantContent = finalContent.replace(/\[SAVE_FACT:.+?\]/g, '').trim();
                            const assistantEmbedding = await generateEmbedding(assistantContent);

                            await adminSupabase.from('memories').insert({
                                user_id: user.id,
                                persona_id: personaId,
                                role: 'assistant',
                                content: assistantContent,
                                importance: 3,
                                domain: 'personal',
                                embedding: assistantEmbedding
                            });

                            const lastUserMsg = messages[messages.length - 1];
                            if (lastUserMsg && lastUserMsg.role === 'user') {
                                const userEmbedding = await generateEmbedding(lastUserMsg.content);
                                await adminSupabase.from('memories').insert({
                                    user_id: user.id,
                                    persona_id: personaId,
                                    role: 'user',
                                    content: lastUserMsg.content,
                                    importance: 5,
                                    domain: 'personal',
                                    embedding: userEmbedding
                                });
                            }
                        } catch (e: any) {
                            console.error('❌ [Universal Console] Failed to sync memories:', e);
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
                            { role: 'assistant', content: finalContent, timestamp: new Date() } as ChatMessageContent
                        ]

                        const followUpPrompt = CarrotEngine.generateFollowFollowUpPrompt(
                            finalContent,
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

        // Use getSession first
        const { data: { session } } = await supabase.auth.getSession()
        let user: any = session?.user

        // Fallback to getUser
        if (!user) {
            const { data: { user: verifiedUser } } = await supabase.auth.getUser()
            user = verifiedUser
        }

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
