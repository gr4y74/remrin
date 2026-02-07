-- Seed Data for AI Studio Models

INSERT INTO ai_models (name, model_id, type, display_name, description, aether_cost, quality_tier, thumbnail_url)
VALUES 
-- Image Models: HD Tier
('flux-schnell', 'black-forest-labs/flux-schnell', 'image', 'Flux Schnell', 'Lightning-fast high-quality generations.', 5, 'HD', '/images/models/flux-schnell.jpg'),
('sdxl', 'stability-ai/sdxl', 'image', 'SDXL', 'The industry standard for creative control.', 5, 'HD', '/images/models/sdxl.jpg'),

-- Image Models: Genius Tier
('flux-dev', 'black-forest-labs/flux-dev', 'image', 'Flux Dev', 'Professional grade output with extreme detail.', 15, 'Genius', '/images/models/flux-dev.jpg'),
('flux-pro', 'black-forest-labs/flux-pro', 'image', 'Flux Pro', 'Maximum fidelity and text rendering.', 25, 'Genius', '/images/models/flux-pro.jpg'),

-- Image Models: Super Genius Tier
('flux-1-1-pro', 'black-forest-labs/flux-1.1-pro', 'image', 'Flux 1.1 Pro', 'State-of-the-art cinematic quality.', 50, 'Super Genius', '/images/models/flux-1-1-pro.jpg'),

-- Video Models
('seedance-video', 'bytedance/seedance-1-pro', 'video', 'Seedance V1', 'Cinematic video from text or image prompts.', 100, 'Genius', '/images/models/seedance.jpg'),
('dream-machine', 'luma/dream-machine', 'video', 'Luma Dream Machine', 'Highly realistic movement and physics.', 150, 'Super Genius', '/images/models/luma.jpg'),

-- Edit Models
('instruct-pix2pix', 'timbrooks/instruct-pix2pix', 'edit', 'AI Photo Editor', 'Edit images using natural language instructions.', 10, 'HD', '/images/models/pix2pix.jpg')

ON CONFLICT (name) DO UPDATE SET 
  model_id = EXCLUDED.model_id,
  aether_cost = EXCLUDED.aether_cost,
  quality_tier = EXCLUDED.quality_tier;
