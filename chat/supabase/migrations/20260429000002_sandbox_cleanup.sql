-- Function to cleanup expired sandbox tenants
-- This can be called by a cron job or scheduled function
CREATE OR REPLACE FUNCTION cleanup_expired_sandboxes()
RETURNS void AS $$
DECLARE
    tenant_record RECORD;
BEGIN
    -- Find tenants with expired sandbox keys
    FOR tenant_record IN 
        SELECT DISTINCT t.id, t.slug 
        FROM tenants t
        JOIN tenant_api_keys k ON t.id = k.tenant_id
        WHERE t.plan = 'sandbox'
        AND k.expires_at < NOW()
    LOOP
        -- Delete the tenant (will cascade delete api_keys, personas, memories, etc.)
        DELETE FROM tenants WHERE id = tenant_record.id;
        RAISE NOTICE 'Deleted expired sandbox tenant: %', tenant_record.slug;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
