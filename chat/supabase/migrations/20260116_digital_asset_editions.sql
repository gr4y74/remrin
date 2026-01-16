-- ============================================================================
-- DIGITAL ASSET EDITIONS SYSTEM
-- Migration: 20260116_digital_asset_editions
-- Description: Limited edition digital assets with scarcity, licensing, and ownership tracking
-- Created: 2026-01-16
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE edition_type AS ENUM ('one_of_one', 'limited', 'open', 'timed');
CREATE TYPE license_type AS ENUM ('personal', 'commercial', 'full_rights', 'exclusive');
CREATE TYPE asset_type AS ENUM ('image', 'video', 'audio');
CREATE TYPE transfer_type AS ENUM ('sale', 'gift', 'rights_transfer');

-- ============================================================================
-- TABLE: digital_asset_editions
-- ============================================================================

CREATE TABLE digital_asset_editions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    persona_id TEXT, -- Optional reference to personas - no FK constraint
    asset_url TEXT NOT NULL,
    asset_type asset_type NOT NULL,
    edition_type edition_type NOT NULL,
    total_supply INTEGER, -- NULL for open editions
    minted_count INTEGER DEFAULT 0 NOT NULL,
    license_type license_type NOT NULL,
    
    -- Metadata
    title TEXT,
    description TEXT,
    rarity_traits JSONB DEFAULT '{}',
    creator_signature TEXT,
    certificate_template TEXT,
    
    -- Timing (for timed editions)
    available_from TIMESTAMPTZ,
    available_until TIMESTAMPTZ,
    
    -- Pricing
    price_usd DECIMAL(10, 2),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_supply CHECK (
        (edition_type = 'open' AND total_supply IS NULL) OR
        (edition_type != 'open' AND total_supply IS NOT NULL AND total_supply > 0)
    ),
    CONSTRAINT valid_minted_count CHECK (minted_count >= 0),
    CONSTRAINT supply_not_exceeded CHECK (
        total_supply IS NULL OR minted_count <= total_supply
    )
);

-- Indexes
CREATE INDEX idx_editions_persona ON digital_asset_editions(persona_id);
CREATE INDEX idx_editions_type ON digital_asset_editions(edition_type);
CREATE INDEX idx_editions_asset_type ON digital_asset_editions(asset_type);
CREATE INDEX idx_editions_available ON digital_asset_editions(available_from, available_until) 
    WHERE edition_type = 'timed';

-- ============================================================================
-- TABLE: digital_asset_ownership
-- ============================================================================

CREATE TABLE digital_asset_ownership (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    edition_id UUID REFERENCES digital_asset_editions(id) ON DELETE CASCADE NOT NULL,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Purchase info
    purchase_id UUID, -- Link to payment/transaction system
    serial_number INTEGER NOT NULL, -- e.g., #3 of 5
    purchase_price DECIMAL(10, 2),
    
    -- Rights
    rights_transferred BOOLEAN DEFAULT FALSE,
    transfer_certificate_url TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    purchased_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_serial_per_edition UNIQUE (edition_id, serial_number),
    CONSTRAINT valid_serial CHECK (serial_number > 0)
);

-- Indexes
CREATE INDEX idx_ownership_edition ON digital_asset_ownership(edition_id);
CREATE INDEX idx_ownership_owner ON digital_asset_ownership(owner_id);
CREATE INDEX idx_ownership_purchased ON digital_asset_ownership(purchased_at);

-- ============================================================================
-- TABLE: asset_transfer_history
-- ============================================================================

CREATE TABLE asset_transfer_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ownership_id UUID REFERENCES digital_asset_ownership(id) ON DELETE CASCADE NOT NULL,
    from_user_id UUID REFERENCES auth.users(id),
    to_user_id UUID REFERENCES auth.users(id) NOT NULL,
    
    transfer_type transfer_type NOT NULL,
    price DECIMAL(10, 2),
    
    -- Verification
    signature TEXT,
    certificate_url TEXT,
    
    metadata JSONB DEFAULT '{}',
    transferred_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT different_users CHECK (from_user_id IS NULL OR from_user_id != to_user_id)
);

