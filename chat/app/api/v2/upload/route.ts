import { NextResponse } from 'next/server';
import { extractTextFromBuffer } from '@/lib/chat-engine/capabilities/files';

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

        const buffer = Buffer.from(await file.arrayBuffer());
        const extractedText = await extractTextFromBuffer(buffer, file.name, file.type);

        if (extractedText.startsWith('[Error')) {
            return NextResponse.json(
                { error: 'Failed to extract text from file' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            id: Math.random().toString(36).substring(7),
            name: file.name,
            type: file.type,
            size: file.size,
            extractedText
        });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
