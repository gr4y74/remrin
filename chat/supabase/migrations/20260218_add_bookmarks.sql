-- Create bookmark_folders table
CREATE TABLE IF NOT EXISTS public.bookmark_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT, -- Lucide icon name
    color TEXT, -- HSL or Hex
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create bookmarks table
CREATE TABLE IF NOT EXISTS public.bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES public.bookmark_folders(id) ON DELETE SET NULL,
    content_preview TEXT, -- Truncated message content for sidebar display
    note TEXT, -- Optional user note for the bookmark
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- Ensure a user can't bookmark the same message multiple times
    UNIQUE(user_id, message_id)
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_chat_id ON public.bookmarks(chat_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_folder_id ON public.bookmarks(folder_id);
CREATE INDEX IF NOT EXISTS idx_bookmark_folders_user_id ON public.bookmark_folders(user_id);

-- Enable RLS
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmark_folders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own bookmarks"
    ON public.bookmarks
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own bookmark folders"
    ON public.bookmark_folders
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id);
