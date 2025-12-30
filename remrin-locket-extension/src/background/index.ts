/**
 * Background Service Worker
 * Handles authentication, soul fetching, and RAG queries
 */

import { getSupabase, getSession, isAuthenticated } from '../lib/supabase'
import { getState, setState, setSouls, getActiveSoul, clearState } from '../lib/storage'
import type { Soul, ExtensionMessage, ExtensionResponse } from '../types'

console.log('🔮 Remrin Locket: Background worker initialized')

/**
 * Fetch user's souls from Supabase
 */
async function fetchSouls(): Promise<Soul[]> {
    const session = await getSession()
    if (!session) return []

    const supabase = getSupabase()
    const { data, error } = await supabase
        .from('personas')
        .select('id, name, image_path, persona_prompt, persona_config, created_at')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('[Locket] Error fetching souls:', error)
        return []
    }

    // Transform to Soul format
    return (data || []).map(p => ({
        id: p.id,
        name: p.name,
        avatar_url: p.image_path,
        system_prompt: p.persona_prompt || '',
        locket_data: null, // TODO: Fetch from lockets table
        config: p.persona_config || {},
        created_at: p.created_at
    }))
}

/**
 * Perform RAG search for context
 */
async function fetchRAGContext(query: string, personaId: string): Promise<string> {
    const session = await getSession()
    if (!session) return ''

    try {
        const supabase = getSupabase()

        // Call the search-memories edge function
        const { data, error } = await supabase.functions.invoke('search-memories', {
            body: {
                query,
                persona_id: personaId,
                user_id: session.user.id,
                limit: 5
            }
        })

        if (error) {
            console.error('[Locket] RAG search error:', error)
            return ''
        }

        if (!data?.success || !data?.results?.length) return ''

        // Format results with locket data if available
        const parts: string[] = []

        if (data.locket_data) {
            parts.push(`[Core Memories]:\n${data.locket_data}`)
        }

        const memories = data.results
            .map((r: { content: string }, i: number) => `[Memory ${i + 1}]: ${r.content}`)
            .join('\n')

        if (memories) {
            parts.push(`[Relevant Memories]:\n${memories}`)
        }

        return parts.join('\n\n')
    } catch (error) {
        console.error('[Locket] RAG search error:', error)
        return ''
    }
}

/**
 * Handle messages from content script and popup
 */
chrome.runtime.onMessage.addListener((
    message: ExtensionMessage,
    sender,
    sendResponse: (response: ExtensionResponse) => void
) => {
    const handleMessage = async () => {
        switch (message.type) {
            case 'GET_STATE': {
                const state = await getState()
                const authenticated = await isAuthenticated()
                return { success: true, data: { ...state, isAuthenticated: authenticated } }
            }

            case 'GET_SOULS': {
                const souls = await fetchSouls()
                await setSouls(souls)
                return { success: true, data: souls }
            }

            case 'SET_ACTIVE_SOUL': {
                const soulId = message.payload as string
                await setState({ activeSoulId: soulId })
                return { success: true }
            }

            case 'GET_RAG_CONTEXT': {
                const { query, personaId } = message.payload as { query: string; personaId: string }
                const context = await fetchRAGContext(query, personaId)
                return { success: true, data: context }
            }

            case 'LOGOUT': {
                await clearState()
                return { success: true }
            }

            default:
                return { success: false, error: 'Unknown message type' }
        }
    }

    handleMessage()
        .then(sendResponse)
        .catch(err => sendResponse({ success: false, error: err.message }))

    return true // Keep channel open for async response
})

/**
 * Listen for tab updates to manage session state
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url) {
        // URL changed - may need to reset injection state
        console.log(`[Locket] Tab ${tabId} navigated to:`, changeInfo.url)
    }
})

/**
 * Listen for tab close to clean up session state
 */
chrome.tabs.onRemoved.addListener(async (tabId) => {
    const state = await getState()
    if (state.sessionState[tabId.toString()]) {
        const newSessionState = { ...state.sessionState }
        delete newSessionState[tabId.toString()]
        await setState({ sessionState: newSessionState })
    }
})
