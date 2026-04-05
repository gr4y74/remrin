import { NextResponse } from 'next/server';
import { buildAdversaryPrompt } from '@/lib/game/adversaryPrompt';

export async function POST(req: Request) {
  try {
    const { choice, gameState, history } = await req.json();

    const systemPrompt = buildAdversaryPrompt();

    const msg = choice
      ? `Player chose [${choice.id}] "${choice.label}": ${choice.description}\n\nCurrent game state: ${JSON.stringify({
          location: gameState.location, miles_to_nyc: gameState.miles_to_nyc, cash: gameState.cash,
          heat: gameState.heat, inventory: gameState.inventory, distraction_score: gameState.distraction_score,
          times_deceived: gameState.times_deceived, turn: gameState.turn,
          recent_choices: gameState.choices_history.slice(-5)
        })}`
      : `Game is starting now. Player is in Los Angeles with $1,200 cash and 2,800 miles to NYC. Open with the radio breaking the news of Mickey "The Mangler" Spaghetti's arrest and his cryptic billion-dollar broadcast. Establish the gritty noir tone immediately. First three choices should establish the core tension between "just drive east" and "what about the money?"`;

    const newHistory = [...(history || []), { role: "user", content: msg }];

    const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.warn("DEEPSEEK_API_KEY (or OPENAI_API_KEY fallback) not found in environment.");
      return NextResponse.json({ error: "Missing API Key" }, { status: 500 });
    }

    // Combine system prompt and user history correctly for OpenAI/DeepSeek format
    const messages = [
      { role: "system", content: systemPrompt },
      ...newHistory
    ];

    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat", // standard DeepSeek model
        messages: messages,
        temperature: 0.8,
        response_format: { type: "json_object" } // Tell the API to return standard JSON
      }),
    });

    const data = await res.json();
    
    if (data.error) {
      throw new Error(data.error.message || "DeepSeek API Error");
    }
    
    const raw = data.choices?.[0]?.message?.content || "";
    let parsed;
    try {
      parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) parsed = JSON.parse(m[0]);
      else throw new Error("JSON parse failed");
    }

    // append new response to history
    newHistory.push({ role: "assistant", content: raw });

    // Try to stealthily inject the AI ghost post into the global feed if it generated one
    if (parsed.ghost_post && parsed.ghost_post.user && parsed.ghost_post.message) {
      try {
        const { createClient } = require('@supabase/supabase-js');
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey);
          // Fire and forget directly to Supabase to prevent HTTP loopback starvation
          supabase.from('game_traveler_feed').insert([{
            author_name: parsed.ghost_post.user.startsWith('@') ? parsed.ghost_post.user : `@${parsed.ghost_post.user}`,
            message: parsed.ghost_post.message,
            is_ai: true
          }]).catch(() => {});
        }
      } catch (e) {
        console.error("Non-fatal: failed to post background ghost feed", e);
      }
    }

    return NextResponse.json({ 
      parsed, 
      history: newHistory 
    });
    
  } catch (error: any) {
    console.error("Error processing game turn:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process turn" }, 
      { status: 500 }
    );
  }
}
