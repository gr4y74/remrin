--- SudoDodo SQL SEED GENERATOR ---
INSERT INTO sudododo_hardware (manufacturer, model_name, category) VALUES ('Lenovo', 'ThinkPad X1 Carbon Gen 6', 'laptop') ON CONFLICT DO NOTHING;
INSERT INTO sudododo_communities (name, slug, icon, theme_color, tagline) VALUES ('Pop!_OS', 'popos', '🚀', '#48a999', 'The Linux distro that gets out of your way') ON CONFLICT (slug) DO UPDATE SET tagline = EXCLUDED.tagline RETURNING id;
INSERT INTO sudododo_distro_intel (community_id, tux_score, monthly_installs, user_rating, beginner_friendliness, latest_version, rank_position, distrowatch_hit_rank, hardware_compatibility)
  SELECT id, 98, '743k', 4.7, 'yes', '24.04 LTS', 1, 3, '[{"model":"ThinkPad X1 Carbon Gen 6","status":"perfect","notes":["Full suspension/hibernation support.","Trackpoint sensitivity is optimal."]}]'::jsonb
  FROM sudododo_communities WHERE slug = 'popos';

INSERT INTO sudododo_communities (name, slug, icon, theme_color, tagline) VALUES ('Arch Linux', 'arch', '🏔️', '#1793d1', 'A simple, lightweight distribution') ON CONFLICT (slug) DO UPDATE SET tagline = EXCLUDED.tagline RETURNING id;
INSERT INTO sudododo_distro_intel (community_id, tux_score, monthly_installs, user_rating, beginner_friendliness, latest_version, rank_position, distrowatch_hit_rank, hardware_compatibility)
  SELECT id, 87, '621k', 4.8, 'no', 'Rolling', 4, 1, '[{"model":"ThinkPad X1 Carbon Gen 6","status":"functional","notes":["Requires manual setup for fingerprint reader.","TPM 2.0 requires extra config."]}]'::jsonb
  FROM sudododo_communities WHERE slug = 'arch';


