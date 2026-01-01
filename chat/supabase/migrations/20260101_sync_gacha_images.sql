-- Sync Persona Images and Populate Genesis Banner
-- This script ensures personas have the correct images and are featured in the gacha pool.

BEGIN;

-- 1. Correct Image URLs for personas (Matching /public/images/featured/ case sensitivity)
UPDATE personas SET image_url = '/images/featured/Volt.png' WHERE name = 'Volt';
UPDATE personas SET image_url = '/images/featured/Sui.png' WHERE name = 'Sui';
UPDATE personas SET image_url = '/images/featured/Kess.png' WHERE name = 'Kess';
UPDATE personas SET image_url = '/images/featured/Oma.png' WHERE name = 'Oma';
UPDATE personas SET image_url = '/images/featured/Silas.png' WHERE name = 'Silas';
UPDATE personas SET image_url = '/images/featured/Squee.png' WHERE name = 'Squee';
UPDATE personas SET image_url = '/images/featured/boon.png' WHERE name = 'Boon';
UPDATE personas SET image_url = '/images/featured/cupcake.png' WHERE name = 'Cupcake';
UPDATE personas SET image_url = '/images/featured/fello_fello.png' WHERE name = 'Fello Fello';
UPDATE personas SET image_url = '/images/featured/fen.png' WHERE name = 'Fen';
UPDATE personas SET image_url = '/images/featured/fenris.png' WHERE name = 'Fenris';
UPDATE personas SET image_url = '/images/featured/kael.png' WHERE name = 'Kael';
UPDATE personas SET image_url = '/images/featured/kilo.png' WHERE name = 'Kilo';
UPDATE personas SET image_url = '/images/featured/krill.png' WHERE name = 'Krill';
UPDATE personas SET image_url = '/images/featured/meek.png' WHERE name = 'Meek';
UPDATE personas SET image_url = '/images/featured/surge.png' WHERE name = 'Surge';
UPDATE personas SET image_url = '/images/featured/vorath.png' WHERE name = 'Vorath';

-- 2. Ensure Genesis Banner pool exists
INSERT INTO gacha_pools (id, name, description, is_active, cost_single, cost_ten)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Genesis Banner',
    'The first banner of the multiverse. Pull legendary souls from across dimensions.',
    true,
    10,
    100
) ON CONFLICT (id) DO NOTHING;

-- 3. Clear existing items for this pool and repopulate
DELETE FROM gacha_pool_items WHERE pool_id = '00000000-0000-0000-0000-000000000001';

-- 4. Insert items with rarity and featured status
WITH p_list AS (
    SELECT id, name FROM personas 
    WHERE name IN (
        'Volt', 'Sui', 'Kess', 'Oma', 'Silas', 'Squee', 'Boon', 'Cupcake', 
        'Fello Fello', 'Fen', 'Fenris', 'Kael', 'Kilo', 'Krill', 'Meek', 'Surge', 'Vorath'
    )
)
INSERT INTO gacha_pool_items (pool_id, persona_id, rarity, weight, is_featured)
SELECT 
    '00000000-0000-0000-0000-000000000001',
    id,
    CASE 
        WHEN name IN ('Volt', 'Sui', 'Fenris') THEN 'legendary'
        WHEN name IN ('Kess', 'Oma', 'Kael', 'Vorath') THEN 'epic'
        WHEN name IN ('Silas', 'Squee', 'Surge', 'Krill') THEN 'rare'
        ELSE 'common'
    END,
    CASE 
        WHEN name IN ('Volt', 'Sui', 'Fenris') THEN 30
        WHEN name IN ('Kess', 'Oma', 'Kael', 'Vorath') THEN 100
        WHEN name IN ('Silas', 'Squee', 'Surge', 'Krill') THEN 200
        ELSE 500
    END,
    true
FROM p_list;

COMMIT;
