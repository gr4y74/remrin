import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

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

        const { data: models, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ models });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
