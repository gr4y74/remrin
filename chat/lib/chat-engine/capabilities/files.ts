import { createAdminClient } from "@/lib/supabase/server";

/**
 * Extract text content from a Buffer (useful for direct uploads or already downloaded files).
 */
export async function extractTextFromBuffer(buffer: Buffer, fileName: string, mimeType: string): Promise<string> {
    try {
        // Process based on type
        if (mimeType.includes('pdf')) {
            const pdf = (await import("pdf-parse")).default;
            const pdfData = await pdf(buffer);
            return pdfData.text;
        } 
        
        if (mimeType.includes('wordprocessingml') || fileName.endsWith('.docx')) {
            const mammoth = (await import("mammoth")).default;
            const result = await mammoth.extractRawText({ buffer });
            return result.value;
        }

        // Default to text extraction for code, md, txt, etc.
        return buffer.toString('utf-8');
    } catch (err) {
        console.error(`[FileExtractor] Extraction failed for ${fileName}:`, err);
        return `[Error extracting text from ${fileName}]`;
    }
}

/**
 * Extract text content from a file stored in Supabase Storage.
 */
export async function extractTextFromFile(storagePath: string, fileName: string, mimeType: string): Promise<string> {
    try {
        const supabase = createAdminClient();
        
        const { data, error } = await supabase.storage
            .from('chat-attachments')
            .download(storagePath);

        if (error || !data) {
            console.error(`[FileExtractor] Download failed for ${storagePath}:`, error);
            return `[Error downloading file ${fileName}]`;
        }

        const buffer = Buffer.from(await data.arrayBuffer());
        return extractTextFromBuffer(buffer, fileName, mimeType);
    } catch (err) {
        console.error(`[FileExtractor] Storage fetch failed for ${fileName}:`, err);
        return `[Error fetching file ${fileName}]`;
    }
}

/**
 * Process all attachments and return a formatted context string.
 */
export async function processFileAttachments(files: Array<{ name: string, type: string, storagePath?: string, content?: string }>): Promise<string> {
    if (!files || files.length === 0) return "";

    const extractionPromises = files.map(async (file) => {
        let content = "";
        if (file.storagePath) {
            content = await extractTextFromFile(file.storagePath, file.name, file.type);
        } else if (file.content) {
            content = file.content;
        }
        return `<file name="${file.name}">\n${content}\n</file>`;
    });

    const results = await Promise.all(extractionPromises);
    return results.join('\n\n');
}
