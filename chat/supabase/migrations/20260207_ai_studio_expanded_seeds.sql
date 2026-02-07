-- Expanded Seed Data for AI Studio Models (30 Models)

-- Clean up existing models to avoid name conflicts if necessary, or use ON CONFLICT
-- Note: 'name' is the unique identifier in ai_models

INSERT INTO ai_models (name, model_id, type, display_name, description, aether_cost, quality_tier, thumbnail_url)
VALUES 
-- IMAGE MODELS (10)
('flux-1-1-pro', 'black-forest-labs/flux-1.1-pro', 'image', 'Flux 1.1 Pro', 'State-of-the-art cinematic quality with unmatched detail.', 50, 'Super Genius', '/samples/ai-studio/image/black-forest-labs_flux-1.1-pro.jpg'),
('flux-pro', 'black-forest-labs/flux-pro', 'image', 'Flux Pro', 'Maximum fidelity and professional text rendering.', 25, 'Genius', '/samples/ai-studio/image/black-forest-labs_flux-pro.png'),
('flux-dev', 'black-forest-labs/flux-dev', 'image', 'Flux Dev', 'Professional grade output for creative experimentation.', 15, 'Genius', '/samples/ai-studio/image/black-forest-labs_flux-dev.webp'),
('flux-schnell', 'black-forest-labs/flux-schnell', 'image', 'Flux Schnell', 'Lightning-fast high-quality generations in seconds.', 5, 'HD', '/samples/ai-studio/image/black-forest-labs_flux-schnell.webp'),
('recraft-v3', 'recraft-ai/recraft-v3', 'image', 'Recraft V3', 'Excellent for vector-like graphics and clean designs.', 20, 'Genius', '/samples/ai-studio/image/recraft-ai_recraft-v3.png'),
('ideogram-v2', 'ideogram-ai/ideogram-v2', 'image', 'Ideogram V2', 'Superior text rendering and artistic compositions.', 20, 'Genius', '/samples/ai-studio/image/ideogram-ai_ideogram-v2.png'),
('sticker-maker', 'fofr/sticker-maker', 'image', 'Sticker Maker', 'Turn any prompt into a high-quality die-cut sticker.', 10, 'HD', '/samples/ai-studio/image/fofr_sticker-maker.png'),
('playground-v2-5', 'playgroundai/playground-v2.5', 'image', 'Playground V2.5', 'A versatile model for diverse creative styles.', 10, 'HD', '/samples/ai-studio/image/playgroundai_playground-v2.5.webp'),
('sdxl', 'stability-ai/sdxl', 'image', 'SDXL', 'The industry standard for open-source creative control.', 5, 'HD', '/samples/ai-studio/image/stability-ai_sdxl.png'),
('sdxl-lightning', 'bytedance/sdxl-lightning-4step', 'image', 'SDXL Lightning', 'Ultra-fast SDXL generations with 4-step efficiency.', 5, 'HD', '/samples/ai-studio/image/bytedance_sdxl-lightning-4step.png'),