-- Indexes
CREATE INDEX idx_transfers_ownership ON asset_transfer_history(ownership_id);
CREATE INDEX idx_transfers_from_user ON asset_transfer_history(from_user_id);
CREATE INDEX idx_transfers_to_user ON asset_transfer_history(to_user_id);
CREATE INDEX idx_transfers_date ON asset_transfer_history(transferred_at);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE digital_asset_editions ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_asset_ownership ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_transfer_history ENABLE ROW LEVEL SECURITY;

-- Editions: Public can view, authenticated users can create/manage
DROP POLICY IF EXISTS "Public can view editions" ON digital_asset_editions;
CREATE POLICY "Public can view editions"
    ON digital_asset_editions FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert editions" ON digital_asset_editions;
CREATE POLICY "Authenticated users can insert editions"
    ON digital_asset_editions FOR INSERT
    TO authenticated
    WITH CHECK (true); -- Application will handle persona ownership

DROP POLICY IF EXISTS "Users can update their editions" ON digital_asset_editions;
CREATE POLICY "Users can update their editions"
    ON digital_asset_editions FOR UPDATE
    TO authenticated
    USING (true); -- Application will handle ownership

DROP POLICY IF EXISTS "Users can delete their editions" ON digital_asset_editions;
CREATE POLICY "Users can delete their editions"
    ON digital_asset_editions FOR DELETE
    TO authenticated
    USING (true); -- Application will handle ownership

-- Ownership: Owners can view their assets, public can view counts
DROP POLICY IF EXISTS "Users can view their ownership" ON digital_asset_ownership;
CREATE POLICY "Users can view their ownership"
    ON digital_asset_ownership FOR SELECT
    TO authenticated
    USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Public can view ownership counts" ON digital_asset_ownership;
CREATE POLICY "Public can view ownership counts"
    ON digital_asset_ownership FOR SELECT
    USING (true); -- Allows aggregate queries for supply tracking

DROP POLICY IF EXISTS "System can create ownership" ON digital_asset_ownership;
CREATE POLICY "System can create ownership"
    ON digital_asset_ownership FOR INSERT
    TO authenticated
    WITH CHECK (true); -- Controlled by application logic

-- Transfer History: Owners can view their transfers
DROP POLICY IF EXISTS "Users can view their transfers" ON asset_transfer_history;
CREATE POLICY "Users can view their transfers"
    ON asset_transfer_history FOR SELECT
    TO authenticated
    USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

