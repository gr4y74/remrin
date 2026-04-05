import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Fallback logic if for some reason the environment doesn't have supabase connected yet
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// We use service role key if available so backend can bypass RLS if strictly needed,
// though RLS currently permits anonymous reads/inserts.
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    if (!supabaseUrl) throw new Error("Supabase URL not configured.");

    // Fetch the 15 most recent posts
    const { data, error } = await supabase
      .from('game_traveler_feed')
      .select('author_name, message')
      .order('created_at', { ascending: false })
      .limit(15);

    if (error) throw error;

    // We map it to the expected UI interface
    const posts = (data || []).map(row => ({
      user: row.author_name,
      message: row.message
    }));

    return NextResponse.json({ posts });
  } catch (error: any) {
    console.error("Error fetching traveler feed:", error);
    return NextResponse.json({ posts: [] }, { status: 500 }); // return empty gracefully
  }
}

export async function POST(req: Request) {
  try {
    if (!supabaseUrl) throw new Error("Supabase URL not configured.");

    const body = await req.json();
    const { author_name, message, is_ai } = body;

    // Enforce basic validation
    if (!author_name || !message || message.length > 200) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { error } = await supabase
      .from('game_traveler_feed')
      .insert([
        {
          author_name: author_name.startsWith('@') ? author_name : `@${author_name}`,
          message,
          is_ai: !!is_ai
        }
      ]);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error posting to traveler feed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
