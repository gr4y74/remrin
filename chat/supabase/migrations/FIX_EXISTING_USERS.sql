-- FIX_EXISTING_USERS.sql
-- Run this in Supabase SQL Editor
-- This creates profiles for existing users who are missing them

-- Insert profiles for all auth.users that don't have a profile
INSERT INTO public.profiles (user_id, username, display_name, has_onboarded)
SELECT 
    u.id,
    'user' || substr(replace(u.id::text, '-', ''), 1, 10),
    COALESCE(u.raw_user_meta_data->>'name', u.email, 'User'),
    FALSE
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;

-- Insert workspaces for all auth.users that don't have a home workspace
INSERT INTO public.workspaces (user_id, name, is_home, default_context_length, default_model, default_temperature)
SELECT 
    u.id,
    'Home',
    TRUE,
    4096,
    'deepseek-chat',
    0.5
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.workspaces w WHERE w.user_id = u.id AND w.is_home = TRUE
)
ON CONFLICT DO NOTHING;

-- Verification
SELECT 'Created profiles for existing users' as status;
SELECT count(*) as profile_count FROM profiles;
SELECT count(*) as workspace_count FROM workspaces WHERE is_home = TRUE;
