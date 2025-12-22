-- Market Listings table for the soul marketplace
-- Allows sellers to list their personas for sale

CREATE TABLE market_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id TEXT NOT NULL,
    persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
    price_aether INTEGER NOT NULL CHECK (price_aether > 0),
    is_limited_edition BOOLEAN DEFAULT false,
    quantity_remaining INTEGER,
    total_sales INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(persona_id)  -- One listing per persona
);

-- Indexes for efficient querying
CREATE INDEX idx_listings_active ON market_listings(is_active, created_at DESC);
CREATE INDEX idx_listings_seller ON market_listings(seller_id);
CREATE INDEX idx_listings_price ON market_listings(price_aether) WHERE is_active = true;
CREATE INDEX idx_listings_popular ON market_listings(total_sales DESC) WHERE is_active = true;

-- Enable Row Level Security
ALTER TABLE market_listings ENABLE ROW LEVEL SECURITY;

-- Anyone can view active listings
CREATE POLICY "Anyone can view active listings"
ON market_listings FOR SELECT USING (is_active = true);

-- Sellers can manage their own listings
CREATE POLICY "Sellers can manage own listings"
ON market_listings FOR ALL USING (seller_id = auth.uid()::text);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_market_listing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER market_listing_updated_at
    BEFORE UPDATE ON market_listings
    FOR EACH ROW
    EXECUTE FUNCTION update_market_listing_updated_at();
