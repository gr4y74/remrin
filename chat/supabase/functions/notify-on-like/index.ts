import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    try {
        const { user_id, content_id, content_author_id } = await req.json()

        if (user_id !== content_author_id) {
            await supabase.from('system_notifications').insert({
                user_id: content_author_id,
                title: 'New Like',
                message: 'Someone liked your content',
                type: 'info',
                action_url: `/content/${content_id}`
            })
        }

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
