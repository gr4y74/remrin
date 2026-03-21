-- Create the chat-attachments bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for chat-attachments
-- 1. Allow public read access
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Public Read Access for Chat Attachments'
    ) THEN
        CREATE POLICY "Public Read Access for Chat Attachments"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'chat-attachments');
    END IF;
END $$;

-- 2. Allow authenticated users to upload
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Authenticated Upload for Chat Attachments'
    ) THEN
        CREATE POLICY "Authenticated Upload for Chat Attachments"
        ON storage.objects FOR INSERT
        WITH CHECK (bucket_id = 'chat-attachments' AND auth.role() = 'authenticated');
    END IF;
END $$;

-- 3. Allow users to delete their own uploads
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Owner Delete for Chat Attachments'
    ) THEN
        CREATE POLICY "Owner Delete for Chat Attachments"
        ON storage.objects FOR DELETE
        USING (bucket_id = 'chat-attachments' AND auth.uid() = owner);
    END IF;
END $$;
