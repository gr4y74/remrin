import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ReplicateService } from "@/lib/studio/replicate";

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const generationId = params.id;

        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        // 1. Get user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Get generation record
        const { data: generation, error: genError } = await supabase
            .from('generations')
            .select('*')
            .eq('id', generationId)
            .eq('user_id', user.id)
            .single();

        if (genError || !generation) {
            return NextResponse.json({ error: "Generation not found" }, { status: 404 });
        }

        // 3. If already complete/failed, return immediately
        if (['completed', 'failed', 'cancelled'].includes(generation.status)) {
            return NextResponse.json(generation);
        }

        // 4. Otherwise, check Replicate status
        if (!generation.replicate_prediction_id) {
            return NextResponse.json(generation);
        }

        const statusUpdate = await ReplicateService.checkStatus(
            supabase,
            generationId,
            generation.replicate_prediction_id
        );

        return NextResponse.json({
            ...generation,
            ...statusUpdate
        });

    } catch (error: any) {
        console.error("Studio status check error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
