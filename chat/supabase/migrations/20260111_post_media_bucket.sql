-- Create storage bucket for post media (images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'post-media',
    'post-media',
    true,
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- RLS for post-media bucket
CREATE POLICY "Anyone can view post media"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-media');

CREATE POLICY "Authenticated users can upload post media"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'post-media' 
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own post media"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'post-media' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own post media"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'post-media' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);
