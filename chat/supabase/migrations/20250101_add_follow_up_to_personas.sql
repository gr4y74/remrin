-- Migration: 20250101_add_follow_up_to_personas.sql
-- Add follow_up_likelihood field to personas table

ALTER TABLE public.personas 
ADD COLUMN IF NOT EXISTS follow_up_likelihood integer DEFAULT 40;

-- Update existing personas to have the default value
UPDATE public.personas 
SET follow_up_likelihood = 40 
WHERE follow_up_likelihood IS NULL;

-- Comment on column
COMMENT ON COLUMN public.personas.follow_up_likelihood IS 'Likelihood (0-100) of generating a follow-up question after a response.';
