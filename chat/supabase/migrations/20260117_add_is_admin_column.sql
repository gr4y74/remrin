-- Add is_admin column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create policy to allow admins to view all profiles (if not already existing)
-- Note: Assuming existing policies handle user view, but admin view might need explicit policy if RLS is strict.
-- For now, just adding the column is the priority.
