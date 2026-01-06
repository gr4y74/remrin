-- Migration: 20260106_add_persona_comments.sql
-- Description: Adds a dedicated table for persona comments to avoid fragmentation and generic content issues.

CREATE TABLE IF NOT EXISTS persona_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for fast lookups by persona
CREATE INDEX IF NOT EXISTS idx_persona_comments_persona_id ON persona_comments(persona_id);

-- RLS Policies
ALTER TABLE persona_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view persona comments"
ON persona_comments FOR SELECT
TO public
USING (true);

CREATE POLICY "Authenticated users can post comments"
ON persona_comments FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own comments"
ON persona_comments FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments"
ON persona_comments FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Permissions
GRANT SELECT ON persona_comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON persona_comments TO authenticated;
