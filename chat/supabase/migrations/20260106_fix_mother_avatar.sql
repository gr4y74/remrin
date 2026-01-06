-- Manually update the Mother of Souls avatar image
-- This sets the image_url to the public path provided

UPDATE personas
SET image_url = '/images/mother/thumb.png'
WHERE id = 'a0000000-0000-0000-0000-000000000001';
