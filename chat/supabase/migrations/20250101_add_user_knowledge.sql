-- Create user_knowledge table
CREATE TABLE IF NOT EXISTS user_knowledge (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE user_knowledge ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own knowledge items"
    ON user_knowledge FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own knowledge items"
    ON user_knowledge FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own knowledge items"
    ON user_knowledge FOR DELETE
    USING (auth.uid() = user_id);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS user_knowledge_user_id_idx ON user_knowledge(user_id);
