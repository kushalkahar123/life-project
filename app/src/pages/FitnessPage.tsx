import { useAuth } from '../contexts/AuthContext'
import { useMeals } from '../hooks/useMeals'
import { useWorkouts } from '../hooks/useWorkouts'
import { FitnessStats } from '../components/FitnessStats'
import { MealLogger } from '../components/MealLogger'
import { WorkoutLogger } from '../components/WorkoutLogger'
import { MacroSummary } from '../components/MacroSummary'
import type { Meal, Workout } from '../types/nutrition'

const styles = {
    container: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #111827 0%, #064e3b 50%, #111827 100%)',
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
        marginTop: '1.5rem',
        marginBottom: '1rem',
        fontSize: '1.125rem',
        fontWeight: '600',
    } as React.CSSProperties,
    card: {
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '0.75rem',
        padding: '1rem',
        border: '1px solid rgba(255,255,255,0.1)',
    } as React.CSSProperties,
    logItem: {
        padding: '0.75rem',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '0.5rem',
        marginBottom: '0.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    } as React.CSSProperties,
    badge: (color: string) => ({
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.25rem 0.5rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        background: `rgba(${color}, 0.2)`,
    }),
    logTime: {
        color: '#9ca3af',
        fontSize: '0.75rem',
    } as React.CSSProperties,
}

const mealEmojis: Record<string, string> = {
    breakfast: '🌅',
    lunch: '☀️',
    dinner: '🌙',
    snack: '🍎',
}

const workoutEmojis: Record<string, string> = {
    cardio: '🏃',
    strength: '💪',
    yoga: '🧘',
    walk: '🚶',
    joint_activity: '👫',
    rest: '😴',
}

export function FitnessPage() {
    const { signOut } = useAuth()
    const { meals, loading: mealsLoading, stats: nutritionStats, logMeal, todayMacros } = useMeals()
    const { workouts, loading: workoutsLoading, stats: exerciseStats, logWorkout } = useWorkouts()

    const loading = mealsLoading || workoutsLoading

    // Combine and sort recent activity
    const recentActivity = [
        ...meals.slice(0, 5).map(m => ({ ...m, type: 'meal' as const })),
        ...workouts.slice(0, 5).map(w => ({ ...w, type: 'workout' as const })),
    ].sort((a, b) => {
        const dateA = 'date' in a ? a.date : ''
        const dateB = 'date' in b ? b.date : ''
        return dateB.localeCompare(dateA)
    }).slice(0, 8)

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    }

    return (
        <div style={styles.container}>
            <div style={styles.wrapper}>
                <div style={styles.header}>
                    <div>
                        <h1 style={styles.title}>🏃 Life Project</h1>
                        <p style={styles.subtitle}>Phase 3: Nutrition & Exercise</p>
                    </div>
                    <button onClick={signOut} style={styles.logoutBtn} title="Sign Out">
                        🚪
                    </button>
                </div>

                <MacroSummary
                    current={todayMacros}
                    targets={{ calories: 2100, protein: 150, carbs: 250, fats: 70 }}
                    loading={loading}
                />

                <FitnessStats
                    nutritionStats={nutritionStats}
                    exerciseStats={exerciseStats}
                    loading={loading}
                />

                <h2 style={styles.sectionTitle}>Log Meal</h2>
                <MealLogger onLog={logMeal} />

                <h2 style={styles.sectionTitle}>Log Workout</h2>
                <WorkoutLogger onLog={logWorkout} />

                <h2 style={styles.sectionTitle}>Recent Activity</h2>
                <div style={styles.card}>
                    {loading ? (
                        <p style={{ color: '#9ca3af' }}>Loading...</p>
                    ) : recentActivity.length === 0 ? (
                        <p style={{ color: '#9ca3af', textAlign: 'center', padding: '1rem' }}>
                            No activity yet. Start logging!
                        </p>
                    ) : (
                        recentActivity.map((item, idx) => (
                            <div key={idx} style={styles.logItem}>
                                <div>
                                    {item.type === 'meal' ? (
                                        <>
                                            <span style={styles.badge('139,92,246')}>
                                                {mealEmojis[(item as Meal).meal_type]} {(item as Meal).meal_type}
                                            </span>
                                            {(item as Meal).description && (
                                                <span style={{ marginLeft: '0.5rem', color: '#9ca3af', fontSize: '0.75rem' }}>
                                                    {(item as Meal).description}
                                                </span>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <span style={styles.badge('34,197,94')}>
                                                {workoutEmojis[(item as Workout).workout_type]} {(item as Workout).workout_type}
                                            </span>
                                            <span style={{ marginLeft: '0.5rem', color: '#9ca3af', fontSize: '0.75rem' }}>
                                                {(item as Workout).duration_min}min
                                            </span>
                                        </>
                                    )}
                                </div>
                                <div style={styles.logTime}>{formatDate(item.date)}</div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
