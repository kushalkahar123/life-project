export interface Trip {
    id: string
    household_id: string
    date: string
    destination: string
    type: 'day' | 'holiday'
    cost_rupees: number
    notes: string | null
    photos: string[]
}

export type MilestoneType = 'dog' | 'baby' | 'travel' | 'financial'

export interface Milestone {
    id: string
    household_id: string
    milestone_type: MilestoneType
    title: string
    target_date: string | null
    checklist: { task: string; completed: boolean }[]
    status: 'planned' | 'in_progress' | 'completed'
}

export interface SavingsGoal {
    id: string
    household_id: string
    goal_name: string
    target_amount: number
    current_amount: number
    deadline: string | null
}
