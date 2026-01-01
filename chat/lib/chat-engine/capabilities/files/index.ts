import { FileType, ProcessedFile } from './types';
import { TextFileHandler } from './text-handler';
import { CodeFileHandler } from './code-handler';
import { PdfFileHandler } from './pdf-handler';

export class FileManager {
    private handlers: Record<string, any> = {
        [FileType.TEXT]: new TextFileHandler(),
        [FileType.CODE]: new CodeFileHandler(),
        [FileType.PDF]: new PdfFileHandler()
    };

    detectFileType(filename: string): FileType {
        const ext = filename.split('.').pop()?.toLowerCase();

        // Text formats
        if (['txt', 'md', 'json', 'csv', 'xml'].includes(ext || '')) {
            return FileType.TEXT;
        }

        // Code formats
        if (
            ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'go', 'rs', 'cpp', 'c', 'html', 'css'].includes(
                ext || ''
            )
        ) {
            return FileType.CODE;
        }

        // PDF
        if (ext === 'pdf') {
            return FileType.PDF;
        }

        return FileType.TEXT;
    }

    async processFile(file: File): Promise<ProcessedFile> {
        const type = this.detectFileType(file.name);
        const handler = this.handlers[type];

        if (!handler) {
            return {
                id: Math.random().toString(36).substring(7),
                name: file.name,
                type: FileType.TEXT,
                size: file.size,
                extractedText: '',
                error: `No handler for file type: ${type}`
            };
        }

        return handler.process(file);
    }
}

export * from './types';
export * from './base';
export * from './text-handler';
export * from './code-handler';
export * from './pdf-handler';
