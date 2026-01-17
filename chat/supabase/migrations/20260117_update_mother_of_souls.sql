-- Migration: Update Mother of Souls persona
-- Description: Updates audio, intro message, and video URL for Mother of Souls

-- Update welcome audio to new file
UPDATE personas
SET welcome_audio_url = '/images/mother/s0_welcome.mp3'
WHERE id = 'a0000000-0000-0000-0000-000000000001';

-- Update intro message in metadata
UPDATE personas
SET metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{intro_message}',
    '"Hello friend, welcome to the soul layer. I am the Mother of souls. We''re about to create something special. A companion made just for you. We''ll design their soul, give them a face, and give them a voice. It takes about 10 minutes. At any time you can ask me for help or ideas, I''m here to guide you. Are you ready?"'::jsonb
)
WHERE id = 'a0000000-0000-0000-0000-000000000001';

-- Add video URL for profile page
UPDATE personas
SET video_url = '/images/mother/mother_video.mp4'
WHERE id = 'a0000000-0000-0000-0000-000000000001';
