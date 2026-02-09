import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import type { Trip, Milestone, SavingsGoal } from '../types/milestones'

export function useMilestones() {
    const { user } = useAuth()
    const [trips, setTrips] = useState<Trip[]>([])
    const [milestones, setMilestones] = useState<Milestone[]>([])
    const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([])
    const [loading, setLoading] = useState(true)

    const fetchAllData = useCallback(async () => {
        if (!user) return
        setLoading(true)
        try {
            // Get user's profile to find household_id
            const { data: profile } = await supabase
                .from('profiles')
                .select('household_id')
                .eq('id', user.id)
                .single()

            if (!profile?.household_id) {
                // If no household yet, we might need to create one or join one
                // For now, we'll assume a default one or leave it empty
                setLoading(false)
                return
            }

            const household_id = profile.household_id

            // Run queries in parallel
            const [tripsRes, milestonesRes, savingsRes] = await Promise.all([
                supabase.from('trips').select('*').eq('household_id', household_id).order('date', { ascending: false }),
                supabase.from('milestones').select('*').eq('household_id', household_id).order('created_at', { ascending: true }),
                supabase.from('savings_goals').select('*').eq('household_id', household_id).order('created_at', { ascending: true })
            ])

            if (tripsRes.data) setTrips(tripsRes.data as Trip[])
            if (milestonesRes.data) setMilestones(milestonesRes.data as Milestone[])
            if (savingsRes.data) setSavingsGoals(savingsRes.data as SavingsGoal[])

        } catch (err) {
            console.error('Error fetching life data:', err)
        } finally {
            setLoading(false)
        }
    }, [user])

    useEffect(() => {
        fetchAllData()
    }, [fetchAllData])

    const getHouseholdId = async () => {
        const { data } = await supabase.from('profiles').select('household_id').eq('id', user?.id).single()
        if (data?.household_id) return data.household_id

        // Create a household if none exists
        const { data: newHousehold } = await supabase.from('households').insert({ name: 'Our Home' }).select().single()
        if (newHousehold) {
            await supabase.from('profiles').update({ household_id: newHousehold.id }).eq('id', user?.id)
            return newHousehold.id
        }
        return null
    }

    const addTrip = async (trip: Omit<Trip, 'id' | 'household_id'>) => {
        const hId = await getHouseholdId()
        if (!hId) return

        const { error } = await supabase
            .from('trips')
            .insert({ ...trip, household_id: hId })

        if (error) throw error
        await fetchAllData()
    }

    const toggleMilestoneTask = async (milestoneId: string, taskIndex: number) => {
        const milestone = milestones.find(m => m.id === milestoneId)
        if (!milestone) return

        const newChecklist = [...milestone.checklist]
        newChecklist[taskIndex].completed = !newChecklist[taskIndex].completed

        const { error } = await supabase
            .from('milestones')
            .update({ checklist: newChecklist })
            .eq('id', milestoneId)

        if (error) throw error
        await fetchAllData()
    }

    const updateSavings = async (goalId: string, amount: number) => {
        const { error } = await supabase
            .from('savings_goals')
            .update({ current_amount: amount })
            .eq('id', goalId)

        if (error) throw error
        await fetchAllData()
    }

    return { trips, milestones, savingsGoals, loading, addTrip, toggleMilestoneTask, updateSavings }
}
