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
