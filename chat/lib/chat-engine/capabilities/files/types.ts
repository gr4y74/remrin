export enum FileType {
    PDF = 'pdf',
    IMAGE = 'image',
    DOC = 'doc',
    TEXT = 'text',
    CODE = 'code'
}

export interface ProcessedFile {
    id: string;
    name: string;
    type: FileType;
    size: number;
    extractedText: string;
    error?: string;
}

export interface FileHandler {
    process(file: File): Promise<ProcessedFile>;
}
