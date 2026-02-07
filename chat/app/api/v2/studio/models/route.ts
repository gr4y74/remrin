import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import staticModels from "@/lib/studio/models.json";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type'); // 'image', 'video', 'edit'

        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        let query = supabase
            .from('ai_models')
            .select('*')
            .eq('is_active', true)
            .order('aether_cost', { ascending: true });

        if (type) {
            query = query.eq('type', type);
        }

        const { data: dbModels, error } = await query;

        // Fallback to static models if DB query fails or returns nothing
        if (error || !dbModels || dbModels.length === 0) {
            console.warn(`Studio API: Falling back to static models${error ? ` due to error: ${error.message}` : ''}`);
            let filteredModels = staticModels;
            if (type) {
                filteredModels = staticModels.filter(m => m.type === type);
            }
            return NextResponse.json({ models: filteredModels });
        }

        return NextResponse.json({ models: dbModels });
    } catch (error: any) {
        // Even on catch, try to return static models
        console.error("Studio API Exception:", error);
        return NextResponse.json({ models: staticModels });
    }
}
