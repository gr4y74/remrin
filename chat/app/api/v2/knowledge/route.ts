import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { FileManager } from '@/lib/chat-engine/capabilities/files';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Handle Knowledge Vault API
 */

// POST: Upload file
export async function POST(req: Request) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: 'File size exceeds 10MB limit' },
                { status: 400 }
            );
        }

        const fileManager = new FileManager();
        const processedFile = await fileManager.processFile(file);

        if (processedFile.error) {
            return NextResponse.json(
                { error: processedFile.error },
                { status: 500 }
            );
        }

        // Store in Supabase
        const { error } = await supabase
            .from('user_knowledge')
            .insert({
                user_id: user.id,
                file_name: file.name,
                file_type: processedFile.type,
                content: processedFile.extractedText,
                shared_with_all: formData.get('shared_with_all') === 'true',
                persona_ids: formData.get('persona_ids')
                    ? JSON.parse(formData.get('persona_ids') as string)
                    : [],
            });

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json({ error: 'Failed to store knowledge' }, { status: 500 });
        }

        return NextResponse.json({ success: true, item: { name: file.name, type: processedFile.type } });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// GET: List user's knowledge items
export async function GET(req: Request) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await supabase
            .from('user_knowledge')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json({ error: 'Failed to fetch knowledge' }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Fetch error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE: Remove knowledge item by ID
export async function DELETE(req: Request) {
    try {
        const url = new URL(req.url);
        const id = url.searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { error } = await supabase
            .from('user_knowledge')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id); // Ensure user owns the item

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json({ error: 'Failed to delete knowledge' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PATCH: Update knowledge item sharing settings
export async function PATCH(req: Request) {
    try {
        const body = await req.json();
        const { id, shared_with_all, persona_ids } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Build update object
        const updateData: any = {};
        if (typeof shared_with_all === 'boolean') updateData.shared_with_all = shared_with_all;
        if (Array.isArray(persona_ids)) updateData.persona_ids = persona_ids;

        const { error } = await supabase
            .from('user_knowledge')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json({ error: 'Failed to update knowledge' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Update error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
