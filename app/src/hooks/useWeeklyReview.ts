import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface WeeklyReviewData {
    id: string
    user_id: string
    week_start: string
    wins: string
    struggles: string
    next_week_focus: string
    rating: number
    stats: {
        sleepOnTimeCount: number
        smokeFreeCount: number
        workoutsCount: number
        mealsLoggedCount: number
    }
    created_at: string
}

interface WeekStats {
    sleepOnTimeCount: number
    smokeFreeCount: number
    workoutsCount: number
    mealsLoggedCount: number
}

export function useWeeklyReview() {
    const { user } = useAuth()
    const [reviews, setReviews] = useState<WeeklyReviewData[]>([])
    const [loading, setLoading] = useState(true)
    const [showReviewPrompt, setShowReviewPrompt] = useState(false)
    const [weekStats, setWeekStats] = useState<WeekStats>({
        sleepOnTimeCount: 0,
        smokeFreeCount: 0,
        workoutsCount: 0,
        mealsLoggedCount: 0
    })

    // Calculate week boundaries
    const getWeekBoundaries = useCallback(() => {
        const now = new Date()
        const dayOfWeek = now.getDay() // 0 = Sunday

        // Week starts on Monday
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - ((dayOfWeek + 6) % 7))
        weekStart.setHours(0, 0, 0, 0)

        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        weekEnd.setHours(23, 59, 59, 999)

        return {
            weekStart: weekStart.toISOString().split('T')[0],
            weekEnd: weekEnd.toISOString().split('T')[0],
            isSunday: dayOfWeek === 0,
            isEvening: now.getHours() >= 18
        }
    }, [])

    // Fetch week stats
    const fetchWeekStats = useCallback(async () => {
        if (!user?.id) return

        const { weekStart, weekEnd } = getWeekBoundaries()

        // Fetch sleep logs for the week
        const { data: sleepLogs } = await supabase
            .from('sleep_logs')
            .select('on_schedule')
            .eq('user_id', user.id)
            .gte('date', weekStart)
            .lte('date', weekEnd)

        // Fetch habit logs (check for smoke entries)
        const { data: habitLogs } = await supabase
            .from('habit_logs')
            .select('habit_type, timestamp')
            .eq('user_id', user.id)
            .gte('timestamp', weekStart)
            .lte('timestamp', weekEnd + 'T23:59:59')

        // Fetch workouts
        const { data: workouts } = await supabase
            .from('workouts')
            .select('id')
            .eq('user_id', user.id)
            .gte('date', weekStart)
            .lte('date', weekEnd)

        // Fetch meals
        const { data: meals } = await supabase
            .from('meals')
            .select('id')
            .eq('user_id', user.id)
            .gte('date', weekStart)
            .lte('date', weekEnd)

        // Calculate smoke-free days
        const datesWithSmoke = new Set(
            habitLogs?.filter(h => h.habit_type === 'smoke')
                .map(h => new Date(h.timestamp).toISOString().split('T')[0]) || []
        )

        // Generate all days of the week
        const allDays: string[] = []
        const start = new Date(weekStart)
        for (let i = 0; i < 7; i++) {
            const d = new Date(start)
            d.setDate(start.getDate() + i)
            if (d <= new Date()) {
                allDays.push(d.toISOString().split('T')[0])
            }
        }

        const smokeFreeCount = allDays.filter(d => !datesWithSmoke.has(d)).length

        setWeekStats({
            sleepOnTimeCount: sleepLogs?.filter(l => l.on_schedule).length || 0,
            smokeFreeCount,
            workoutsCount: workouts?.length || 0,
            mealsLoggedCount: meals?.length || 0
        })
    }, [user?.id, getWeekBoundaries])

    // Check if we should show review prompt
    const checkReviewPrompt = useCallback(async () => {
        if (!user?.id) return

        const { weekStart, isSunday, isEvening } = getWeekBoundaries()

        // Only show on Sunday evening
        if (!isSunday || !isEvening) {
            setShowReviewPrompt(false)
            return
        }

        // Check if already reviewed this week
        const { data: existingReview } = await supabase
            .from('weekly_reviews')
            .select('id')
            .eq('user_id', user.id)
            .eq('week_start', weekStart)
            .single()

        if (!existingReview) {
            await fetchWeekStats()
            setShowReviewPrompt(true)
        }
    }, [user?.id, getWeekBoundaries, fetchWeekStats])

    // Submit review
    const submitReview = useCallback(async (review: {
        wins: string
        struggles: string
        nextWeekFocus: string
        rating: number
    }) => {
        if (!user?.id) return

        const { weekStart } = getWeekBoundaries()

        const { error } = await supabase
            .from('weekly_reviews')
            .insert({
                user_id: user.id,
                week_start: weekStart,
                wins: review.wins,
                struggles: review.struggles,
                next_week_focus: review.nextWeekFocus,
                rating: review.rating,
                stats: weekStats
            })

        if (!error) {
            setShowReviewPrompt(false)
            // Refresh reviews list
            fetchReviews()
        }

        return { error }
    }, [user?.id, getWeekBoundaries, weekStats])

    // Fetch past reviews
    const fetchReviews = useCallback(async () => {
        if (!user?.id) return

        setLoading(true)
        const { data } = await supabase
            .from('weekly_reviews')
            .select('*')
            .eq('user_id', user.id)
            .order('week_start', { ascending: false })
            .limit(10)

        setReviews(data || [])
        setLoading(false)
    }, [user?.id])

    // Initialize
    useEffect(() => {
        if (user?.id) {
            fetchReviews()
            checkReviewPrompt()
        }
    }, [user?.id, fetchReviews, checkReviewPrompt])

    return {
        reviews,
        loading,
        showReviewPrompt,
        weekStats,
        submitReview,
        dismissReview: () => setShowReviewPrompt(false),
        forceShowReview: async () => {
            await fetchWeekStats()
            setShowReviewPrompt(true)
        }
    }
}
