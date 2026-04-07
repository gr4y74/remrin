-- SudoDodo - Unified Knowledge & Hardware Matrix Schema

-- 1. Knowledge Cache (Vector/Snippet Cache for RAG)
CREATE TABLE IF NOT EXISTS sudododo_knowledge_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id TEXT NOT NULL, -- e.g., 'arch-wiki', 'nixcraft'
  title TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  content_snippet TEXT,
  raw_markdown TEXT,
  category TEXT, -- 'beginner', 'technical', 'news'
  tags TEXT[],
  last_indexed TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Hardware Compatibility Matrix (Deeper Version)
-- Tracks specific drivers, kernels, and status for hardware models
CREATE TABLE IF NOT EXISTS sudododo_hardware_matrix (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hardware_id UUID REFERENCES sudododo_hardware(id),
  distro_id UUID REFERENCES sudododo_communities(id),
  status TEXT DEFAULT 'unknown', -- 'perfect', 'functional', 'minor_issues', 'broken'
  kernel_version TEXT,
  required_drivers TEXT[],
  notes JSONB DEFAULT '[]'::jsonb,
  reported_by TEXT DEFAULT 'official', -- 'official' or 'community'
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(hardware_id, distro_id)
);

-- 3. Ingestion Progress Tracker
CREATE TABLE IF NOT EXISTS sudododo_ingestion_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id TEXT NOT NULL,
  pages_indexed INT DEFAULT 0,
  status TEXT DEFAULT 'idle', -- 'idle', 'running', 'failed', 'completed'
  error_msg TEXT,
  last_run TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_knowledge_search ON sudododo_knowledge_cache USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_hardware_matrix_lookup ON sudododo_hardware_matrix (hardware_id, distro_id);
