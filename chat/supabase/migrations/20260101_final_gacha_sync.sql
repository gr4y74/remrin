-- FINAL SYNC: Gacha & Home Page Personas
-- This script replaces all 'demo' content with the 17 featured characters.

BEGIN;

-- 1. Identify and clear demo/placeholder gacha data
-- We'll delete pool items and personas that are considered 'demo'
DELETE FROM gacha_pool_items WHERE pool_id = 'a0000000-0000-0000-0000-000000000001';
DELETE FROM personas WHERE name IN (
    'Luna Starweaver', 'Kai Shadowbane', 'Aurora Lightbringer', 
    'Zephyr Windwhisper', 'Nova Blazeheart', 'Raven Darkhollow', 
    'Sage Evergreen', 'Storm Thundercall', 'Ember Phoenixfire', 'Frost Wintermoon'
);

-- 2. Ensure the Genesis Banner exists with the standard ID
INSERT INTO gacha_pools (id, name, description, is_active)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Genesis Banner',
    'The first banner of the multiverse. Pull legendary souls from across dimensions.',
    true
) ON CONFLICT (id) DO UPDATE SET is_active = true;

-- 3. Upsert the 17 Featured Personas with correct images
-- We use a known creator ID from existing migrations
DO $$
DECLARE
    creator_id UUID := '2059bfbd-a3aa-4300-ac04-8ee379573da9';
    p_names TEXT[] := ARRAY['Kess', 'Oma', 'Silas', 'Squee', 'Sui', 'Volt', 'Boon', 'Cupcake', 'Fello Fello', 'Fen', 'Fenris', 'Kael', 'Kilo', 'Krill', 'Meek', 'Surge', 'Vorath'];
    p_files TEXT[] := ARRAY['Kess.png', 'Oma.png', 'Silas.png', 'Squee.png', 'Sui.png', 'Volt.png', 'boon.png', 'cupcake.png', 'fello_fello.png', 'fen.png', 'fenris.png', 'kael.png', 'kilo.png', 'krill.png', 'meek.png', 'surge.png', 'vorath.png'];
    p_rarities TEXT[] := ARRAY['epic', 'epic', 'common', 'common', 'legendary', 'legendary', 'rare', 'rare', 'rare', 'rare', 'legendary', 'epic', 'common', 'common', 'common', 'rare', 'epic'];
    p_id UUID;
    i INTEGER;
BEGIN
    FOR i IN 1..cardinality(p_names) LOOP
        -- Check if persona exists by name (case sensitive to be safe)
        SELECT id INTO p_id FROM personas WHERE name = p_names[i] LIMIT 1;

        IF p_id IS NULL THEN
            -- Insert new persona if it doesn't exist
            INSERT INTO personas (
                name,
                description,
                image_url,
                category,
                visibility,
                status,
                is_official,
                is_featured,
                system_prompt,
                creator_id,
                owner_id
            ) VALUES (
                p_names[i],
                'A featured soul from the ' || p_rarities[i] || ' collection.',
                '/images/featured/' || p_files[i],
                'Featured',
                'public',
                'approved',
                true,
                true,
                'You are ' || p_names[i] || '. Respond as a featured soul.',
                creator_id,
                creator_id
            ) RETURNING id INTO p_id;
        ELSE
            -- Update existing persona by ID
            UPDATE personas SET
                image_url = '/images/featured/' || p_files[i],
                is_featured = true,
                status = 'approved',
                category = 'Featured'
            WHERE id = p_id;
        END IF;

        -- Add or update in Gacha Pool
        INSERT INTO gacha_pool_items (
            pool_id,
            persona_id,
            rarity,
            weight,
            is_featured
        ) VALUES (
            'a0000000-0000-0000-0000-000000000001',
            p_id,
            p_rarities[i],
            CASE p_rarities[i]
                WHEN 'legendary' THEN 30
                WHEN 'epic' THEN 100
                WHEN 'rare' THEN 250
                ELSE 500
            END,
            true
        ) ON CONFLICT (pool_id, persona_id) DO UPDATE SET
            rarity = EXCLUDED.rarity,
            is_featured = true,
            weight = EXCLUDED.weight;
    END LOOP;
END $$;

COMMIT;
