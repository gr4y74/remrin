import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

import { cookies } from 'next/headers';

export async function POST(request: Request) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB
            return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data, error } = await supabase
            .storage
            .from('chat-files')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error('Upload error:', error);
            return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
        }

        // Get public URL
        const { data: { publicUrl } } = supabase
            .storage
            .from('chat-files')
            .getPublicUrl(fileName);

        return NextResponse.json({
            url: publicUrl,
            name: file.name,
            size: file.size,
            type: file.type.startsWith('image/') ? 'image' : 'file'
        });

    } catch (err) {
        console.error('Server error upload:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
