import "server-only"

// Dynamic import to prevent static bundling with Edge Runtime
// @xenova/transformers uses __dirname which is not available in Edge
export async function generateLocalEmbedding(content: string) {
  const { pipeline } = await import("@xenova/transformers")

  const generateEmbedding = await pipeline(
    "feature-extraction",
    "Xenova/all-MiniLM-L6-v2"
  )

  const output = await generateEmbedding(content, {
    pooling: "mean",
    normalize: true
  })

  const embedding = Array.from(output.data)

  return embedding
}
