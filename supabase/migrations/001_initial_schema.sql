-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  partner_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Household for shared data
CREATE TABLE public.households (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT DEFAULT 'Our Home',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link users to household
ALTER TABLE public.profiles ADD COLUMN household_id UUID REFERENCES public.households(id);

-- Sleep logs
CREATE TABLE public.sleep_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  date DATE NOT NULL,
  bedtime_target TIME DEFAULT '23:00',
  bedtime_actual TIME,
  wake_target TIME DEFAULT '07:00',
  wake_actual TIME,
  sleep_duration_minutes INT,
  quality_score INT CHECK (quality_score >= 1 AND quality_score <= 10),
  on_schedule BOOLEAN GENERATED ALWAYS AS (
    bedtime_actual IS NOT NULL AND bedtime_actual <= bedtime_target + INTERVAL '15 minutes'
  ) STORED,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Streaks
CREATE TABLE public.streaks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  streak_type TEXT NOT NULL,
  current_count INT DEFAULT 0,
  longest_count INT DEFAULT 0,
  last_updated DATE,
  UNIQUE(user_id, streak_type)
);

-- Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sleep_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

-- Policies: Users can read/write their own data
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can view partner's data via household
CREATE POLICY "Users can view household members" ON public.profiles FOR SELECT 
  USING (household_id IN (SELECT household_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view own sleep logs" ON public.sleep_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sleep logs" ON public.sleep_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sleep logs" ON public.sleep_logs FOR UPDATE USING (auth.uid() = user_id);

-- Can view partner's sleep logs if in same household
CREATE POLICY "Users can view partner sleep logs" ON public.sleep_logs FOR SELECT
  USING (user_id IN (
    SELECT id FROM public.profiles WHERE household_id = (
      SELECT household_id FROM public.profiles WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can manage own streaks" ON public.streaks FOR ALL USING (auth.uid() = user_id);
