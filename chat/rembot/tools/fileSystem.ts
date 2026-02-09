import * as fs from 'fs';
import * as path from 'path';

// CommonJS export
export const fileTools = {
    listFiles: {
        name: 'listFiles',
        description: 'List files in a directory. Args: path (string)',
        execute: async (dirPath: string = '.') => {
            try {
                const files = fs.readdirSync(dirPath);
                return JSON.stringify(files.slice(0, 50));
            } catch (e: any) {
                return `Error: ${e.message}`;
            }
        }
    },
    readFile: {
        name: 'readFile',
        description: 'Read contents of a text file. Args: path (string)',
        execute: async (filePath: string) => {
            try {
                const content = fs.readFileSync(filePath, 'utf-8');
                return content.slice(0, 2000);
            } catch (e: any) {
                return `Error: ${e.message}`;
            }
        }
    }
};
