import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import type { SleepLog } from '../types/sleep'
import type { HabitLog } from '../types/habit'
import type { Meal, Workout } from '../types/nutrition'

interface PartnerProfile {
    id: string
    display_name: string
    email: string
}

interface PartnerData {
    profile: PartnerProfile | null
    todaySleep: SleepLog | null
    todayHabits: HabitLog[]
    todayMeals: Meal[]
    todayWorkouts: Workout[]
    smokeFreeStreak: number
    sleepStreak: number
}

export function usePartner() {
    const { user } = useAuth()
    const [partnerData, setPartnerData] = useState<PartnerData>({
        profile: null,
        todaySleep: null,
        todayHabits: [],
        todayMeals: [],
        todayWorkouts: [],
        smokeFreeStreak: 0,
        sleepStreak: 0
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchPartnerData = useCallback(async () => {
        if (!user) return
        setLoading(true)
        setError(null)

        try {
            // Get current user's profile to find partner_id
            const { data: myProfile } = await supabase
                .from('profiles')
                .select('partner_id')
                .eq('id', user.id)
                .single()

            if (!myProfile?.partner_id) {
                setLoading(false)
                return
            }

            const partnerId = myProfile.partner_id
            const today = new Date().toISOString().split('T')[0]

            // Fetch partner profile and today's data in parallel
            const [profileRes, sleepRes, habitsRes, mealsRes, workoutsRes] = await Promise.all([
                supabase.from('profiles').select('id, display_name, email').eq('id', partnerId).single(),
                supabase.from('sleep_logs').select('*').eq('user_id', partnerId).eq('date', today).single(),
                supabase.from('habit_logs').select('*').eq('user_id', partnerId).gte('timestamp', today),
                supabase.from('meals').select('*').eq('user_id', partnerId).eq('date', today),
                supabase.from('workouts').select('*').eq('user_id', partnerId).eq('date', today)
            ])

            // Calculate partner's smoke-free streak
            const { data: habitLogs } = await supabase
                .from('habit_logs')
                .select('timestamp, habit_type')
                .eq('user_id', partnerId)
                .eq('habit_type', 'smoke')
                .order('timestamp', { ascending: false })
                .limit(1)

            let smokeFreeStreak = 0
            if (habitLogs && habitLogs.length > 0) {
                const lastSmoke = new Date(habitLogs[0].timestamp)
                const now = new Date()
                smokeFreeStreak = Math.floor((now.getTime() - lastSmoke.getTime()) / (1000 * 60 * 60 * 24))
            } else {
                smokeFreeStreak = 30 // Assume 30+ days if no smoking records
            }

            // Calculate partner's sleep streak
            const { data: sleepLogs } = await supabase
                .from('sleep_logs')
                .select('date, on_schedule')
                .eq('user_id', partnerId)
                .order('date', { ascending: false })
                .limit(30)

            let sleepStreak = 0
            if (sleepLogs) {
                for (const log of sleepLogs) {
                    if (log.on_schedule) {
                        sleepStreak++
                    } else {
                        break
                    }
                }
            }

            setPartnerData({
                profile: profileRes.data as PartnerProfile | null,
                todaySleep: sleepRes.data as SleepLog | null,
                todayHabits: (habitsRes.data || []) as HabitLog[],
                todayMeals: (mealsRes.data || []) as Meal[],
                todayWorkouts: (workoutsRes.data || []) as Workout[],
                smokeFreeStreak,
                sleepStreak
            })
        } catch (err) {
            console.error('Error fetching partner data:', err)
            setError('Failed to load partner data')
        } finally {
            setLoading(false)
        }
    }, [user])

    useEffect(() => {
        fetchPartnerData()
    }, [fetchPartnerData])

    return { partnerData, loading, error, refetch: fetchPartnerData }
}
