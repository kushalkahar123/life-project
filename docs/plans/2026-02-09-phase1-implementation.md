# Phase 1: Sleep Discipline - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a sleep discipline system that enforces 11 PM bedtime with tracking, streaks, and couple visibility.

**Architecture:** Supabase backend (PostgreSQL + Auth + Realtime) + Vite React dashboard + Apple Shortcuts for enforcement

**Tech Stack:** Vite, React, TypeScript, Supabase, Apple Shortcuts, Tailwind CSS

---

## Task 1: Set Up Supabase Project

**Files:**
- Create: `.env.local` (Supabase credentials)
- Create: `supabase/migrations/001_initial_schema.sql`

**Step 1: Create Supabase project**

1. Go to https://supabase.com and create new project: "life-project"
2. Note down: Project URL, Anon Key, Service Role Key
3. Wait for project to be ready

**Step 2: Create environment file**

Create `.env.local`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Step 3: Create initial database schema**

Run this SQL in Supabase SQL Editor:

```sql
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
  streak_type TEXT NOT NULL, -- 'sleep', 'smoke_free', 'home_meal', etc.
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
```

**Step 4: Verify schema created**

Run in SQL Editor:
```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

Expected: `profiles`, `households`, `sleep_logs`, `streaks`

**Step 5: Commit**
```bash
git add supabase/ .env.local
git commit -m "feat: add Supabase schema for sleep tracking"
```

---

## Task 2: Initialize Vite React Project

**Files:**
- Create: Project structure via Vite

**Step 1: Create Vite project**

```bash
cd "/Users/rocky/Desktop/Play/Life Project"
npm create vite@latest app -- --template react-ts
cd app
npm install
```

**Step 2: Install dependencies**

```bash
npm install @supabase/supabase-js react-router-dom lucide-react
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**Step 3: Configure Tailwind**

Update `tailwind.config.js`:
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Update `src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Step 4: Verify setup**

```bash
npm run dev
```

Expected: Vite dev server starts at http://localhost:5173

**Step 5: Commit**
```bash
git add .
git commit -m "feat: initialize Vite React project with Tailwind"
```

---

## Task 3: Set Up Supabase Client & Auth

**Files:**
- Create: `app/src/lib/supabase.ts`
- Create: `app/src/contexts/AuthContext.tsx`
- Create: `app/src/pages/Login.tsx`

**Step 1: Create Supabase client**

Create `app/src/lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

**Step 2: Create Auth Context**

Create `app/src/contexts/AuthContext.tsx`:
```typescript
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    
    // Create profile
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        email,
        display_name: name
      })
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

**Step 3: Create Login page**

Create `app/src/pages/Login.tsx`:
```typescript
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      if (isSignUp) {
        await signUp(email, password, name)
      } else {
        await signIn(email, password)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <h1 className="text-3xl font-bold text-white text-center mb-8">
          🌙 Life Project
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-pink-500"
              required
            />
          )}
          
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-pink-500"
            required
          />
          
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-pink-500"
            required
          />
          
          {error && (
            <p className="text-red-300 text-sm">{error}</p>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>
        
        <p className="text-white/60 text-center mt-6">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-pink-400 hover:underline"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  )
}
```

**Step 4: Update App.tsx**

Replace `app/src/App.tsx`:
```typescript
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Login } from './pages/Login'

function AppContent() {
  const { user, loading, signOut } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }
  
  if (!user) {
    return <Login />
  }
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">🌙 Life Project</h1>
          <button
            onClick={signOut}
            className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700"
          >
            Sign Out
          </button>
        </div>
        <p className="text-gray-400">Welcome, {user.email}!</p>
        <p className="text-gray-500 mt-4">Sleep dashboard coming next...</p>
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
```

**Step 5: Copy .env.local to app folder**

```bash
cp .env.local app/.env.local
```

**Step 6: Verify auth works**

```bash
cd app && npm run dev
```

1. Go to http://localhost:5173
2. Sign up with email/password
3. Check Supabase dashboard → Authentication → Users
4. Verify user created

**Step 7: Commit**
```bash
git add .
git commit -m "feat: add Supabase auth with login/signup"
```

---

## Task 4: Build Sleep Logging Dashboard

**Files:**
- Create: `app/src/pages/Dashboard.tsx`
- Create: `app/src/components/SleepLogger.tsx`
- Create: `app/src/components/SleepStats.tsx`
- Create: `app/src/hooks/useSleepLogs.ts`

**Step 1: Create sleep logs hook**

Create `app/src/hooks/useSleepLogs.ts`:
```typescript
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export interface SleepLog {
  id: string
  user_id: string
  date: string
  bedtime_target: string
  bedtime_actual: string | null
  wake_actual: string | null
  sleep_duration_minutes: number | null
  quality_score: number | null
  on_schedule: boolean
  notes: string | null
}

