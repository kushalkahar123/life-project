import type { SleepLog } from '../types/sleep'
import type { HabitStats } from '../types/habit'
import type { NutritionStats, ExerciseStats } from '../types/nutrition'

interface Props {
    sleepLogs: SleepLog[]
    habitStats: HabitStats
    nutritionStats: NutritionStats
    exerciseStats: ExerciseStats
    loading?: boolean
}

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '1.5rem',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '1rem',
    } as React.CSSProperties,
    heroCard: {
        background: 'linear-gradient(135deg, #4c1d95 0%, #1e1b4b 100%)',
        borderRadius: '1rem',
        padding: '1.5rem',
        border: '1px solid rgba(255,255,255,0.1)',
        textAlign: 'center' as const,
    } as React.CSSProperties,
    card: {
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '0.75rem',
        padding: '1rem',
        border: '1px solid rgba(255,255,255,0.1)',
    } as React.CSSProperties,
    bigValue: {
        fontSize: '2.5rem',
        fontWeight: 'bold',
        color: '#fff',
    } as React.CSSProperties,
    label: {
        fontSize: '0.875rem',
        color: '#9ca3af',
        marginTop: '0.5rem',
    } as React.CSSProperties,
    statRow: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '0.5rem 0',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
    } as React.CSSProperties,
    insight: {
        fontSize: '0.75rem',
        color: '#a78bfa',
        fontStyle: 'italic',
        marginTop: '0.5rem',
    } as React.CSSProperties,
}

export function SummaryDashboard({ sleepLogs, habitStats, nutritionStats, exerciseStats, loading }: Props) {
    if (loading) return <div style={{ color: '#fff' }}>Loading Overview...</div>

    const currentSleepStreak = sleepLogs.length > 0 ? 1 : 0 // Simplified calculation for now

    return (
        <div style={styles.container}>
            <div style={styles.heroCard}>
                <p style={styles.label}>Couple Combined Streak</p>
                <p style={styles.bigValue}>🔥 {Math.max(currentSleepStreak, exerciseStats.currentStreak)} Days</p>
                <p style={styles.insight}>Tip: You both sleep better after morning walks!</p>
            </div>

            <div style={styles.grid}>
                <div style={styles.card}>
                    <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>🌙 Sleep & Habits</p>
                    <div style={styles.statRow}>
                        <span style={styles.label}>Sleep Streak</span>
                        <span style={{ color: '#fff' }}>{currentSleepStreak}d</span>
                    </div>
                    <div style={styles.statRow}>
                        <span style={styles.label}>Smoke-free</span>
                        <span style={{ color: '#fff' }}>{habitStats.smokeFreeStreak}d</span>
                    </div>
                    <div style={styles.statRow}>
                        <span style={styles.label}>Savings</span>
                        <span style={{ color: '#22c55e' }}>₹{habitStats.moneySaved}</span>
                    </div>
                </div>

                <div style={styles.card}>
                    <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>💪 Fitness</p>
                    <div style={styles.statRow}>
                        <span style={styles.label}>Workouts</span>
                        <span style={{ color: '#fff' }}>{exerciseStats.workoutsThisWeek}/5</span>
                    </div>
                    <div style={styles.statRow}>
                        <span style={styles.label}>Protein Avg</span>
                        <span style={{ color: '#fff' }}>{nutritionStats.avgProteinThisWeek}g</span>
                    </div>
                    <div style={styles.statRow}>
                        <span style={styles.label}>Home Meals</span>
                        <span style={{ color: '#fff' }}>{nutritionStats.homeMealsToday}</span>
                    </div>
                </div>
            </div>

            <div style={styles.card}>
                <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>📈 Weight Progress</p>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden', marginTop: '1rem' }}>
                    <div style={{ width: '15%', height: '100%', background: '#8b5cf6' }}></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '0.5rem', color: '#9ca3af' }}>
                    <span>Initial (110kg)</span>
                    <span style={{ color: '#fff' }}>Current (108kg)</span>
                    <span>Target (85kg)</span>
                </div>
            </div>
        </div>
    )
}
