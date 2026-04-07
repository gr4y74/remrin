import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    
    if (!postId) return NextResponse.json({ error: "Post ID required" }, { status: 400 });

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('sudododo_comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ data });

  } catch (error) {
    console.error("[CommentsAPI] Error:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();
    const { post_id, content, author_name, parent_id } = body;

    const { data, error } = await supabase
      .from('sudododo_comments')
      .insert({
        post_id,
        content,
        author_name: author_name || 'Anonymous Penguin',
        parent_id
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, comment: data });

  } catch (error) {
    console.error("[CommentsAPI] Error creation:", error);
    return NextResponse.json({ error: "Failed to post comment" }, { status: 500 });
  }
}
