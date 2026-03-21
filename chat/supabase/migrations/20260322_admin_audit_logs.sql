-- Create admin_audit_logs table
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id uuid REFERENCES auth.users(id),
    target_user_id uuid REFERENCES auth.users(id),
    action_type text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
);

-- Add index for faster searching
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_type ON admin_audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin ON admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target ON admin_audit_logs(target_user_id);

-- Enable RLS
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
    ON admin_audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.is_admin = true
        )
    );
