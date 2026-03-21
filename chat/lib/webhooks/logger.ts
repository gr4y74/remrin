import { createAdminClient } from "@/lib/supabase/server"

export type WebhookStatus = 'success' | 'failed' | 'retrying'

/**
 * Logs a webhook event and its processing status.
 */
export async function logWebhookEvent(
    provider: 'stripe' | 'clerk',
    eventType: string,
    payload: any,
    status: WebhookStatus,
    error?: string,
    retryCount: number = 0
) {
    const supabase = createAdminClient()

    console.log(`[Webhook] Logging ${provider} event: ${eventType} (Status: ${status})`)

    const { error: dbError } = await supabase
        .from("webhook_logs")
        .insert({
            provider,
            event_type: eventType,
            payload,
            status,
            error,
            retry_count: retryCount
        })

    if (dbError) {
        console.error("[Webhook] Failed to log webhook event:", dbError)
    }
}