export function useSleepLogs() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<SleepLog[]>([])
  const [loading, setLoading] = useState(true)
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    if (!user) return
    
    fetchLogs()
    fetchStreak()
  }, [user])

  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from('sleep_logs')
      .select('*')
      .eq('user_id', user!.id)
      .order('date', { ascending: false })
      .limit(30)
    
    if (error) console.error(error)
    else setLogs(data || [])
    setLoading(false)
  }

  const fetchStreak = async () => {
    const { data } = await supabase
      .from('streaks')
      .select('current_count')
      .eq('user_id', user!.id)
      .eq('streak_type', 'sleep')
      .single()
    
    setStreak(data?.current_count || 0)
  }

  const logSleep = async (bedtime: string, wakeTime: string, quality: number) => {
    const today = new Date().toISOString().split('T')[0]
    
    // Calculate duration
    const bed = new Date(`2000-01-01T${bedtime}`)
    const wake = new Date(`2000-01-02T${wakeTime}`)
    const durationMinutes = Math.round((wake.getTime() - bed.getTime()) / 60000)
    
    const { error } = await supabase
      .from('sleep_logs')
      .upsert({
        user_id: user!.id,
        date: today,
        bedtime_actual: bedtime,
        wake_actual: wakeTime,
        sleep_duration_minutes: durationMinutes,
        quality_score: quality
      })
    
    if (error) throw error
    
    // Update streak
    await updateStreak(bedtime)
    await fetchLogs()
    await fetchStreak()
  }

  const updateStreak = async (bedtime: string) => {
    const onSchedule = bedtime <= '23:15' // 15 min grace period
    
    const { data: existing } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', user!.id)
      .eq('streak_type', 'sleep')
      .single()
    
    const today = new Date().toISOString().split('T')[0]
    const newCount = onSchedule ? (existing?.current_count || 0) + 1 : 0
    const longest = Math.max(newCount, existing?.longest_count || 0)
    
    await supabase.from('streaks').upsert({
      user_id: user!.id,
      streak_type: 'sleep',
      current_count: newCount,
      longest_count: longest,
      last_updated: today
    })
  }

  return { logs, loading, streak, logSleep }
}
```

**Step 2: Create SleepLogger component**

Create `app/src/components/SleepLogger.tsx`:
```typescript
import { useState } from 'react'
import { Moon, Sun, Star } from 'lucide-react'

interface Props {
  onLog: (bedtime: string, wakeTime: string, quality: number) => Promise<void>
}

