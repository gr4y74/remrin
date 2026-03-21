import { createAdminClient } from "@/lib/supabase/server"

/**
 * Records an administrative action in the audit logs.
 * Use this for sensitive operations like credit adjustments, user bans, or config changes.
 */
export async function logAdminAction(
    adminId: string,
    action: string,
    targetId?: string,
    metadata: Record<string, any> = {}
) {
    const supabase = createAdminClient()

    console.log(`[Audit] Recording action: ${action} by ${adminId} on ${targetId || 'N/A'}`)

    const { error } = await supabase
        .from("audit_logs")
        .insert({
            admin_id: adminId,
            action,
            target_id: targetId,
            metadata
        })

    if (error) {
        console.error("[Audit] Failed to record audit log:", error)
    }
}
