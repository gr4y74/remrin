import { SupabaseClient } from '@supabase/supabase-js'
import { ChatMessageContent } from './types'

const CHAT_NAME_PREFIX = 'persona-chat-'

/**
 * Get or create a persistent chat session for a user + persona
 */
export async function getOrCreateChatSession(
    supabase: SupabaseClient,
    userId: string,
    personaId: string,
    options: {
        workspaceId?: string;
        customName?: string;
    } = {}
): Promise<string> {
    const chatName = options.customName || `${CHAT_NAME_PREFIX}${personaId}`

    // 1. Try to find existing chat
    const { data: existingChat } = await supabase
        .from('chats')
        .select('id')
        .eq('user_id', userId)
        .eq('name', chatName)
        .maybeSingle()

    if (existingChat) {
        console.log(`📂 [Persistence] Found existing chat: ${chatName} -> ${existingChat.id}`)
        return existingChat.id
    }

    // 2. If not found, need a workspace
    let finalWorkspaceId = options.workspaceId

    if (!finalWorkspaceId) {
        // Get default workspace (assuming first one found for user)
        const { data: workspace } = await supabase
            .from('workspaces')
            .select('id')
            .eq('user_id', userId)
            .limit(1)
            .maybeSingle()

        finalWorkspaceId = workspace?.id
    }

    if (!finalWorkspaceId) {
        console.warn('[Persistence] User has no workspace, cannot create persistent chat.')
        throw new Error('No workspace found for user')
    }

    // 3. Create chat
    const { data: newChat, error } = await supabase
        .from('chats')
        .insert({
            user_id: userId,
            workspace_id: finalWorkspaceId,
            name: chatName,
            title: options.customName || 'New Chat', // New field
            model: 'gpt-4o', // Default
            context_length: 4096,
            embeddings_provider: 'openai',
            include_profile_context: true,
            include_workspace_instructions: true,
            prompt: 'You are a helpful assistant.',
            sharing: 'private',
            temperature: 0.7
        })
        .select('id')
        .single()

    if (error) {
        console.warn('[Persistence] First chat creation failed, retrying without metadata columns...', error.message)
        // Fallback: try without the new columns
        const { data: fallbackChat, error: fallbackError } = await supabase
            .from('chats')
            .insert({
                user_id: userId,
                workspace_id: finalWorkspaceId,
                name: chatName,
                model: 'gpt-4o',
                context_length: 4096,
                embeddings_provider: 'openai',
                include_profile_context: true,
                include_workspace_instructions: true,
                prompt: 'You are a helpful assistant.',
                sharing: 'private',
                temperature: 0.7
            })
            .select('id')
            .single()

        if (fallbackError) {
            console.error('[Persistence] Fatal: Chat creation failed on fallback:', fallbackError)
            throw fallbackError
        }
        return fallbackChat.id
    }

    console.log(`✨ [Persistence] Created new chat: ${chatName} -> ${newChat.id}`)
    return newChat.id
}

/**
 * Save a message to the database
 */
export async function saveMessage(
    supabase: SupabaseClient,
    chatId: string,
    userId: string,
    message: ChatMessageContent,
    model: string = 'gpt-4o'
): Promise<string | null> {
    // Get next sequence number
    const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('chat_id', chatId)

    const sequenceNumber = (count || 0) + 1

    const { data, error } = await supabase
        .from('messages')
        .insert({
            chat_id: chatId,
            user_id: userId,
            content: message.content,
            role: message.role,
            model: model,
            sequence_number: sequenceNumber,
            image_paths: [], // TODO: Handle images if present in metadata
            // assistant_id: null // optional
        })
        .select('id')
        .single()

    if (error) {
        console.error('[Persistence] Failed to save message:', error)
        return null
    }

    return data?.id || null
}

/**
 * Retrieve chat history for a persona - LOOKUP ONLY, never creates a new chat.
 * Used by the history API route to safely fetch messages for an existing thread.
 */
export async function getChatHistoryByName(
    supabase: SupabaseClient,
    userId: string,
    personaId: string,
    customName: string,
    limit: number = 50
): Promise<ChatMessageContent[]> {
    try {
        // Only look up the chat by name, never create
        const { data: existingChat, error: chatError } = await supabase
            .from('chats')
            .select('id')
            .eq('user_id', userId)
            .eq('name', customName)
            .maybeSingle()

        if (chatError) {
            console.error('[Persistence] Error looking up chat by name:', chatError)
            return []
        }

        if (!existingChat) {
            console.log(`[Persistence] No chat found with name: ${customName} for user: ${userId}`)
            return []
        }

        console.log(`[Persistence] Found chat ${existingChat.id} for name: ${customName}`)

        const { data: messages, error } = await supabase
            .from('messages')
            .select('*')
            .eq('chat_id', existingChat.id)
            .order('created_at', { ascending: true })

        if (error) throw error
        if (!messages) return []

        const recentMessages = messages.slice(-limit)

        return recentMessages.map(msg => ({
            id: msg.id,
            role: msg.role as 'user' | 'assistant' | 'system',
            content: msg.content,
            timestamp: new Date(msg.created_at),
        }))
    } catch (error) {
        console.error('[Persistence] Failed to fetch history by name:', error)
        return []
    }
}

/**
 * Retrieve chat history for a persona
 */
export async function getChatHistory(
    supabase: SupabaseClient,
    userId: string,
    personaId: string,
    limit: number = 50,
    options: { workspaceId?: string; customName?: string } = {}
): Promise<ChatMessageContent[]> {
    try {
        const chatId = await getOrCreateChatSession(supabase, userId, personaId, options)

        const { data: messages, error } = await supabase
            .from('messages')
            .select('*')
            .eq('chat_id', chatId)
            .order('created_at', { ascending: true }) // Get oldest first for reconstruction
        // .limit(limit) // If we want to implement paging later

        if (error) throw error
        if (!messages) return []

        // If we have a limit, take the LAST N messages
        const recentMessages = messages.slice(-limit)

        return recentMessages.map(msg => ({
            id: msg.id,
            role: msg.role as 'user' | 'assistant' | 'system',
            content: msg.content,
            timestamp: new Date(msg.created_at),
            // Reconstruct minimal metadata if needed, though we don't store full tool calls yet
            // in standard structure without extra columns.
            // For now, simple text restoration is a huge win.
        }))
    } catch (error) {
        console.error('[Persistence] Failed to fetch history:', error)
        return []
    }
}

/**
 * Update chat metadata (title, starring)
 */
export async function updateChatMetadata(
    supabase: SupabaseClient,
    chatId: string,
    metadata: { title?: string; is_starred?: boolean }
): Promise<void> {
    const { error } = await supabase
        .from('chats')
        .update(metadata)
        .eq('id', chatId)

    if (error) {
        console.error('[Persistence] Failed to update chat metadata:', error)
        throw error
    }
}
/**
 * Update message metadata (feedback, tool calls, etc)
 */
export async function updateMessageMetadata(
    supabase: SupabaseClient,
    messageId: string,
    metadata: any
): Promise<void> {
    const { error } = await supabase
        .from('messages')
        .update({ metadata })
        .eq('id', messageId)

    if (error) {
        console.error('[Persistence] Failed to update message metadata:', error)
        throw error
    }
}