export function SleepLogger({ onLog }: Props) {
  const [bedtime, setBedtime] = useState('23:00')
  const [wakeTime, setWakeTime] = useState('07:00')
  const [quality, setQuality] = useState(7)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onLog(bedtime, wakeTime, quality)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  const isOnSchedule = bedtime <= '23:15'

  return (
    <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 rounded-2xl p-6 backdrop-blur">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Moon className="text-indigo-400" />
        Log Today's Sleep
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Bedtime</label>
            <input
              type="time"
              value={bedtime}
              onChange={(e) => setBedtime(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/10 text-white"
            />
            {isOnSchedule ? (
              <p className="text-green-400 text-sm mt-1">✓ On schedule!</p>
            ) : (
              <p className="text-orange-400 text-sm mt-1">⚠ Past 11:15 PM</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">Wake Time</label>
            <input
              type="time"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/10 text-white"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Sleep Quality: {quality}/10
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={quality}
            onChange={(e) => setQuality(parseInt(e.target.value))}
            className="w-full accent-purple-500"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Poor</span>
            <span>Excellent</span>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
        >
          {loading ? 'Saving...' : success ? '✓ Saved!' : 'Log Sleep'}
        </button>
      </form>
    </div>
  )
}
```

**Step 3: Create SleepStats component**

Create `app/src/components/SleepStats.tsx`:
```typescript
import { Flame, TrendingUp, Clock } from 'lucide-react'
import { SleepLog } from '../hooks/useSleepLogs'

interface Props {
  logs: SleepLog[]
  streak: number
}

export function SleepStats({ logs, streak }: Props) {
  const last7Days = logs.slice(0, 7)
  const avgDuration = last7Days.length > 0
    ? Math.round(last7Days.reduce((sum, log) => sum + (log.sleep_duration_minutes || 0), 0) / last7Days.length / 60 * 10) / 10
    : 0
  const onScheduleCount = last7Days.filter(log => log.on_schedule).length

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-gradient-to-br from-orange-500/20 to-red-600/20 rounded-xl p-4 text-center">
        <Flame className="mx-auto text-orange-400 mb-2" size={28} />
        <p className="text-3xl font-bold text-white">{streak}</p>
        <p className="text-sm text-gray-400">Day Streak</p>
      </div>
      
      <div className="bg-gradient-to-br from-blue-500/20 to-indigo-600/20 rounded-xl p-4 text-center">
        <Clock className="mx-auto text-blue-400 mb-2" size={28} />
        <p className="text-3xl font-bold text-white">{avgDuration}h</p>
        <p className="text-sm text-gray-400">Avg Sleep</p>
      </div>
      
      <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-xl p-4 text-center">
        <TrendingUp className="mx-auto text-green-400 mb-2" size={28} />
        <p className="text-3xl font-bold text-white">{onScheduleCount}/7</p>
        <p className="text-sm text-gray-400">On Schedule</p>
      </div>
    </div>
  )
}
```

**Step 4: Create Dashboard page**

Create `app/src/pages/Dashboard.tsx`:
```typescript
import { useSleepLogs } from '../hooks/useSleepLogs'
import { SleepLogger } from '../components/SleepLogger'
import { SleepStats } from '../components/SleepStats'
import { useAuth } from '../contexts/AuthContext'
import { Moon } from 'lucide-react'

export function Dashboard() {
  const { user, signOut } = useAuth()
  const { logs, loading, streak, logSleep } = useSleepLogs()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 text-white">
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Moon className="text-indigo-400" />
              Life Project
            </h1>
            <p className="text-gray-400 text-sm">Phase 1: Sleep Discipline</p>
          </div>
          <button
            onClick={signOut}
            className="px-4 py-2 text-sm bg-white/10 rounded-lg hover:bg-white/20"
          >
            Sign Out
          </button>
        </div>

        {/* Stats */}
        <div className="mb-6">
          <SleepStats logs={logs} streak={streak} />
        </div>

        {/* Logger */}
        <div className="mb-6">
          <SleepLogger onLog={logSleep} />
        </div>

        {/* Recent Logs */}
        <div className="bg-white/5 rounded-xl p-4">
          <h3 className="text-lg font-semibold mb-4">Recent Sleep Logs</h3>
          {logs.length === 0 ? (
            <p className="text-gray-500">No logs yet. Start tracking tonight!</p>
          ) : (
            <div className="space-y-2">
              {logs.slice(0, 7).map(log => (
                <div key={log.id} className="flex justify-between items-center py-2 border-b border-white/10">
                  <div>
                    <p className="font-medium">{new Date(log.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                    <p className="text-sm text-gray-400">
                      {log.bedtime_actual?.slice(0,5)} → {log.wake_actual?.slice(0,5)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={log.on_schedule ? 'text-green-400' : 'text-orange-400'}>
                      {log.on_schedule ? '✓ On Time' : '⚠ Late'}
                    </p>
                    <p className="text-sm text-gray-400">
                      {Math.round((log.sleep_duration_minutes || 0) / 60 * 10) / 10}h | ⭐{log.quality_score}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

**Step 5: Update App.tsx to use Dashboard**

Update `app/src/App.tsx`:
```typescript
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'

function AppContent() {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }
  
  if (!user) {
    return <Login />
  }
  
  return <Dashboard />
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
```

**Step 6: Verify dashboard works**

```bash
npm run dev
```

1. Sign in
2. Log a sleep entry
3. Verify it appears in recent logs
4. Check Supabase dashboard → Table Editor → sleep_logs

**Step 7: Commit**
```bash
git add .
git commit -m "feat: add sleep logging dashboard with stats and streaks"
```

---

## Task 5: Create Apple Shortcuts for Enforcement

**Files:**
- Create: `docs/shortcuts/bedtime-mode.md` (instructions)
- Create: `docs/shortcuts/morning-checkin.md` (instructions)

**Step 1: Document Bedtime Mode Shortcut**

Create `docs/shortcuts/bedtime-mode.md`:
```markdown
# Bedtime Mode - Apple Shortcut

## Setup Instructions

### Step 1: Create Focus Mode
1. Settings → Focus → + (add new)
2. Name: "Bedtime"
3. Allowed Notifications: None (or just Phone)
4. Allowed Apps: Clock, Phone, Health only
5. Options → Home Screen → Show only allowed apps

### Step 2: Create Shortcut

1. Open Shortcuts app
2. Create new shortcut: "Bedtime Mode"
3. Add actions:

```
Text: "Time to sleep! Bedtime mode activated."
Show Notification [Text]
Set Focus [Bedtime] to On
Set Screen Brightness to 10%

-- Optional: Log to Supabase --
URL: https://YOUR_PROJECT.supabase.co/rest/v1/sleep_logs
Method: POST
Headers:
  apikey: YOUR_ANON_KEY
  Authorization: Bearer YOUR_ANON_KEY
  Content-Type: application/json
Body: {"user_id": "YOUR_USER_ID", "date": "Current Date", "bedtime_actual": "Current Time"}
```

### Step 3: Schedule Automation

1. Shortcuts → Automations → +
2. Time of Day → 11:00 PM
3. Run: "Bedtime Mode" shortcut
4. Turn OFF "Ask Before Running"

### Step 4: Create 10:45 Warning

1. Create another automation for 10:45 PM
2. Action: Show notification "15 minutes to bedtime!"
```

**Step 2: Document Morning Check-in Shortcut**

Create `docs/shortcuts/morning-checkin.md`:
```markdown
# Morning Check-in - Apple Shortcut

## Setup Instructions

### Step 1: Create Shortcut

1. Open Shortcuts app
2. Create new shortcut: "Morning Check-in"
3. Add actions:

```
Turn Off Focus [Bedtime]
Get Health Sample [Sleep Analysis] from [Yesterday]
Set Variable [sleepData] to [Health Sample]

-- Show summary --
Text: "Good morning! You slept [sleepData] hours."
Show Notification [Text]

-- Log to Supabase (optional) --
URL: https://YOUR_PROJECT.supabase.co/rest/v1/sleep_logs
Method: PATCH  
Headers: (same as bedtime)
Body: {"wake_actual": "Current Time"}
```

### Step 2: Schedule Automation

1. Shortcuts → Automations → +
2. Alarm → When alarm is stopped
3. Run: "Morning Check-in" shortcut

### Alternative: First Unlock

1. Automations → When [iPhone] is unlocked
2. Add condition: Current Time is after 5:00 AM
3. Run: "Morning Check-in"
```

**Step 3: Commit**
```bash
git add docs/shortcuts/
git commit -m "docs: add Apple Shortcut setup instructions for sleep enforcement"
```

---

## Verification Plan

### Automated Tests
None yet - Phase 1 is primarily UI. Tests will be added in Phase 2.

### Manual Verification

1. **Auth Flow:**
   - [ ] Sign up with new email
   - [ ] Sign out
   - [ ] Sign in with existing email
   - [ ] Verify user appears in Supabase dashboard

2. **Sleep Logging:**
   - [ ] Log a sleep entry with bedtime 22:30 (on schedule)
   - [ ] Verify streak increases
   - [ ] Log entry with bedtime 23:30 (late)
   - [ ] Verify streak resets
   - [ ] Check Supabase Table Editor for data

3. **Dashboard:**
   - [ ] Stats display correctly
   - [ ] Recent logs show entries
   - [ ] Colors indicate on-schedule vs late

4. **Apple Shortcuts:**
   - [ ] Test bedtime shortcut manually
   - [ ] Verify Focus Mode activates
   - [ ] Test morning check-in shortcut
   - [ ] Verify notifications appear

---

## Next Steps After Phase 1

1. Add partner linking (invite by email)
2. Show partner's sleep stats on dashboard
3. Add weekly/monthly trend charts
4. Implement Phase 2: Habit Breaking