DROP POLICY IF EXISTS "System can create transfers" ON asset_transfer_history;
CREATE POLICY "System can create transfers"
    ON asset_transfer_history FOR INSERT
    TO authenticated
    WITH CHECK (true); -- Controlled by application logic

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if edition is available for minting
CREATE OR REPLACE FUNCTION is_edition_available(edition_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    edition RECORD;
BEGIN
    SELECT * INTO edition FROM digital_asset_editions WHERE id = edition_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check supply
    IF edition.total_supply IS NOT NULL AND edition.minted_count >= edition.total_supply THEN
        RETURN FALSE;
    END IF;
    
    -- Check timing for timed editions
    IF edition.edition_type = 'timed' THEN
        IF edition.available_from IS NOT NULL AND NOW() < edition.available_from THEN
            RETURN FALSE;
        END IF;
        IF edition.available_until IS NOT NULL AND NOW() > edition.available_until THEN
            RETURN FALSE;
        END IF;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mint a new edition (creates ownership record)
CREATE OR REPLACE FUNCTION mint_edition(
    p_edition_id UUID,
    p_owner_id UUID,
    p_purchase_id UUID DEFAULT NULL,
    p_purchase_price DECIMAL DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_serial_number INTEGER;
    v_ownership_id UUID;
BEGIN
    -- Check if edition is available
    IF NOT is_edition_available(p_edition_id) THEN
        RAISE EXCEPTION 'Edition is not available for minting';
    END IF;
    
    -- Get next serial number
    SELECT COALESCE(MAX(serial_number), 0) + 1 INTO v_serial_number
    FROM digital_asset_ownership
    WHERE edition_id = p_edition_id;
    
    -- Create ownership record
    INSERT INTO digital_asset_ownership (
        edition_id,
        owner_id,
        purchase_id,
        serial_number,
        purchase_price
    ) VALUES (
        p_edition_id,
        p_owner_id,
        p_purchase_id,
        v_serial_number,
        p_purchase_price
    ) RETURNING id INTO v_ownership_id;
    
    -- Increment minted count
    UPDATE digital_asset_editions
    SET minted_count = minted_count + 1,
        updated_at = NOW()
    WHERE id = p_edition_id;
    
    -- Create initial transfer record (from creator to buyer)
    INSERT INTO asset_transfer_history (
        ownership_id,
        from_user_id,
        to_user_id,
        transfer_type,
        price
    ) VALUES (
        v_ownership_id,
        NULL, -- NULL indicates initial mint
        p_owner_id,
        'sale',
        p_purchase_price
    );
    
    RETURN v_ownership_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to transfer ownership
CREATE OR REPLACE FUNCTION transfer_ownership(
    p_ownership_id UUID,
    p_from_user_id UUID,
    p_to_user_id UUID,
    p_transfer_type transfer_type,
    p_price DECIMAL DEFAULT NULL,
    p_signature TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_transfer_id UUID;
BEGIN
    -- Verify current owner
    IF NOT EXISTS (
        SELECT 1 FROM digital_asset_ownership
        WHERE id = p_ownership_id AND owner_id = p_from_user_id
    ) THEN
        RAISE EXCEPTION 'User is not the current owner';
    END IF;
    
    -- Update ownership
    UPDATE digital_asset_ownership
    SET owner_id = p_to_user_id
    WHERE id = p_ownership_id;
    
    -- Create transfer record
    INSERT INTO asset_transfer_history (
        ownership_id,
        from_user_id,
        to_user_id,
        transfer_type,
        price,
        signature
    ) VALUES (
        p_ownership_id,
        p_from_user_id,
        p_to_user_id,
        p_transfer_type,
        p_price,
        p_signature
    ) RETURNING id INTO v_transfer_id;
    
    RETURN v_transfer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get edition stats
CREATE OR REPLACE FUNCTION get_edition_stats(p_edition_id UUID)
RETURNS TABLE (
    total_supply INTEGER,
    minted_count INTEGER,
    available_count INTEGER,
    is_sold_out BOOLEAN,
    is_available BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.total_supply,
        e.minted_count,
        CASE 
            WHEN e.total_supply IS NULL THEN NULL
            ELSE e.total_supply - e.minted_count
        END as available_count,
        CASE 
            WHEN e.total_supply IS NOT NULL AND e.minted_count >= e.total_supply THEN TRUE
            ELSE FALSE
        END as is_sold_out,
        is_edition_available(p_edition_id) as is_available
    FROM digital_asset_editions e
    WHERE e.id = p_edition_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_editions_updated_at
    BEFORE UPDATE ON digital_asset_editions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE digital_asset_editions IS 'Limited edition digital assets with scarcity enforcement';
COMMENT ON TABLE digital_asset_ownership IS 'Tracks ownership of minted editions';
COMMENT ON TABLE asset_transfer_history IS 'Complete provenance chain for all transfers';

COMMENT ON FUNCTION is_edition_available IS 'Checks if an edition can be minted (supply and timing)';
COMMENT ON FUNCTION mint_edition IS 'Mints a new edition instance and creates ownership record';
COMMENT ON FUNCTION transfer_ownership IS 'Transfers ownership between users with provenance tracking';
COMMENT ON FUNCTION get_edition_stats IS 'Returns current stats for an edition (supply, availability)';
