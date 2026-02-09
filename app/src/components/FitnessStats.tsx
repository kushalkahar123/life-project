import type { NutritionStats, ExerciseStats } from '../types/nutrition'

interface Props {
    nutritionStats: NutritionStats
    exerciseStats: ExerciseStats
    loading?: boolean
}

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '1rem',
    },
    section: {
        marginBottom: '0.5rem',
    } as React.CSSProperties,
    sectionTitle: {
        fontSize: '0.875rem',
        color: '#9ca3af',
        marginBottom: '0.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
    } as React.CSSProperties,
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '0.75rem',
    } as React.CSSProperties,
    card: (gradient: string) => ({
        background: gradient,
        borderRadius: '0.75rem',
        padding: '1rem',
        textAlign: 'center' as const,
        border: '1px solid rgba(255,255,255,0.1)',
    }),
    icon: {
        marginBottom: '0.25rem',
        fontSize: '1.5rem',
    } as React.CSSProperties,
    value: {
        fontSize: '1.5rem',
        fontWeight: 'bold',
        color: '#fff',
    } as React.CSSProperties,
    label: {
        fontSize: '0.625rem',
        color: '#9ca3af',
    } as React.CSSProperties,
    weeklyProgress: {
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '0.75rem',
        padding: '1rem',
        border: '1px solid rgba(255,255,255,0.1)',
    } as React.CSSProperties,
    progressBar: {
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '9999px',
        height: '8px',
        marginTop: '0.5rem',
        overflow: 'hidden',
    } as React.CSSProperties,
    progressFill: (percent: number, color: string) => ({
        width: `${Math.min(100, percent)}%`,
        height: '100%',
        background: `linear-gradient(90deg, ${color}, ${color}aa)`,
        borderRadius: '9999px',
        transition: 'width 0.5s ease',
    }),
}

export function FitnessStats({ nutritionStats, exerciseStats, loading }: Props) {
    if (loading) {
        return <div style={{ color: '#9ca3af', textAlign: 'center', padding: '1rem' }}>Loading...</div>
    }

    const weeklyProgress = (exerciseStats.workoutsThisWeek / 5) * 100

    return (
        <div style={styles.container}>
            {/* Nutrition Stats */}
            <div style={styles.section}>
                <p style={styles.sectionTitle}>🍽️ Today's Nutrition</p>
                <div style={styles.grid}>
                    <div style={styles.card('linear-gradient(135deg, rgba(139,92,246,0.2), rgba(99,102,241,0.2))')}>
                        <div style={styles.icon}>🥗</div>
                        <p style={styles.value}>{nutritionStats.mealsLoggedToday}</p>
                        <p style={styles.label}>Meals Today</p>
                    </div>
                    <div style={styles.card('linear-gradient(135deg, rgba(34,197,94,0.2), rgba(16,185,129,0.2))')}>
                        <div style={styles.icon}>🏠</div>
                        <p style={styles.value}>{nutritionStats.homeMealsToday}</p>
                        <p style={styles.label}>Home Meals</p>
                    </div>
                    <div style={styles.card('linear-gradient(135deg, rgba(251,191,36,0.2), rgba(245,158,11,0.2))')}>
                        <div style={styles.icon}>🔥</div>
                        <p style={styles.value}>{nutritionStats.avgCaloriesThisWeek || '-'}</p>
                        <p style={styles.label}>Avg Calories</p>
                    </div>
                    <div style={styles.card('linear-gradient(135deg, rgba(239,68,68,0.2), rgba(220,38,38,0.2))')}>
                        <div style={styles.icon}>💪</div>
                        <p style={styles.value}>{nutritionStats.avgProteinThisWeek || '-'}g</p>
                        <p style={styles.label}>Avg Protein</p>
                    </div>
                </div>
            </div>

            {/* Exercise Stats */}
            <div style={styles.section}>
                <p style={styles.sectionTitle}>🏋️ Exercise Progress</p>
                <div style={styles.grid}>
                    <div style={styles.card('linear-gradient(135deg, rgba(34,197,94,0.2), rgba(16,185,129,0.2))')}>
                        <div style={styles.icon}>🔥</div>
                        <p style={styles.value}>{exerciseStats.currentStreak}</p>
                        <p style={styles.label}>Day Streak</p>
                    </div>
                    <div style={styles.card('linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.2))')}>
                        <div style={styles.icon}>⏱️</div>
                        <p style={styles.value}>{exerciseStats.totalMinutesThisWeek}</p>
                        <p style={styles.label}>Minutes This Week</p>
                    </div>
                </div>
            </div>

            {/* Weekly Goal Progress */}
            <div style={styles.weeklyProgress}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#fff', fontWeight: '600' }}>
                        Weekly Goal {exerciseStats.weeklyGoalMet ? '✅' : ''}
                    </span>
                    <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                        {exerciseStats.workoutsThisWeek}/5 workouts
                    </span>
                </div>
                <div style={styles.progressBar}>
                    <div style={styles.progressFill(weeklyProgress, '#22c55e')} />
                </div>
            </div>
        </div>
    )
}
