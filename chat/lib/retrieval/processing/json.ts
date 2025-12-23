import { FileItemChunk } from "@/types"
import { encode } from "gpt-tokenizer"
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters"
import { CHUNK_OVERLAP, CHUNK_SIZE } from "."

// Custom JSON processing - extracts text content from JSON structure
const extractTextFromJson = (obj: unknown, depth = 0): string => {
  if (depth > 10) return "" // Prevent infinite recursion

  if (typeof obj === "string") {
    return obj
  }

  if (typeof obj === "number" || typeof obj === "boolean") {
    return String(obj)
  }

  if (Array.isArray(obj)) {
    return obj.map(item => extractTextFromJson(item, depth + 1)).join(" ")
  }

  if (typeof obj === "object" && obj !== null) {
    return Object.entries(obj)
      .map(([key, value]) => `${key}: ${extractTextFromJson(value, depth + 1)}`)
      .join(" ")
  }

  return ""
}

export const processJSON = async (json: Blob): Promise<FileItemChunk[]> => {
  const fileBuffer = Buffer.from(await json.arrayBuffer())
  const textDecoder = new TextDecoder("utf-8")
  const textContent = textDecoder.decode(fileBuffer)

  let parsedJson: unknown
  try {
    parsedJson = JSON.parse(textContent)
  } catch {
    // If JSON parsing fails, treat it as plain text
    parsedJson = textContent
  }

  const completeText = extractTextFromJson(parsedJson)

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP
  })
  const splitDocs = await splitter.createDocuments([completeText])

  let chunks: FileItemChunk[] = []

  for (let i = 0; i < splitDocs.length; i++) {
    const doc = splitDocs[i]

    chunks.push({
      content: doc.pageContent,
      tokens: encode(doc.pageContent).length
    })
  }

  return chunks
}
