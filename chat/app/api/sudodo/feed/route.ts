import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const communityId = searchParams.get('communityId');
    const sortBy = searchParams.get('sortBy') || 'latest';
    
    const supabase = createAdminClient();

    let query = supabase
      .from('sudododo_posts')
      .select(`
        *,
        community:sudododo_communities(name, icon, slug)
      `);

    if (communityId) {
      query = query.eq('community_id', communityId);
    }

    if (sortBy === 'hot') {
      query = query.order('upvotes', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query.limit(20);

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error("[FeedAPI] Error:", error);
    return NextResponse.json({ error: "Failed to fetch feed" }, { status: 500 });
  }
}
