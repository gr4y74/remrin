import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    if (!query || query.length < 2) {
      return NextResponse.json({ data: [] });
    }

    const supabase = createAdminClient();

    // 1. Search Communities (Distros & DEs)
    const { data: communities, error: cError } = await supabase
      .from('sudododo_communities')
      .select('id, name, slug, icon, theme_color, members_count')
      .ilike('name', `%${query}%`)
      .order('members_count', { ascending: false })
      .limit(5);

    // 2. Search Wiki / Knowledge Cache
    const { data: wikis, error: wError } = await supabase
      .from('sudododo_knowledge_cache')
      .select('id, title, url, source_id, category')
      .ilike('title', `%${query}%`)
      .limit(5);

    if (cError || wError) throw cError || wError;

    // 3. Format into a unified response
    const results = [
        ...communities.map(c => ({
            id: c.id,
            type: 'community',
            title: c.name,
            subtitle: `${(c.members_count / 1000).toFixed(1)}k members`,
            icon: c.icon,
            url: `/en/sudodo/distro/${c.slug}`,
            color: c.theme_color
        })),
        ...wikis.map(w => ({
            id: w.id,
            type: 'wiki',
            title: w.title,
            subtitle: `Source: ${w.source_id}`,
            icon: '📚',
            url: w.url,
            color: '#a78bfa'
        }))
    ];

    return NextResponse.json({ data: results });

  } catch (error) {
    console.error("[SearchAPI] Error:", error);
    return NextResponse.json({ error: "Search unavailable" }, { status: 500 });
  }
}
