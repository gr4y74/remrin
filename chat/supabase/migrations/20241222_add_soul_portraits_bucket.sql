--------------- SOUL PORTRAITS ---------------

-- STORAGE BUCKET --

-- Create the soul_portraits bucket for generated character images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('soul_portraits', 'soul_portraits', true)
ON CONFLICT (id) DO NOTHING;

-- RLS POLICIES --

-- Allow public read access to all soul portraits
CREATE POLICY "Allow public read access on soul portraits"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'soul_portraits');

-- Allow authenticated users to insert their own portraits
CREATE POLICY "Allow authenticated insert to own soul portraits"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'soul_portraits' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Allow authenticated users to update their own portraits
CREATE POLICY "Allow authenticated update to own soul portraits"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'soul_portraits' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Allow authenticated users to delete their own portraits
CREATE POLICY "Allow authenticated delete to own soul portraits"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'soul_portraits' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );
