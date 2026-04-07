import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    
    const supabase = createAdminClient();

    let query = supabase
      .from('sudododo_communities')
      .select('*');

    // Filter by type (This is a simplified logic, in real DB we might use a dedicated 'type' column)
    // For now, we distinguish DEs by looking at the slug (e.g., 'gnome', 'kde')
    if (type === 'de') {
      query = query.in('slug', ['gnome', 'kde', 'hyprland', 'sway', 'xfce']);
    } else if (type === 'distro') {
      query = query.not('slug', 'in', '("gnome","kde","hyprland","sway","xfce")');
    }

    const { data, error } = await query
        .order('members_count', { ascending: false })
        .limit(10);

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error("[CommunitiesAPI] Error:", error);
    return NextResponse.json({ error: "Failed to fetch communities" }, { status: 500 });
  }
}
