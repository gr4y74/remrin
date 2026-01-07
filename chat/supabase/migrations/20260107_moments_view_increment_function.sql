-- Function to increment view count for moments
-- This function is called by the view tracking API endpoint

CREATE OR REPLACE FUNCTION increment_moment_views(moment_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE moments
  SET view_count = view_count + 1
  WHERE id = moment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_moment_views(UUID) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION increment_moment_views IS 'Increments the view count for a moment by 1. Called when a user views a moment.';
