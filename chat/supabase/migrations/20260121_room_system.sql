-- Enhance chat_rooms table
ALTER TABLE chat_rooms 
ADD COLUMN IF NOT EXISTS category text DEFAULT 'General',
ADD COLUMN IF NOT EXISTS is_private boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS password_hash text,
ADD COLUMN IF NOT EXISTS max_members int DEFAULT 50,
ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS rules text,
ADD COLUMN IF NOT EXISTS banner_url text,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Ensure created_at exists (it should, but just in case)
ALTER TABLE chat_rooms 
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Create room_moderators table
CREATE TABLE IF NOT EXISTS room_moderators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  permissions jsonb DEFAULT '{}'::jsonb,
  granted_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Create room_bans table
CREATE TABLE IF NOT EXISTS room_bans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text,
  banned_by uuid REFERENCES auth.users(id),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Create room_mutes table
CREATE TABLE IF NOT EXISTS room_mutes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text,
  muted_by uuid REFERENCES auth.users(id),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- RLS Policies
ALTER TABLE room_moderators ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_mutes ENABLE ROW LEVEL SECURITY;

-- Policies for room_moderators
CREATE POLICY "Public read access for moderators" ON room_moderators
  FOR SELECT USING (true);

CREATE POLICY "Owners can manage moderators" ON room_moderators
  FOR ALL USING (
    auth.uid() IN (SELECT owner_id FROM chat_rooms WHERE id = room_id)
  );

-- Policies for room_bans
CREATE POLICY "Public read access for bans" ON room_bans
  FOR SELECT USING (true);

CREATE POLICY "Moderators can manage bans" ON room_bans
  FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM room_moderators WHERE room_id = room_bans.room_id)
    OR
    auth.uid() IN (SELECT owner_id FROM chat_rooms WHERE id = room_bans.room_id)
  );

-- Policies for room_mutes
CREATE POLICY "Public read access for mutes" ON room_mutes
  FOR SELECT USING (true);

CREATE POLICY "Moderators can manage mutes" ON room_mutes
  FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM room_moderators WHERE room_id = room_mutes.room_id)
    OR
    auth.uid() IN (SELECT owner_id FROM chat_rooms WHERE id = room_mutes.room_id)
  );
