-- Add price and rarity columns for Premium Showcase feature
-- Run this migration to enable premium character management

-- Add price column for marketplace pricing
ALTER TABLE personas 
ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2) DEFAULT NULL;

-- Add rarity column for card rarity system
-- Values: 'common', 'rare', 'epic', 'legendary'
ALTER TABLE personas 
ADD COLUMN IF NOT EXISTS rarity VARCHAR(20) DEFAULT 'common';

-- Add an index for faster premium queries
CREATE INDEX IF NOT EXISTS idx_personas_price ON personas(price) WHERE price IS NOT NULL AND price > 0;
CREATE INDEX IF NOT EXISTS idx_personas_rarity ON personas(rarity);

-- Comment for documentation
COMMENT ON COLUMN personas.price IS 'Price in Aether currency for marketplace purchases';
COMMENT ON COLUMN personas.rarity IS 'Card rarity: common, rare, epic, legendary';
