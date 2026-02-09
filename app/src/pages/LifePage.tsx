import { useAuth } from '../contexts/AuthContext'
import { useSleepLogs } from '../hooks/useSleepLogs'
import { useHabitLogs } from '../hooks/useHabitLogs'
import { useMeals } from '../hooks/useMeals'
import { useWorkouts } from '../hooks/useWorkouts'
import { useMilestones } from '../hooks/useMilestones'

import { SummaryDashboard } from '../components/SummaryDashboard'
import { TravelPlanner } from '../components/TravelPlanner'
import { MilestoneTracker } from '../components/MilestoneTracker'

const styles = {
    container: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #020617 0%, #1e1b4b 100%)',
        color: '#fff',
        paddingBottom: '5rem',
    } as React.CSSProperties,
    wrapper: {
        maxWidth: '640px',
        margin: '0 auto',
        padding: '1.5rem',
    } as React.CSSProperties,
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
    } as React.CSSProperties,
    title: {
        fontSize: '1.5rem',
        fontWeight: 'bold',
    } as React.CSSProperties,
    subtitle: {
        color: '#9ca3af',
        fontSize: '0.875rem',
    } as React.CSSProperties,
    logoutBtn: {
        padding: '0.5rem',
        background: 'rgba(255,255,255,0.1)',
        border: 'none',
        borderRadius: '0.5rem',
        color: '#9ca3af',
        cursor: 'pointer',
    } as React.CSSProperties,
    sectionTitle: {
        marginTop: '2rem',
        marginBottom: '1rem',
        fontSize: '1.125rem',
        fontWeight: '600',
    } as React.CSSProperties,
}

export function LifePage() {
    const { signOut } = useAuth()
    const { logs: sleepLogs, loading: sleepLoading } = useSleepLogs()
    const { stats: habitStats, loading: habitLoading } = useHabitLogs()
    const { stats: nutritionStats, loading: mealsLoading } = useMeals()
    const { stats: exerciseStats, loading: workoutsLoading } = useWorkouts()
    const { milestones, toggleMilestoneTask, loading: milestonesLoading } = useMilestones()

    const loading = sleepLoading || habitLoading || mealsLoading || workoutsLoading || milestonesLoading

    return (
        <div style={styles.container}>
            <div style={styles.wrapper}>
                <div style={styles.header}>
                    <div>
                        <h1 style={styles.title}>🏠 Our Life Dashboard</h1>
                        <p style={styles.subtitle}>Unified Overview & Milestones</p>
                    </div>
                    <button onClick={signOut} style={styles.logoutBtn} title="Sign Out">
                        🚪
                    </button>
                </div>

                <SummaryDashboard
                    sleepLogs={sleepLogs}
                    habitStats={habitStats}
                    nutritionStats={nutritionStats}
                    exerciseStats={exerciseStats}
                    loading={loading}
                />

                <h2 style={styles.sectionTitle}>🗺️ Travel & Outings</h2>
                <TravelPlanner />

                <h2 style={styles.sectionTitle}>🏆 Long-term Milestones</h2>
                <MilestoneTracker
                    milestones={milestones}
                    onToggle={toggleMilestoneTask}
                />
            </div>
        </div>
    )
}
