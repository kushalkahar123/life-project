export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface Meal {
    id: string
    user_id: string
    date: string
    meal_type: MealType
    home_or_out: 'home' | 'out'
    calories: number | null
    protein_g: number | null
    carbs_g: number | null
    fats_g: number | null
    description: string | null
    notes: string | null
}

export type WorkoutType = 'cardio' | 'strength' | 'yoga' | 'walk' | 'joint_activity' | 'rest'

export interface Workout {
    id: string
    user_id: string
    date: string
    workout_type: WorkoutType
    duration_min: number
    intensity: 'light' | 'moderate' | 'intense'
    notes: string | null
}

export interface NutritionStats {
    mealsLoggedToday: number
    homeMealsToday: number
    avgCaloriesThisWeek: number
    avgProteinThisWeek: number
}

export interface ExerciseStats {
    workoutsThisWeek: number
    totalMinutesThisWeek: number
    currentStreak: number
    weeklyGoalMet: boolean // 5 workouts per week
}
