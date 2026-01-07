-- Create storage bucket for moment videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'moment-videos',
    'moment-videos',
    true,
    524288000, -- 500MB limit
    ARRAY['video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for video thumbnails
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'moment-thumbnails',
    'moment-thumbnails',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS for moment-videos bucket
CREATE POLICY "Anyone can view moment videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'moment-videos');

CREATE POLICY "Authenticated users can upload moment videos"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'moment-videos' 
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own moment videos"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'moment-videos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own moment videos"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'moment-videos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS for moment-thumbnails bucket
CREATE POLICY "Anyone can view moment thumbnails"
ON storage.objects FOR SELECT
USING (bucket_id = 'moment-thumbnails');

CREATE POLICY "Authenticated users can upload moment thumbnails"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'moment-thumbnails' 
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own moment thumbnails"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'moment-thumbnails' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own moment thumbnails"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'moment-thumbnails' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);
