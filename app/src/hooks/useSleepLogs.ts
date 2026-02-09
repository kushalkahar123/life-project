import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import type { SleepLog } from '../types/sleep'

export type { SleepLog } from '../types/sleep'

export function useSleepLogs() {
    const { user } = useAuth()
    const [logs, setLogs] = useState<SleepLog[]>([])
    const [loading, setLoading] = useState(true)
    const [streak, setStreak] = useState(0)

    const calculateStreak = useCallback((allLogs: SleepLog[]) => {
        let streakCount = 0
        const today = new Date()
        for (let i = 0; i < 30; i++) {
            const date = new Date(today)
            date.setDate(date.getDate() - i)
            const dateStr = date.toISOString().split('T')[0]
            const log = allLogs.find(l => l.date === dateStr)
            if (log?.on_schedule) {
                streakCount++
            } else if (i > 0) {
                break
            }
        }
        return streakCount
    }, [])

    const fetchLogs = useCallback(async () => {
        if (!user) return
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('sleep_logs')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false })

            if (error) throw error
            if (data) {
                const fetchedLogs = data as SleepLog[]
                setLogs(fetchedLogs)
                setStreak(calculateStreak(fetchedLogs))
            }
        } catch (err) {
            console.error('Error fetching sleep logs:', err)
        } finally {
            setLoading(false)
        }
    }, [user, calculateStreak])

    useEffect(() => {
        fetchLogs()
    }, [fetchLogs])

    const logSleep = async (bedtime: string, wakeTime: string, quality: number) => {
        if (!user) throw new Error('Not logged in')

        const today = new Date().toISOString().split('T')[0]

        // Calculate duration
        const bedParts = bedtime.split(':').map(Number)
        const wakeParts = wakeTime.split(':').map(Number)

        let bedMinutes = bedParts[0] * 60 + bedParts[1]
        let wakeMinutes = wakeParts[0] * 60 + wakeParts[1]

        if (wakeMinutes < bedMinutes) {
            wakeMinutes += 24 * 60
        }

        const durationMinutes = wakeMinutes - bedMinutes

        // Supabase schema has on_schedule as a generated column based on bedtime_target (23:00)
        // but we'll manually check for streak calculation if needed.
        // The schema actually uses INTERVAL '15 minutes' added to target.

        const { error } = await supabase
            .from('sleep_logs')
            .upsert({
                user_id: user.id,
                date: today,
                bedtime_actual: bedtime,
                wake_actual: wakeTime,
                sleep_duration_minutes: durationMinutes,
                quality_score: quality,
                notes: null
            }, { onConflict: 'user_id,date' })

        if (error) throw error
        await fetchLogs()
    }

    return { logs, loading, streak, logSleep }
}
