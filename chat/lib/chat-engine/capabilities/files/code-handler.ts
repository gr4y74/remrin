import { BaseFileHandler } from './base';
import { FileType, ProcessedFile } from './types';

export class CodeFileHandler extends BaseFileHandler {
    type = FileType.CODE;

    private getLanguage(filename: string): string {
        const ext = filename.split('.').pop()?.toLowerCase();
        const mapping: Record<string, string> = {
            js: 'javascript',
            ts: 'typescript',
            jsx: 'javascript',
            tsx: 'typescript',
            py: 'python',
            java: 'java',
            go: 'go',
            rs: 'rust',
            cpp: 'cpp',
            c: 'c',
            html: 'html',
            css: 'css'
        };
        return mapping[ext || ''] || 'text';
    }

    async process(file: File): Promise<ProcessedFile> {
        try {
            const text = await this.readFileAsText(file);
            const lang = this.getLanguage(file.name);
            return this.createProcessedFile(file, `\`\`\`${lang}\n${text}\n\`\`\``);
        } catch (error) {
            return this.createProcessedFile(file, '', (error as Error).message);
        }
    }
}
