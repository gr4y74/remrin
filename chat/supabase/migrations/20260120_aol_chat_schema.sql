-- Create chat_rooms table
CREATE TABLE IF NOT EXISTS public.chat_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT true,
    is_official BOOLEAN DEFAULT false,
    max_users INT DEFAULT 23,
    password TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    topic TEXT
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    username TEXT NOT NULL,
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'user', -- 'user', 'system', 'emote'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create direct_messages table
CREATE TABLE IF NOT EXISTS public.direct_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    from_username TEXT NOT NULL,
    to_username TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create room_members table for tracking presence/status in rooms
CREATE TABLE IF NOT EXISTS public.room_members (
    room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    status TEXT DEFAULT 'active', -- 'active', 'away', 'idle'
    is_moderator BOOLEAN DEFAULT false,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (room_id, user_id)
);

-- Create buddy_lists table
CREATE TABLE IF NOT EXISTS public.buddy_lists (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    buddy_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    buddy_username TEXT NOT NULL,
    status TEXT DEFAULT 'accepted', -- 'pending', 'accepted', 'blocked'
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, buddy_id)
);

-- Create user_profiles_chat table for extended AOL-style profile info
CREATE TABLE IF NOT EXISTS public.user_profiles_chat (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    location TEXT,
    age INT,
    gender TEXT,
    interests TEXT[],
    favorite_quote TEXT,
    asl TEXT,
    away_message TEXT,
    status TEXT DEFAULT 'online', -- 'online', 'away', 'offline'
    show_online BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_chat_rooms_category ON public.chat_rooms(category);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_public ON public.chat_rooms(is_public);
CREATE INDEX IF NOT EXISTS idx_messages_room ON public.chat_messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_user ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_dm_conversation ON public.direct_messages(from_user_id, to_user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_dm_unread ON public.direct_messages(to_user_id, read);
CREATE INDEX IF NOT EXISTS idx_room_members_room ON public.room_members(room_id);

-- Enable RLS
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buddy_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles_chat ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Chat Rooms: Everyone can view public rooms
CREATE POLICY "Public rooms are viewable by everyone" 
ON public.chat_rooms FOR SELECT 
USING (is_public = true OR created_by = auth.uid());

-- Chat Rooms: Users can create rooms
CREATE POLICY "Users can create rooms" 
ON public.chat_rooms FOR INSERT 
WITH CHECK (auth.uid() = created_by);

-- Messages: Everyone in a room can view messages (simplified for MVP, ideally check room membership)
CREATE POLICY "Room messages are viewable by authenticated users" 
ON public.chat_messages FOR SELECT 
USING (auth.role() = 'authenticated');

-- Messages: Users can insert their own messages
CREATE POLICY "Users can insert their own messages" 
ON public.chat_messages FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Direct Messages: Users can view messages sent to them or by them
CREATE POLICY "Users can view their own DMs" 
ON public.direct_messages FOR SELECT 
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Direct Messages: Users can send DMs
CREATE POLICY "Users can send DMs" 
ON public.direct_messages FOR INSERT 
WITH CHECK (auth.uid() = from_user_id);

-- Room Members: Viewable by everyone
CREATE POLICY "Room members are viewable by everyone" 
ON public.room_members FOR SELECT 
USING (true);

-- Room Members: Users can manage their own membership
CREATE POLICY "Users can join/leave rooms" 
ON public.room_members FOR ALL 
USING (auth.uid() = user_id);

-- Buddy List: Users can view their own buddy list
CREATE POLICY "Users can view their own buddy list" 
ON public.buddy_lists FOR SELECT 
USING (auth.uid() = user_id);

-- Buddy List: Users can add buddies
CREATE POLICY "Users can add buddies" 
ON public.buddy_lists FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- User Profiles Chat: Viewable by everyone
CREATE POLICY "Chat profiles are viewable by everyone" 
ON public.user_profiles_chat FOR SELECT 
USING (true);

-- User Profiles Chat: Users can update their own profile
CREATE POLICY "Users can update their own chat profile" 
ON public.user_profiles_chat FOR ALL 
USING (auth.uid() = user_id);

-- Enable Realtime for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;

-- Grant permissions to authenticated users
GRANT ALL ON public.chat_rooms TO authenticated;
GRANT ALL ON public.chat_messages TO authenticated;
GRANT ALL ON public.direct_messages TO authenticated;
GRANT ALL ON public.room_members TO authenticated;
GRANT ALL ON public.buddy_lists TO authenticated;
GRANT ALL ON public.user_profiles_chat TO authenticated;
GRANT ALL ON public.chat_rooms TO service_role;
GRANT ALL ON public.chat_messages TO service_role;
GRANT ALL ON public.direct_messages TO service_role;
GRANT ALL ON public.room_members TO service_role;
GRANT ALL ON public.buddy_lists TO service_role;
GRANT ALL ON public.user_profiles_chat TO service_role;

