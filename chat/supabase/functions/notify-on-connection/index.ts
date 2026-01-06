import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    try {
        const { user_id, connected_to_id } = await req.json()

        // Create system notification
        await supabase.from('system_notifications').insert({
            user_id: connected_to_id,
            title: 'New Connection Request',
            message: 'Someone wants to connect with you',
            type: 'info',
            action_url: `/profile/${user_id}`
        })

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
        })
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        })
    }
})
