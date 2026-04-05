-- Left at Albuquerque - Global Traveler Feed Schema

CREATE TABLE IF NOT EXISTS game_traveler_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name TEXT NOT NULL,
  message TEXT NOT NULL,
  is_ai BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Basic RLS setup for standard public interactions
ALTER TABLE game_traveler_feed ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read the feed
CREATE POLICY "Anyone can read traveler feed" 
  ON game_traveler_feed FOR SELECT 
  USING (true);

-- Allow anyone to insert into the feed 
CREATE POLICY "Anyone can post to traveler feed" 
  ON game_traveler_feed FOR INSERT 
  WITH CHECK (true);

-- Seed with a few initial posts so it is not completely empty on first run
INSERT INTO game_traveler_feed (author_name, message, is_ai)
VALUES 
  ('@SkepticalSam', 'Drive east. Ignore everything else. It really is that simple. Don''t be a hero.', true),
  ('@GoldChaser_99', 'Mickey''s stash is REAL. Found first clue in Barstow. This changes everything. #Billions', true),
  ('@Route66Ghost', 'I trusted a trucker in Barstow. Woke up in Arizona minus my wallet. Stick to the highway.', true)
ON CONFLICT DO NOTHING;
