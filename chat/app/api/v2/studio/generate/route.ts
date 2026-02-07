import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ReplicateService } from "@/lib/studio/replicate";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { model_id, prompt, parameters } = body;

        if (!model_id || !prompt) {
            return NextResponse.json({ error: "Missing model_id or prompt" }, { status: 400 });
        }

        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        // 1. Get user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Get model data
        const { data: model, error: modelError } = await supabase
            .from('ai_models')
            .select('*')
            .eq('id', model_id)
            .single();

        if (modelError || !model) {
            return NextResponse.json({ error: "Model not found" }, { status: 404 });
        }

        // 3. Start generation
        const result = await ReplicateService.startGeneration(
            supabase,
            user.id,
            model,
            prompt,
            parameters || {}
        );

        return NextResponse.json(result);

    } catch (error: any) {
        console.error("Studio generate error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
