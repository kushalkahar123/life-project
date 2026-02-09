# Life Project - Design Document

> **Created:** 2026-02-09
> **Authors:** Rocky & Wife
> **Status:** Draft - Pending Final Review

---

## Executive Summary

A comprehensive life management system for a newly married couple in Mumbai, designed to improve discipline across sleep, habits, nutrition, exercise, travel, and life milestones over a phased rollout.

**Key Decisions:**
- **Architecture:** Web Dashboard + Apple Shortcuts + Supabase
- **Collaboration Model:** Linked individual accounts with shared household goals
- **Approach:** Hybrid (strict enforcement for some areas, coaching for others)

---

## User Profiles

| Person | DOB | Height | Current Weight | Target Weight | Notes |
|--------|-----|--------|----------------|---------------|-------|
| Rocky | 27 Aug 1997 | 6'0" | 110 kg | ~80-85 kg | Exercise beginner |
| Wife | 17 Sep 1999 | 5'2" | 88 kg | ~55-60 kg | PCOD, ex-yoga champion |

**Location:** Mumbai, India

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    WEB DASHBOARD                        │
│  (Next.js/Vite React)                                  │
│  - Personal & shared goal tracking                      │
│  - Data visualization & trends                          │
│  - Meal planning, exercise logs                         │
│  - Life milestone progress                              │
└─────────────────────────────────────────────────────────┘
                          ▲
                          │ Real-time sync
                          ▼
┌─────────────────────────────────────────────────────────┐
│                     SUPABASE                            │
│  - PostgreSQL database                                  │
│  - User auth (linked accounts)                          │
│  - Real-time subscriptions                              │
│  - Edge functions for automation                        │
└─────────────────────────────────────────────────────────┘
                          ▲
                          │ Webhooks / API calls
                          ▼
┌─────────────────────────────────────────────────────────┐
│               APPLE SHORTCUTS (iPhone)                  │
│  - Bedtime enforcer (phone lockdown)                   │
│  - Morning check-in automation                          │
│  - Push health data to Supabase                         │
│  - Quick-log buttons                                    │
└─────────────────────────────────────────────────────────┘
```

---

## Phase 1: Sleep Discipline

**Goal:** Both in bed by 11 PM, asleep by 11:30 PM

### Apple Shortcuts

**Bedtime Mode:**
- 10:45 PM: Warning notification
- 11:00 PM: Focus Mode activates
  - Blocks all apps except Phone, Clock, Health
  - Dims screen, shows "Time to Sleep"
  - 30-second delay to disable (friction)
- Logs "bedtime started" to Supabase

**Morning Check-in:**
- Triggers on alarm dismiss / unlock after 5 AM
- Pulls sleep data from Apple Health
- Syncs to Supabase automatically

### Dashboard Features
- Daily sleep compliance view
- Streak counter ("🔥 7 days on schedule!")
- Couple comparison (side-by-side)
- Weekly trends & recommendations

### Database Schema
```sql
sleep_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  date DATE,
  bedtime_target TIME,
  bedtime_actual TIME,
  wake_target TIME,
  wake_actual TIME,
  sleep_duration_minutes INT,
  quality_score INT,
  streak_count INT
);
```

---

## Phase 2: Habit Breaking

**Goals:** Quit smoking (2-3/day), reduce junk food, reward home cooking

### Quick Log Widgets
- 🚬 "I smoked" → timestamp + trigger
- 🍔 "Ate out (junk)" → restaurant + cost
- 🏠 "Ate home" → win + reward animation

### Motivation System
- Money saved counter (₹30/cigarette)
- Monthly eating-out budget tracker
- Reward goals ("Save ₹10,000 → buy equipment")

### Reduction Protocol
1. Week 1-2: Log only (baseline)
2. Week 3-4: Set reduction targets
3. Week 5+: Zero target with slip forgiveness

### Couple Accountability
- Shared visibility (optional toggle)
- Couple streak rewards
- Positive reinforcement only

### Database Schema
```sql
habit_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  habit_type VARCHAR, -- 'smoke', 'junk_food', 'home_meal'
  timestamp TIMESTAMPTZ,
  trigger_reason VARCHAR,
  cost_rupees INT,
  notes TEXT
);

