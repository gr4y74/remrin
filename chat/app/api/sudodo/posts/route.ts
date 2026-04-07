import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();
    const { community_slug, title, content, media_url, flair } = body;

    // 1. Get User Session (In production, replace with actual auth check)
    // For this build phase, we allow passing 'author_name' or fallback to anonymous
    const author_name = body.author_name || 'Anonymous Penguin';

    // 2. Resolve Community ID from Slug
    const { data: community, error: cError } = await supabase
      .from('sudododo_communities')
      .select('id')
      .eq('slug', community_slug)
      .single();

    if (cError || !community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    // 3. Create Post
    const { data: post, error: pError } = await supabase
      .from('sudododo_posts')
      .insert({
        community_id: community.id,
        author_name,
        title,
        content,
        media_url,
        flair: flair || 'discussion',
        upvotes: 1 // Self-upvote on creation
      })
      .select()
      .single();

    if (pError) throw pError;

    return NextResponse.json({ success: true, post });

  } catch (error) {
    console.error("[PostAPI] Error creating post:", error);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
