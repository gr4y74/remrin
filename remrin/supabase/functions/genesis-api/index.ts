// GENESIS API - ECHO TEST MODE
// This bypasses DeepSeek to prove the server is alive.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { message } = await req.json();
    console.log("📨 Echo received:", message);

    // DUMMY RESPONSE - NO AI
    const replyText = "SYSTEM CHECK: I am online. The Brain is receiving your signal. DeepSeek is currently bypassed.";

    return new Response(JSON.stringify({ 
        reply: replyText, 
        blueprint: {}, // Empty blueprint
        vision_prompt: null 
    }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});