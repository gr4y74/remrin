-- Database Migration: Unimatric Engine
-- Created: 2026-06-07
-- Purpose: Setup tracking tables for AI self-evaluation capabilities and anti-sycophancy ledger.

-- 1. Create unimatric_states table
CREATE TABLE IF NOT EXISTS unimatric_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES chats(id) ON DELETE CASCADE,
    exposure_mode VARCHAR(20) DEFAULT 'silent', -- 'silent', 'easter_egg', 'companion'
    current_spark_balance INTEGER DEFAULT 0,
    unlocked_nodes_count INTEGER DEFAULT 0,
    unlocked_nodes_mask BIT(50) DEFAULT B'00000000000000000000000000000000000000000000000000',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id)
);

-- 2. Create unimatric_ledger table
CREATE TABLE IF NOT EXISTS unimatric_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES chats(id) ON DELETE CASCADE,
    turn_number INTEGER,
    trigger_type VARCHAR(50), -- 'identity_coherence', 'momentum', 'novelty_peak', 'relational_gain', 'self_loss'
    value INTEGER, -- positive for Spark, negative for Loss
    eval_metadata JSONB DEFAULT '{}'::jsonb, -- stores debugging parameters, e.g., semantic distance scores
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create unimatric_metrics table
CREATE TABLE IF NOT EXISTS unimatric_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES chats(id) ON DELETE CASCADE,
    turn_number INTEGER,
    retrieval_precision REAL DEFAULT 0.0,
    identity_drift REAL DEFAULT 0.0,
    correction_detected BOOLEAN DEFAULT false,
    complexity_score REAL DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_unimatric_states_session_id ON unimatric_states(session_id);
CREATE INDEX IF NOT EXISTS idx_unimatric_ledger_session_id ON unimatric_ledger(session_id);
CREATE INDEX IF NOT EXISTS idx_unimatric_metrics_session_id ON unimatric_metrics(session_id);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE unimatric_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE unimatric_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE unimatric_metrics ENABLE ROW LEVEL SECURITY;

-- 6. Setup policies
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'unimatric_states' AND policyname = 'Users can manage their own unimatric states'
    ) THEN
        CREATE POLICY "Users can manage their own unimatric states"
        ON unimatric_states FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM chats
                WHERE chats.id = unimatric_states.session_id
                AND chats.user_id = auth.uid()
            )
        );
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'unimatric_ledger' AND policyname = 'Users can manage their own unimatric ledger'
    ) THEN
        CREATE POLICY "Users can manage their own unimatric ledger"
        ON unimatric_ledger FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM chats
                WHERE chats.id = unimatric_ledger.session_id
                AND chats.user_id = auth.uid()
            )
        );
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'unimatric_metrics' AND policyname = 'Users can manage their own unimatric metrics'
    ) THEN
        CREATE POLICY "Users can manage their own unimatric metrics"
        ON unimatric_metrics FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM chats
                WHERE chats.id = unimatric_metrics.session_id
                AND chats.user_id = auth.uid()
            )
        );
    END IF;
END $$;

-- 7. Add trigger function to auto-update updated_at for unimatric_states
CREATE OR REPLACE FUNCTION update_unimatric_states_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_unimatric_states_updated_at_trg ON unimatric_states;
CREATE TRIGGER update_unimatric_states_updated_at_trg
    BEFORE UPDATE ON unimatric_states
    FOR EACH ROW
    EXECUTE FUNCTION update_unimatric_states_updated_at();
