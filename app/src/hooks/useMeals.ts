import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import type { Meal, NutritionStats, MealType } from '../types/nutrition'

export function useMeals() {
    const { user } = useAuth()
    const [meals, setMeals] = useState<Meal[]>([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<NutritionStats>({
        mealsLoggedToday: 0,
        homeMealsToday: 0,
        avgCaloriesThisWeek: 0,
        avgProteinThisWeek: 0
    })

    const calculateStats = useCallback((userMeals: Meal[]): NutritionStats => {
        const today = new Date().toISOString().split('T')[0]
        const now = new Date()

        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay())
        weekStart.setHours(0, 0, 0, 0)

        const todayMeals = userMeals.filter(m => m.date === today)
        const mealsLoggedToday = todayMeals.length
        const homeMealsToday = todayMeals.filter(m => m.home_or_out === 'home').length

        const weekMeals = userMeals.filter(m => new Date(m.date) >= weekStart)
        const mealsWithCalories = weekMeals.filter(m => m.calories !== null)
        const mealsWithProtein = weekMeals.filter(m => m.protein_g !== null)

        const avgCaloriesThisWeek = mealsWithCalories.length > 0
            ? Math.round(mealsWithCalories.reduce((sum, m) => sum + (m.calories || 0), 0) / mealsWithCalories.length)
            : 0

        const avgProteinThisWeek = mealsWithProtein.length > 0
            ? Math.round(mealsWithProtein.reduce((sum, m) => sum + (m.protein_g || 0), 0) / mealsWithProtein.length)
            : 0

        return {
            mealsLoggedToday,
            homeMealsToday,
            avgCaloriesThisWeek,
            avgProteinThisWeek
        }
    }, [])

    const fetchMeals = useCallback(async () => {
        if (!user) return
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('meals')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false })

            if (error) throw error
            if (data) {
                const fetched = data as Meal[]
                setMeals(fetched)
                setStats(calculateStats(fetched))
            }
        } catch (err) {
            console.error('Error fetching meals:', err)
        } finally {
            setLoading(false)
        }
    }, [user, calculateStats])

    useEffect(() => {
        fetchMeals()
    }, [fetchMeals])

    const logMeal = async (
        mealType: MealType,
        homeOrOut: 'home' | 'out',
        options?: {
            calories?: number
            protein?: number
            carbs?: number
            fats?: number
            description?: string
            notes?: string
        }
    ) => {
        if (!user) throw new Error('Not logged in')

        const { error } = await supabase
            .from('meals')
            .insert({
                user_id: user.id,
                date: new Date().toISOString().split('T')[0],
                meal_type: mealType,
                home_or_out: homeOrOut,
                calories: options?.calories || null,
                protein_g: options?.protein || null,
                carbs_g: options?.carbs || null,
                fats_g: options?.fats || null,
                description: options?.description || null,
                notes: options?.notes || null
            })

        if (error) throw error
        await fetchMeals()
    }

    return { meals, loading, stats, logMeal }
}
