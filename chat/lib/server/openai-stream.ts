import OpenAI from "openai"

/**
 * Converts an OpenAI streaming response to a ReadableStream of text deltas.
 * This is a replacement for the deprecated `OpenAIStream` from the `ai` package.
 *
 * @param response - The OpenAI streaming response
 * @returns A ReadableStream that emits text content
 */
export function createOpenAIStreamResponse(
    response: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>
): ReadableStream<Uint8Array> {
    const encoder = new TextEncoder()

    return new ReadableStream({
        async start(controller) {
            try {
                for await (const chunk of response) {
                    const content = chunk.choices[0]?.delta?.content
                    if (content) {
                        controller.enqueue(encoder.encode(content))
                    }
                }
                controller.close()
            } catch (error) {
                controller.error(error)
            }
        }
    })
}

/**
 * Creates a streaming Response from an OpenAI streaming response.
 * This is a replacement for `new StreamingTextResponse(OpenAIStream(response))`.
 *
 * @param response - The OpenAI streaming response
 * @returns A Response with the streaming content
 */
export function streamOpenAIResponse(
    response: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>
): Response {
    return new Response(createOpenAIStreamResponse(response), {
        headers: {
            "Content-Type": "text/plain; charset=utf-8"
        }
    })
}
