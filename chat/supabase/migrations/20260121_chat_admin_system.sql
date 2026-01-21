-- Chat Reports System
CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'actioned', 'dismissed');

CREATE TABLE IF NOT EXISTS public.chat_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reported_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    room_id UUID REFERENCES public.chat_rooms(id) ON DELETE SET NULL,
    message_id UUID REFERENCES public.chat_messages(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    details TEXT,
    status report_status DEFAULT 'pending',
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat Analytics System
CREATE TABLE IF NOT EXISTS public.chat_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL UNIQUE DEFAULT CURRENT_DATE,
    total_messages INT DEFAULT 0,
    active_users INT DEFAULT 0,
    new_rooms INT DEFAULT 0,
    reports_filed INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chat_room_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    message_count INT DEFAULT 0,
    unique_users INT DEFAULT 0,
    peak_concurrent INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(room_id, date)
);

-- Admin Audit Logging
CREATE TABLE IF NOT EXISTS public.chat_admin_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL, -- 'user', 'room', 'message', 'report', 'settings'
    target_id UUID, -- Can be null for global actions
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat Settings (Global)
CREATE TABLE IF NOT EXISTS public.chat_settings (
    id INT PRIMARY KEY DEFAULT 1,
    max_message_length INT DEFAULT 500,
    rate_limit_seconds INT DEFAULT 1,
    allowed_file_types TEXT[] DEFAULT ARRAY['image/png', 'image/jpeg', 'image/gif'],
    profanity_filter_level TEXT DEFAULT 'standard', -- 'strict', 'standard', 'off'
    auto_moderation_enabled BOOLEAN DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT single_row CHECK (id = 1)
);

-- RLS Policies

-- Reports: Reporters can view their own reports, Admins can view all
ALTER TABLE public.chat_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reporters can view their own reports"
ON public.chat_reports FOR SELECT
USING (auth.uid() = reporter_id);

CREATE POLICY "Reporters can create reports"
ON public.chat_reports FOR INSERT
WITH CHECK (auth.uid() = reporter_id);

-- Analytics: Only admins/service role
ALTER TABLE public.chat_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_room_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to analytics"
ON public.chat_analytics FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role has full access to room stats"
ON public.chat_room_stats FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role has full access to admin logs"
ON public.chat_admin_logs FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role has full access to settings"
ON public.chat_settings FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can view settings"
ON public.chat_settings FOR SELECT
TO authenticated
USING (true);

-- Grant permissions
GRANT ALL ON public.chat_reports TO authenticated;
GRANT ALL ON public.chat_reports TO service_role;

GRANT SELECT ON public.chat_analytics TO authenticated;
GRANT ALL ON public.chat_analytics TO service_role;

GRANT SELECT ON public.chat_room_stats TO authenticated;
GRANT ALL ON public.chat_room_stats TO service_role;

GRANT SELECT ON public.chat_admin_logs TO service_role;
GRANT INSERT ON public.chat_admin_logs TO service_role;
GRANT SELECT ON public.chat_admin_logs TO authenticated; 

GRANT SELECT ON public.chat_settings TO authenticated;
GRANT ALL ON public.chat_settings TO service_role;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_chat_reports_status ON public.chat_reports(status);
CREATE INDEX IF NOT EXISTS idx_chat_reports_reported_user ON public.chat_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_chat_analytics_date ON public.chat_analytics(date);
CREATE INDEX IF NOT EXISTS idx_chat_room_stats_room_date ON public.chat_room_stats(room_id, date);
CREATE INDEX IF NOT EXISTS idx_chat_admin_logs_created_at ON public.chat_admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_admin_logs_target ON public.chat_admin_logs(target_type, target_id);
