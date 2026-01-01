import { NextResponse } from 'next/server';
import { FileManager } from '@/lib/chat-engine/capabilities/files';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: Request) {
    try {
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

        return NextResponse.json(processedFile);
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
