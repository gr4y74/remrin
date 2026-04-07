import { createAdminClient } from "@/lib/supabase/server";
import { 
    IChatRagCapability, 
    IRagSource, 
    RagResult, 
    ChatMessageContent, 
    CapabilityContext 
} from "../types";

/**
 * SudoDodo Knowledge Base RAG Source
 * Pulls from the indexed sudododo_knowledge_cache table.
 */
export class SudoDodoRagSource implements IRagSource {
    id = "sudododo-kb";
    name = "SudoDodo Knowledge Base";

    async search(query: string, limit: number = 5): Promise<RagResult[]> {
        const supabase = createAdminClient();
        
        // Simple text search for now. Vector search can be added later.
        const { data, error } = await supabase
            .from('sudododo_knowledge_cache')
            .select('*')
            .textSearch('content_snippet', query)
            .limit(limit);

        if (error || !data) {
            console.error("[RagSource] Search failed:", error);
            return [];
        }

        return data.map(item => ({
            sourceId: item.source_id,
            sourceName: item.source_id.charAt(0).toUpperCase() + item.source_id.slice(1).replace('-', ' '),
            title: item.title,
            url: item.url,
            snippet: item.content_snippet,
            relevance: 1.0 // Mock relevance
        }));
    }
}

/**
 * RAG Capability for SudoDodo
 */
export class RagCapability implements IChatRagCapability {
    id = "rag" as const;
    name = "Retrieval Augmented Generation";
    sources: IRagSource[] = [new SudoDodoRagSource()];

    async preProcess(messages: ChatMessageContent[], context: CapabilityContext): Promise<ChatMessageContent[]> {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.role !== 'user') return messages;

        const results = await this.retrieve(lastMessage.content);
        if (results.length === 0) return messages;

        // Augment the last user message with context
        const contextStr = results.map(r => 
            `[Source: ${r.sourceName}] (${r.url})\n${r.snippet}`
        ).join('\n\n---\n\n');

        const augmentedMessage: ChatMessageContent = {
            ...lastMessage,
            content: `I am looking for information about: ${lastMessage.content}\n\nRelevant Context from SudoDodo Knowledge Base:\n${contextStr}\n\nPlease use this context to answer accurately and cite the sources.`
        };

        return [...messages.slice(0, -1), augmentedMessage];
    }

    async retrieve(query: string): Promise<RagResult[]> {
        const allResults = await Promise.all(this.sources.map(s => s.search(query, 3)));
        return allResults.flat().sort((a, b) => b.relevance - a.relevance).slice(0, 5);
    }

    isAvailable(): boolean {
        return true;
    }
}
