import { APIError } from "./errors"

interface FetchOptions extends RequestInit {
    retries?: number
    retryDelay?: number
}

const DEFAULT_RETRIES = 3
const DEFAULT_DELAY = 1000

export async function fetchWithRetry(url: string, options: FetchOptions = {}): Promise<Response> {
    const { retries = DEFAULT_RETRIES, retryDelay = DEFAULT_DELAY, ...fetchOptions } = options

    let attempt = 0

    while (attempt <= retries) {
        try {
            const response = await fetch(url, fetchOptions)

            // If successful or client error (4xx) that shouldn't be retried immediately (unless rate limit)
            if (response.ok) {
                return response
            }

            // 429 Too Many Requests -> always retry
            if (response.status === 429) {
                throw new Error("Rate limit exceeded")
            }

            // 5xx Server Errors -> retry
            if (response.status >= 500 && response.status < 600) {
                throw new Error(`Server error: ${response.status}`)
            }

            // Other 4xx errors -> don't retry, return immediately
            if (response.status >= 400 && response.status < 500) {
                return response
            }

            return response

        } catch (error) {
            attempt++

            if (attempt > retries) {
                throw new APIError(
                    `Request failed after ${retries} retries: ${(error as Error).message}`,
                    500,
                    'NETWORK_ERROR'
                )
            }

            // Exponential backoff
            const delay = retryDelay * Math.pow(2, attempt - 1)
            await new Promise(resolve => setTimeout(resolve, delay))
        }
    }

    throw new Error("Unreachable")
}
