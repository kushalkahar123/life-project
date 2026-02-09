import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import type { HabitLog, HabitStats, HabitType } from '../types/habit'

const BASELINE_SMOKES_PER_DAY = 3
const COST_PER_SMOKE = 30

export function useHabitLogs() {
    const { user } = useAuth()
    const [logs, setLogs] = useState<HabitLog[]>([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<HabitStats>({
        smokeFreeStreak: 0,
        moneySaved: 0,
        homeMealsThisWeek: 0,
        junkFoodSpendThisMonth: 0,
        smokesToday: 0,
        dailyBaseline: BASELINE_SMOKES_PER_DAY
    })

    const calculateStats = useCallback((userLogs: HabitLog[]): HabitStats => {
        const todayStr = new Date().toISOString().split('T')[0]
        const now = new Date()

        // Get start of current week (Sunday)
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay())
        weekStart.setHours(0, 0, 0, 0)

        // Get start of current month
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

        // Smokes today
        const smokesToday = userLogs.filter(l =>
            l.habit_type === 'smoke' &&
            l.timestamp.startsWith(todayStr)
        ).length

        // Calculate smoke-free streak
        let smokeFreeStreak = 0
        for (let i = 0; i < 30; i++) {
            const date = new Date(now)
            date.setDate(date.getDate() - i)
            const dateStr = date.toISOString().split('T')[0]
            const smokesOnDay = userLogs.filter(l =>
                l.habit_type === 'smoke' &&
                l.timestamp.startsWith(dateStr)
            ).length

            if (smokesOnDay === 0 && i > 0) {
                smokeFreeStreak++
            } else if (smokesOnDay > 0 && i > 0) {
                break
            }
        }

        const smokesAvoided = Math.max(0, BASELINE_SMOKES_PER_DAY - smokesToday)
        const moneySaved = smokesAvoided * COST_PER_SMOKE

        const homeMealsThisWeek = userLogs.filter(l =>
            l.habit_type === 'home_meal' &&
            new Date(l.timestamp) >= weekStart
        ).length

        const junkFoodSpendThisMonth = userLogs
            .filter(l =>
                l.habit_type === 'junk_food' &&
                new Date(l.timestamp) >= monthStart
            )
            .reduce((sum, l) => sum + (l.cost_rupees || 0), 0)

        return {
            smokeFreeStreak,
            moneySaved,
            homeMealsThisWeek,
            junkFoodSpendThisMonth,
            smokesToday,
            dailyBaseline: BASELINE_SMOKES_PER_DAY
        }
    }, [])

    const fetchLogs = useCallback(async () => {
        if (!user) return
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('habit_logs')
                .select('*')
                .eq('user_id', user.id)
                .order('timestamp', { ascending: false })

            if (error) throw error
            if (data) {
                const fetchedLogs = data as HabitLog[]
                setLogs(fetchedLogs)
                setStats(calculateStats(fetchedLogs))
            }
        } catch (err) {
            console.error('Error fetching habit logs:', err)
        } finally {
            setLoading(false)
        }
    }, [user, calculateStats])

    useEffect(() => {
        fetchLogs()
    }, [fetchLogs])

    const logHabit = async (
        type: HabitType,
        options?: {
            triggerReason?: string
            cost?: number
            restaurantName?: string
            notes?: string
        }
    ) => {
        if (!user) throw new Error('Not logged in')

        const { error } = await supabase
            .from('habit_logs')
            .insert({
                user_id: user.id,
                habit_type: type,
                trigger_reason: options?.triggerReason || null,
                cost_rupees: options?.cost || null,
                restaurant_name: options?.restaurantName || null,
                notes: options?.notes || null
            })

        if (error) throw error
        await fetchLogs()
    }

    return { logs, loading, stats, logHabit }
}
