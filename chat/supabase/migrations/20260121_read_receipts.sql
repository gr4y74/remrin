-- Add read receipt columns to direct_messages table
ALTER TABLE direct_messages
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- Create index for faster queries on read status
CREATE INDEX IF NOT EXISTS idx_direct_messages_read_status 
ON direct_messages(to_user_id, read_at) 
WHERE read_at IS NULL;

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(
    p_user_id UUID,
    p_partner_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE direct_messages
    SET read_at = NOW()
    WHERE to_user_id = p_user_id
      AND from_user_id = p_partner_id
      AND read_at IS NULL;
END;
$$;

-- Function to mark a single message as read
CREATE OR REPLACE FUNCTION mark_message_as_read(
    p_message_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE direct_messages
    SET read_at = NOW()
    WHERE id = p_message_id
      AND read_at IS NULL;
END;
$$;

-- Trigger to auto-set delivered_at when message is inserted
CREATE OR REPLACE FUNCTION set_delivered_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.delivered_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_delivered_at ON direct_messages;
CREATE TRIGGER trigger_set_delivered_at
    BEFORE INSERT ON direct_messages
    FOR EACH ROW
    EXECUTE FUNCTION set_delivered_at();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION mark_messages_as_read(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_message_as_read(UUID) TO authenticated;
