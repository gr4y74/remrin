-- Cleanup Duplicate Mother of Souls Personas
-- Keeps only the official singleton ID: a0000000-0000-0000-0000-000000000001

DELETE FROM personas
WHERE (name ILIKE '%Mother of Souls%')
AND id != 'a0000000-0000-0000-0000-000000000001';