-- VIDEO MODELS (10)
('minimax-video-01', 'minimax/video-01', 'video', 'Minimax Video-01', 'High-fidelity cinematic video generation.', 100, 'Super Genius', '/samples/ai-studio/video/minimax_video-01.mp4'),
('mochi-1-preview', 'genmo/mochi-1-preview', 'video', 'Mochi 1 Preview', 'Smooth and fluid movement previews.', 80, 'Genius', '/samples/ai-studio/video/genmo_mochi-1-preview.webp'),
('hunyuan-video', 'tencent/hunyuan-video', 'video', 'Hunyuan Video', 'Powerful video synthesis from Tencent.', 120, 'Super Genius', '/samples/ai-studio/video/tencent_hunyuan-video.mp4'),
('ltx-video', 'lightricks/ltx-video', 'video', 'LTX Video', 'Stylized and cinematic video creations.', 100, 'Super Genius', '/samples/ai-studio/video/lightricks_ltx-video.mp4'),
('cogvideox-5b', 'fofr/cogvideox-5b', 'video', 'CogVideoX 5B', 'Advanced video generation with deep understanding.', 90, 'Genius', '/samples/ai-studio/video/fofr_cogvideox-5b.jpg'),
('stable-video-diffusion', 'stability-ai/stable-video-diffusion', 'video', 'SVD', 'Turn static images into dynamic scenes.', 75, 'Genius', '/samples/ai-studio/video/stability-ai_stable-video-diffusion.jpg'),
('animate-diff', 'lucataco/animate-diff', 'video', 'Animate Diff', 'Infinite animation possibilities from SD.', 60, 'Genius', '/samples/ai-studio/video/lucataco_animate-diff.mp4'),
('deforum', 'deforum/deforum_stable_diffusion', 'video', 'Deforum', 'Classic frame-by-frame AI animation.', 60, 'Genius', '/samples/ai-studio/video/deforum_deforum_stable_diffusion.mp4'),
('zeroscope-v2-xl', 'cjwbw/zeroscope-v2-xl', 'video', 'Zeroscope XL', 'Clean, specialized video generation.', 50, 'HD', '/samples/ai-studio/video/cjwbw_zeroscope-v2-xl.png'),
('live-portrait', 'fofr/live-portrait', 'video', 'Live Portrait', 'Bring still portraits to life with expression.', 50, 'HD', '/samples/ai-studio/video/fofr_live-portrait.webp'),

-- EDIT MODELS (10)
('sd-inpainting', 'stability-ai/stable-diffusion-inpainting', 'edit', 'SD Inpainting', 'Seamlessly fill and edit image parts.', 10, 'HD', '/samples/ai-studio/edit/stability-ai_stable-diffusion-inpainting.png'),
('face-to-sticker', 'fofr/face-to-sticker', 'edit', 'Face to Sticker', 'Transform any face into a fun sticker.', 15, 'Genius', '/samples/ai-studio/edit/fofr_face-to-sticker.png'),
('become-image', 'fofr/become-image', 'edit', 'Become Image', 'Creatively merge styles and subjects.', 20, 'Genius', '/samples/ai-studio/edit/fofr_become-image.webp'),
('codeformer', 'sczhou/codeformer', 'edit', 'CodeFormer', 'Restore and enhance old or blurry faces.', 10, 'HD', '/samples/ai-studio/edit/sczhou_codeformer.jpg'),
('gfpgan', 'tencentarc/gfpgan', 'edit', 'GFPGAN', 'High-performance face restoration.', 10, 'HD', '/samples/ai-studio/edit/tencentarc_gfpgan.jpg'),
('real-esrgan', 'nightmareai/real-esrgan', 'edit', 'Real-ESRGAN', 'Upscale images with extreme clarity.', 10, 'HD', '/samples/ai-studio/edit/nightmareai_real-esrgan.jpg'),
('remove-bg', 'fofr/remove-bg', 'edit', 'Remove BG', 'Instantly remove backgrounds with precision.', 5, 'HD', '/samples/ai-studio/edit/fofr_remove-bg.jpg'),
('controlnet', 'fofr/controlnet', 'edit', 'ControlNet', 'Maintain spatial control over your edits.', 25, 'Super Genius', '/samples/ai-studio/edit/fofr_controlnet.webp'),
('clip-interrogator', 'rosebud-ai/clip-interrogator', 'edit', 'CLIP Interrogator', 'Analyze images to generate text prompts.', 5, 'HD', '/samples/ai-studio/edit/rosebud-ai_clip-interrogator.mp4'),
('image-blend', 'fofr/image-blend', 'edit', 'Image Blend', 'Smoothly blend multiple images together.', 15, 'Genius', '/samples/ai-studio/edit/fofr_image-blend.jpg')

ON CONFLICT (name) DO UPDATE SET 
  model_id = EXCLUDED.model_id,
  type = EXCLUDED.type,
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  aether_cost = EXCLUDED.aether_cost,
  quality_tier = EXCLUDED.quality_tier,
  thumbnail_url = EXCLUDED.thumbnail_url;
