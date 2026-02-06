import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies()
        const supabase = createClient(cookieStore)

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check premium status (soul_weaver tier or higher)
        const { data: wallet } = await supabase
            .from('wallets')
            .select('tier')
            .eq('user_id', user.id)
            .single()

        const PREMIUM_TIERS = ['soul_weaver', 'architect', 'titan']
        const isPremium = wallet?.tier && PREMIUM_TIERS.includes(wallet.tier)

        if (!isPremium) {
            return NextResponse.json({
                error: 'Premium required',
                message: 'Only premium users (Soul Weaver tier or higher) can create moments'
            }, { status: 403 })
        }

        const formData = await request.formData()
        const file = formData.get('file') as File
        const mediaType = formData.get('mediaType') as 'image' | 'video'
        const personaId = formData.get('personaId') as string
        const caption = formData.get('caption') as string | null
        const thumbnail = formData.get('thumbnail') as File | null

        if (!file || !mediaType || !personaId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Verify user owns the persona
        const { data: persona, error: personaError } = await supabase
            .from('personas')
            .select('id, creator_id')
            .eq('id', personaId)
            .single()

        if (personaError || persona.creator_id !== user.id) {
            return NextResponse.json({ error: 'Unauthorized - not persona owner' }, { status: 403 })
        }

        // Upload main file
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}.${fileExt}`
        const bucketName = mediaType === 'video' ? 'moment-videos' : 'moment-images'

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            })

        if (uploadError) {
            return NextResponse.json({ error: 'Upload failed', details: uploadError }, { status: 500 })
        }

        const { data: { publicUrl } } = supabase.storage
            .from(bucketName)
            .getPublicUrl(fileName)

        // Upload thumbnail if video
        let thumbnailUrl = null
        if (mediaType === 'video' && thumbnail) {
            const thumbExt = thumbnail.name.split('.').pop()
            const thumbName = `${user.id}/${Date.now()}_thumb.${thumbExt}`

            const { error: thumbError } = await supabase.storage
                .from('moment-thumbnails')
                .upload(thumbName, thumbnail)

            if (!thumbError) {
                const { data: { publicUrl: thumbPublicUrl } } = supabase.storage
                    .from('moment-thumbnails')
                    .getPublicUrl(thumbName)
                thumbnailUrl = thumbPublicUrl
            }
        }

        // Create moment record
        const momentData: any = {
            persona_id: personaId,
            created_by_user_id: user.id,
            media_type: mediaType,
            caption: caption,
            reactions_summary: {}
        }

        if (mediaType === 'image') {
            momentData.image_url = publicUrl
        } else {
            momentData.video_url = publicUrl
            momentData.thumbnail_url = thumbnailUrl
            const duration = formData.get('duration')
            if (duration) momentData.duration_seconds = parseInt(duration as string)
        }

        const { data: moment, error: momentError } = await supabase
            .from('moments')
            .insert(momentData)
            .select()
            .single()

        if (momentError) {
            return NextResponse.json({ error: 'Failed to create moment', details: momentError }, { status: 500 })
        }

        return NextResponse.json({ success: true, moment }, { status: 201 })
    } catch (error) {
        console.error('Moment upload error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
