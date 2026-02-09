export type HabitType = 'smoke' | 'junk_food' | 'home_meal'

export interface HabitLog {
    id: string
    user_id: string
    habit_type: HabitType
    timestamp: string
    trigger_reason: string | null
    cost_rupees: number | null
    restaurant_name: string | null
    notes: string | null
}

export interface HabitStats {
    smokeFreeStreak: number
    moneySaved: number
    homeMealsThisWeek: number
    junkFoodSpendThisMonth: number
    smokesToday: number
    dailyBaseline: number // baseline smokes per day (default 3)
}
