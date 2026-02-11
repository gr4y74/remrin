import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import OpenAI from "openai";
import { getActiveModelConfig, getApiKeyForProvider } from "@/lib/models/model-config";

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    const personaId = params.id;
    const { message } = await request.json();
    const supabase = createClient(cookies());

    // 1. Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch the persona
    const { data: persona, error: personaError } = await supabase
        .from('personas')
        .select('*')
        .eq('id', personaId)
        .single();

    if (personaError || !persona) {
        return NextResponse.json({ error: 'Persona not found' }, { status: 404 });
    }

    // 3. Load conversation history for context
    const { data: history } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(from_user_id.eq.${user.id},to_user_id.eq.${personaId}),and(from_user_id.eq.${personaId},to_user_id.eq.${user.id})`)
        .order('created_at', { ascending: false })
        .limit(10);

    const formattedHistory = (history || []).reverse().map(msg => ({
        role: (msg.from_user_id === personaId ? 'assistant' : 'user') as "assistant" | "user",
        content: msg.message
    }));

    // 4. Get LLM Config
    const modelConfig = await getActiveModelConfig();
    const apiKey = getApiKeyForProvider(modelConfig.provider);
    const openai = new OpenAI({
        baseURL: modelConfig.baseURL,
        apiKey: apiKey
    });

    // 5. Generate Response
    try {
        // STRICT CREDIT SAFETY: Force deepseek-chat for standard persona conversations
        let MODEL = modelConfig.modelId;
        if (modelConfig.provider === 'deepseek' && MODEL !== 'deepseek-chat') {
            console.log(`🛡️ [Persona Chat] Overriding ${MODEL} to deepseek-chat for credit safety`);
            MODEL = 'deepseek-chat';
        }

        const response = await openai.chat.completions.create({
            model: MODEL,
            messages: [
                { role: 'system', content: persona.system_prompt },
                ...formattedHistory,
                { role: 'user', content: message }
            ],
            temperature: 0.7,
        });

        const botMessage = response.choices[0].message.content || "I'm sorry, I couldn't process that.";

        // 6. Save bot message to DB
        const { data: savedMsg, error: saveError } = await supabase.from('direct_messages').insert({
            from_user_id: personaId,
            to_user_id: user.id,
            from_username: persona.name,
            to_username: user.user_metadata?.username || 'User',
            message: botMessage
        }).select().single();

        if (saveError) {
            console.error('Error saving bot message:', saveError);
        }

        return NextResponse.json(savedMsg);
    } catch (error: any) {
        console.error('AI Error:', error);
        return NextResponse.json({ error: 'Failed to generate AI response' }, { status: 500 });
    }
}
