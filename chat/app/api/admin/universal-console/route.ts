import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";

const ALLOWED_FILES: Record<string, string> = {
    v1: "public/mother/console/universal_console_v1.ts",
    v2: "public/mother/console/universal_console_v2.ts",
};

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const fileKey = searchParams.get("file") || "v2";

        if (!ALLOWED_FILES[fileKey]) {
            return NextResponse.json(
                { error: "Invalid file selection" },
                { status: 400 }
            );
        }

        const filePath = join(process.cwd(), ALLOWED_FILES[fileKey]);

        if (!existsSync(filePath)) {
            return NextResponse.json(
                { error: "File not found" },
                { status: 404 }
            );
        }

        const content = await readFile(filePath, "utf-8");

        return NextResponse.json({ content });
    } catch (error) {
        console.error("Error reading console file:", error);
        return NextResponse.json(
            { error: "Failed to read file" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { file, content } = body;

        if (!file || !ALLOWED_FILES[file]) {
            return NextResponse.json(
                { error: "Invalid file selection" },
                { status: 400 }
            );
        }

        if (typeof content !== "string") {
            return NextResponse.json(
                { error: "Invalid content format" },
                { status: 400 }
            );
        }

        const filePath = join(process.cwd(), ALLOWED_FILES[file]);

        // Write file directly
        await writeFile(filePath, content, "utf-8");

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error writing console file:", error);
        return NextResponse.json(
            { error: "Failed to save file" },
            { status: 500 }
        );
    }
}
