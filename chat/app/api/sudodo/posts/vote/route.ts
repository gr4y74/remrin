import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();
    const { post_id, vote_type, user_id } = body;

    if (!post_id || !user_id || ![-1, 1].includes(vote_type)) {
      return NextResponse.json({ error: "Invalid vote data" }, { status: 400 });
    }

    // 1. Check for existing vote
    const { data: existingVote } = await supabase
      .from('sudododo_user_votes')
      .select('vote_type')
      .eq('post_id', post_id)
      .eq('user_id', user_id)
      .single();

    let voteChange = vote_type;
    
    if (existingVote) {
      if (existingVote.vote_type === vote_type) {
        // Remove vote (toggle off)
        await supabase.from('sudododo_user_votes').delete().eq('post_id', post_id).eq('user_id', user_id);
        voteChange = -vote_type;
      } else {
        // Change vote type (e.g. from Up to Down)
        await supabase.from('sudododo_user_votes').update({ vote_type }).eq('post_id', post_id).eq('user_id', user_id);
        voteChange = vote_type * 2; // e.g. -1 to 1 = +2
      }
    } else {
      // New vote
      await supabase.from('sudododo_user_votes').insert({ user_id, post_id, vote_type });
    }

    // 2. Update the main post's upvote count
    const { data: post } = await supabase
      .from('sudododo_posts')
      .select('upvotes')
      .eq('id', post_id)
      .single();

    const newTotal = (post?.upvotes || 0) + voteChange;

    await supabase
      .from('sudododo_posts')
      .update({ upvotes: newTotal })
      .eq('id', post_id);

    return NextResponse.json({ success: true, newTotal });

  } catch (error) {
    console.error("[VoteAPI] Error:", error);
    return NextResponse.json({ error: "Failed to register vote" }, { status: 500 });
  }
}
