import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import type { Workout, ExerciseStats, WorkoutType } from '../types/nutrition'

export function useWorkouts() {
    const { user } = useAuth()
    const [workouts, setWorkouts] = useState<Workout[]>([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<ExerciseStats>({
        workoutsThisWeek: 0,
        totalMinutesThisWeek: 0,
        currentStreak: 0,
        weeklyGoalMet: false
    })

    const calculateStats = useCallback((userWorkouts: Workout[]): ExerciseStats => {
        const now = new Date()
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay())
        weekStart.setHours(0, 0, 0, 0)

        const weekWorkouts = userWorkouts.filter(w =>
            new Date(w.date) >= weekStart && w.workout_type !== 'rest'
        )
        const workoutsThisWeek = weekWorkouts.length
        const totalMinutesThisWeek = weekWorkouts.reduce((sum, w) => sum + w.duration_min, 0)
        const weeklyGoalMet = workoutsThisWeek >= 5

        let currentStreak = 0
        for (let i = 0; i < 30; i++) {
            const date = new Date(now)
            date.setDate(date.getDate() - i)
            const dateStr = date.toISOString().split('T')[0]
            const hasWorkout = userWorkouts.some(w => w.date === dateStr && w.workout_type !== 'rest')

            if (hasWorkout) {
                currentStreak++
            } else if (i > 0) {
                const dayOfWeek = date.getDay()
                if (dayOfWeek !== 0) { // Sunday exception
                    break
                }
            }
        }

        return {
            workoutsThisWeek,
            totalMinutesThisWeek,
            currentStreak,
            weeklyGoalMet
        }
    }, [])

    const fetchWorkouts = useCallback(async () => {
        if (!user) return
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('workouts')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false })

            if (error) throw error
            if (data) {
                const fetched = data as Workout[]
                setWorkouts(fetched)
                setStats(calculateStats(fetched))
            }
        } catch (err) {
            console.error('Error fetching workouts:', err)
        } finally {
            setLoading(false)
        }
    }, [user, calculateStats])

    useEffect(() => {
        fetchWorkouts()
    }, [fetchWorkouts])

    const logWorkout = async (
        workoutType: WorkoutType,
        durationMin: number,
        intensity: 'light' | 'moderate' | 'intense',
        notes?: string
    ) => {
        if (!user) throw new Error('Not logged in')

        const { error } = await supabase
            .from('workouts')
            .insert({
                user_id: user.id,
                date: new Date().toISOString().split('T')[0],
                workout_type: workoutType,
                duration_min: durationMin,
                intensity,
                notes: notes || null
            })

        if (error) throw error
        await fetchWorkouts()
    }

    return { workouts, loading, stats, logWorkout }
}
