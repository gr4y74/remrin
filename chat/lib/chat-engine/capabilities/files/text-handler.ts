import { BaseFileHandler } from './base';
import { FileType, ProcessedFile } from './types';

export class TextFileHandler extends BaseFileHandler {
    type = FileType.TEXT;

    async process(file: File): Promise<ProcessedFile> {
        try {
            const text = await this.readFileAsText(file);
            return this.createProcessedFile(file, text);
        } catch (error) {
            return this.createProcessedFile(file, '', (error as Error).message);
        }
    }
}
