import { BaseFileHandler } from './base';
import { FileType, ProcessedFile } from './types';
// @ts-ignore
import pdf from 'pdf-parse/lib/pdf-parse.js';

export class PdfFileHandler extends BaseFileHandler {
    type = FileType.PDF;

    async process(file: File): Promise<ProcessedFile> {
        try {
            const buffer = await this.readFileAsBuffer(file);
            const data = await pdf(buffer);
            return this.createProcessedFile(file, data.text);
        } catch (error) {
            console.error('PDF parsing error:', error);
            return this.createProcessedFile(
                file,
                '',
                `PDF parsing failed: ${(error as Error).message}`
            );
        }
    }
}
