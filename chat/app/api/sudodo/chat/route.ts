import { NextResponse } from "next/server";
import { RagCapability } from "@/lib/chat-engine/capabilities/rag";

export async function POST(request: Request) {
  try {
    const { messages, context } = await request.json();
    
    // Initialize RAG
    const rag = new RagCapability();
    
    // Augment the messages using our new Unified Knowledge Base
    const augmentedMessages = await rag.preProcess(messages, {
        userTier: 'free', // Default for now
        searchEnabled: true,
        files: []
    });

    // In a real implementation, we would now call the actual IChatProvider (Claude/Gemini)
    // For this build, we simulate the "Dodo Specialist" response with citing capability
    const lastAugmented = augmentedMessages[augmentedMessages.length - 1].content;
    
    // Simple logic to simulate Dodo's reasoning
    const responseContent = `I've analyzed your request regarding: "${messages[messages.length - 1].content}". 

Looking at the SudoDodo matrix, your hardware is a great fit for ${context?.distroName || 'Linux'}. 

[Expert Advice]: If you're setting up a ThinkPad, don't forget to check the synaptics firmware settings in the kernel parameters.`;

    const sources = await rag.retrieve(messages[messages.length - 1].content);

    return NextResponse.json({ 
        content: responseContent,
        sources: sources.map(s => ({ name: s.sourceName, url: s.url }))
    });

  } catch (error) {
    console.error("[DodoAPI] Error:", error);
    return NextResponse.json({ error: "Dodo is currently over capacity" }, { status: 500 });
  }
}
