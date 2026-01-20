-- Migration: 20260120_user_collections.sql
-- Create user collections system

-- 1. Create user_collections table
CREATE TABLE IF NOT EXISTS user_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    visibility TEXT NOT NULL DEFAULT 'PRIVATE' CHECK (visibility IN ('PRIVATE', 'PUBLIC', 'UNLISTED')),
    cover_image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create collection_items table
CREATE TABLE IF NOT EXISTS collection_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collection_id UUID NOT NULL REFERENCES user_collections(id) ON DELETE CASCADE,
    persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    order_index INTEGER NOT NULL DEFAULT 0,
    UNIQUE(collection_id, persona_id)
);

-- 3. Enable RLS
ALTER TABLE user_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;

-- 4. Set up RLS Policies for user_collections
CREATE POLICY "Users can manage their own collections"
    ON user_collections
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view public collections"
    ON user_collections
    FOR SELECT
    USING (visibility = 'PUBLIC' OR auth.uid() = user_id);

-- 5. Set up RLS Policies for collection_items
CREATE POLICY "Users can manage items in their own collections"
    ON collection_items
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_collections
            WHERE id = collection_items.collection_id
            AND user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_collections
            WHERE id = collection_items.collection_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can view items in public collections"
    ON collection_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_collections
            WHERE id = collection_items.collection_id
            AND (visibility = 'PUBLIC' OR user_id = auth.uid())
        )
    );

-- 6. Add Indexes
CREATE INDEX IF NOT EXISTS idx_user_collections_user_id ON user_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_collection_id ON collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_persona_id ON collection_items(persona_id);

-- 7. Add updated_at trigger
CREATE TRIGGER update_user_collections_updated_at
    BEFORE UPDATE ON user_collections
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
