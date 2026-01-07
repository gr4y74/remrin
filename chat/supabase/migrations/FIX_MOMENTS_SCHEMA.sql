-- Fix Moments Schema for Video Support
-- Run this in Supabase SQL Editor

-- 1. Make image_url nullable so videos can be uploaded without an image
ALTER TABLE moments ALTER COLUMN image_url DROP NOT NULL;

-- 2. Ensure video columns exist (idempotent)
ALTER TABLE moments ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE moments ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE moments ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;
ALTER TABLE moments ADD COLUMN IF NOT EXISTS media_type VARCHAR(50) DEFAULT 'image';
