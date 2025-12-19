import "server-only"

// @xenova/transformers was removed to fix Vercel Edge Runtime __dirname error
// Local embeddings are temporarily disabled
export async function generateLocalEmbedding(content: string): Promise<number[]> {
  throw new Error("Local embeddings are disabled. Please use OpenAI embeddings instead.")
}
