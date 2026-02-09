import { SupabaseClient } from '@supabase/supabase-js'
import { ChatMessageContent } from './types'

const CHAT_NAME_PREFIX = 'persona-chat-'

/**
 * Get or create a persistent chat session for a user + persona
 */
export async function getOrCreateChatSession(
    supabase: SupabaseClient,
    userId: string,
    personaId: string
): Promise<string> {
    const chatName = `${CHAT_NAME_PREFIX}${personaId}`

    // 1. Try to find existing chat
    const { data: existingChat } = await supabase
        .from('chats')
        .select('id')
        .eq('user_id', userId)
        .eq('name', chatName)
        .maybeSingle()

    if (existingChat) return existingChat.id

    // 2. If not found, need a workspace
    // Get default workspace (assuming first one found for user)
    const { data: workspace } = await supabase
        .from('workspaces')
        .select('id')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle()

    if (!workspace) {
        // Fallback: This might fail if user has absolutely no workspace,
        // but typically users have a default one.
        console.warn('[Persistence] User has no workspace, cannot create persistent chat.')
        throw new Error('No workspace found for user')
    }

    // 3. Create chat
    const { data: newChat, error } = await supabase
        .from('chats')
        .insert({
            user_id: userId,
            workspace_id: workspace.id,
            name: chatName,
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
        console.error('[Persistence] Failed to create chat session:', error)
        throw error
    }

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
): Promise<void> {
    // Get next sequence number
    const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('chat_id', chatId)

    const sequenceNumber = (count || 0) + 1

    const { error } = await supabase
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

    if (error) {
        console.error('[Persistence] Failed to save message:', error)
        // Don't throw, just log. We don't want to break the chat flow if persistence fails.
    }
}

/**
 * Retrieve chat history for a persona
 */
export async function getChatHistory(
    supabase: SupabaseClient,
    userId: string,
    personaId: string,
    limit: number = 50
): Promise<ChatMessageContent[]> {
    try {
        const chatId = await getOrCreateChatSession(supabase, userId, personaId)

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
