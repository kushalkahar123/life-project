-- Weekly Reviews Table for Sunday reflection
CREATE TABLE IF NOT EXISTS public.weekly_reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    week_start DATE NOT NULL,
    wins TEXT,
    struggles TEXT,
    next_week_focus TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    stats JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, week_start)
);

-- Add RLS
ALTER TABLE public.weekly_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reviews"
    ON public.weekly_reviews FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reviews"
    ON public.weekly_reviews FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
    ON public.weekly_reviews FOR UPDATE
    USING (auth.uid() = user_id);

-- Add imported_from column to sleep_logs for tracking import source
ALTER TABLE public.sleep_logs 
ADD COLUMN IF NOT EXISTS imported_from TEXT;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_weekly_reviews_user_week 
ON public.weekly_reviews(user_id, week_start);
