import { FileHandler, FileType, ProcessedFile } from './types';
import { v4 as uuidv4 } from 'uuid';

export abstract class BaseFileHandler implements FileHandler {
    abstract type: FileType;

    protected async createProcessedFile(
        file: File,
        extractedText: string,
        error?: string
    ): Promise<ProcessedFile> {
        return {
            id: uuidv4(),
            name: file.name,
            type: this.type,
            size: file.size,
            extractedText,
            error
        };
    }

    abstract process(file: File): Promise<ProcessedFile>;

    protected async readFileAsText(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    protected async readFileAsBuffer(file: File): Promise<Buffer> {
        const arrayBuffer = await file.arrayBuffer();
        return Buffer.from(arrayBuffer);
    }
}
