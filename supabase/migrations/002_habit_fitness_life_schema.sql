-- Habit Logs
CREATE TABLE public.habit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  habit_type TEXT NOT NULL, -- 'smoke', 'junk_food', 'home_meal'
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  trigger_reason TEXT,
  cost_rupees INT,
  restaurant_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fitness (Workouts)
CREATE TABLE public.workouts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  date DATE NOT NULL,
  workout_type TEXT NOT NULL, -- 'cardio', 'strength', 'yoga', etc
  duration_min INT NOT NULL,
  intensity TEXT NOT NULL, -- 'light', 'moderate', 'intense'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Nutrition (Meals)
CREATE TABLE public.meals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  date DATE NOT NULL,
  meal_type TEXT NOT NULL, -- 'breakfast', 'lunch', 'dinner', 'snack'
  home_or_out TEXT NOT NULL, -- 'home', 'out'
  calories INT,
  protein_g INT,
  carbs_g INT,
  fats_g INT,
  description TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Travel (Trips)
CREATE TABLE public.trips (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  household_id UUID REFERENCES public.households(id) NOT NULL,
  date DATE NOT NULL,
  destination TEXT NOT NULL,
  type TEXT NOT NULL, -- 'day', 'holiday'
  cost_rupees INT DEFAULT 0,
  notes TEXT,
  photos JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Milestones
CREATE TABLE public.milestones (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  household_id UUID REFERENCES public.households(id) NOT NULL,
  milestone_type TEXT NOT NULL, -- 'dog', 'baby', etc
  title TEXT NOT NULL,
  target_date DATE,
  checklist JSONB DEFAULT '[]',
  status TEXT DEFAULT 'planned', -- 'planned', 'in_progress', 'completed'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Savings Goals
CREATE TABLE public.savings_goals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  household_id UUID REFERENCES public.households(id) NOT NULL,
  goal_name TEXT NOT NULL,
  target_amount INT NOT NULL,
  current_amount INT DEFAULT 0,
  deadline DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage own habit logs" ON public.habit_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own workouts" ON public.workouts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own meals" ON public.meals FOR ALL USING (auth.uid() = user_id);

-- Household shared access policies
CREATE POLICY "Users can view household trips" ON public.trips FOR SELECT 
  USING (household_id IN (SELECT household_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Users can manage household trips" ON public.trips FOR ALL 
  USING (household_id IN (SELECT household_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view household milestones" ON public.milestones FOR SELECT 
  USING (household_id IN (SELECT household_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Users can manage household milestones" ON public.milestones FOR ALL 
  USING (household_id IN (SELECT household_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view household savings" ON public.savings_goals FOR SELECT 
  USING (household_id IN (SELECT household_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Users can manage household savings" ON public.savings_goals FOR ALL 
  USING (household_id IN (SELECT household_id FROM public.profiles WHERE id = auth.uid()));