habit_streaks (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  habit_type VARCHAR,
  current_streak INT,
  longest_streak INT,
  target_per_day INT
);
```

---

## Phase 3: Nutrition & Exercise

### Meal Planning
- Weekly planner (Sunday session)
- Auto shopping list
- Photo-based logging
- PCOD-aware recommendations
- Macro tracking (protein priority)

### Exercise Progression

| Person | Path |
|--------|------|
| Rocky | Walk → Treadmill intervals → Basic yoga → Dumbbells |
| Wife | Gentle yoga → Intermediate → Add cardio → Strength |

**Weekly Structure:**
- Mon/Wed/Fri: Cardio (20 min)
- Tue/Thu: Strength (15 min)
- Sat: Joint activity
- Sun: Rest

**Progression Rules:**
- +5 min every 2 weeks (if consistent)
- 7-day streak required before level up

### Database Schema
```sql
meals (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  date DATE,
  meal_type VARCHAR,
  home_or_out VARCHAR,
  calories INT,
  protein_g INT,
  carbs_g INT,
  fats_g INT,
  photo_url TEXT,
  notes TEXT
);

workouts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  date DATE,
  workout_type VARCHAR,
  duration_min INT,
  intensity VARCHAR,
  notes TEXT,
  apple_health_synced BOOLEAN
);

weekly_plans (
  id UUID PRIMARY KEY,
  household_id UUID,
  week_start DATE,
  planned_meals JSONB,
  shopping_list JSONB
);
```

---

## Phase 4: Dashboard, Travel & Milestones

### Unified Dashboard
- Today's status (all metrics)
- Couple streaks
- Quick actions
- Correlation insights
- Weight progress

### Travel Planning

**Day Trips (2-3/month):**
- Mumbai destination list
- "Spontaneous Picker" feature
- Trip log with photos
- Monthly budget tracker

**Annual Holiday (10 days):**
- Countdown widget
- Savings goal
- Planning checklist

### Life Milestones

**Dog (6-12 months):**
- Breed research
- Budget planning
- Home prep checklist
- Vet research

**Baby (36 months):**
- Health targets
- Financial checklist
- Pre-conception prep
- Private milestone tracker

### Database Schema
```sql
trips (
  id UUID PRIMARY KEY,
  household_id UUID,
  date DATE,
  destination VARCHAR,
  type VARCHAR,
  cost_rupees INT,
  notes TEXT,
  photos JSONB
);

milestones (
  id UUID PRIMARY KEY,
  household_id UUID,
  milestone_type VARCHAR,
  target_date DATE,
  checklist JSONB,
  status VARCHAR
);

savings_goals (
  id UUID PRIMARY KEY,
  household_id UUID,
  goal_name VARCHAR,
  target_amount INT,
  current_amount INT,
  deadline DATE
);
```

---

## Implementation Roadmap

| Phase | Focus | Duration | Key Deliverables |
|-------|-------|----------|------------------|
| 1 | Sleep | 2-3 weeks | Shortcuts, basic dashboard, sleep logging |
| 2 | Habits | 2-3 weeks | Quick-log widgets, streak system, savings counter |
| 3 | Nutrition/Exercise | 3-4 weeks | Meal planner, workout tracker, Apple Health sync |
| 4 | Full System | 4-6 weeks | Complete dashboard, travel, milestones |

**Total estimated timeline:** 12-16 weeks for full system

---

## Next Steps

1. **Approve this design document**
2. Set up Supabase project & auth
3. Create Phase 1 Apple Shortcuts
4. Build basic web dashboard skeleton
5. Implement sleep logging

---

*Ready to begin implementation?*
