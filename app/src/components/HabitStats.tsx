import type { HabitStats as HabitStatsType } from '../types/habit'

interface Props {
    stats: HabitStatsType
    loading?: boolean
}

const styles = {
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '1rem',
    } as React.CSSProperties,
    card: (gradient: string) => ({
        background: gradient,
        borderRadius: '0.75rem',
        padding: '1rem',
        textAlign: 'center' as const,
        border: '1px solid rgba(255,255,255,0.1)',
    }),
    icon: {
        marginBottom: '0.5rem',
        fontSize: '1.75rem',
    } as React.CSSProperties,
    value: {
        fontSize: '1.875rem',
        fontWeight: 'bold',
        color: '#fff',
    } as React.CSSProperties,
    label: {
        fontSize: '0.75rem',
        color: '#9ca3af',
    } as React.CSSProperties,
    subtext: {
        fontSize: '0.625rem',
        color: '#6b7280',
        marginTop: '0.25rem',
    } as React.CSSProperties,
}

export function HabitStats({ stats, loading }: Props) {
    if (loading) {
        return (
            <div style={styles.grid}>
                <div style={styles.card('rgba(255,255,255,0.05)')}>
                    <p style={styles.label}>Loading...</p>
                </div>
            </div>
        )
    }

    return (
        <div style={styles.grid}>
            {/* Smoke-free streak */}
            <div style={styles.card('linear-gradient(135deg, rgba(34,197,94,0.2), rgba(16,185,129,0.2))')}>
                <div style={styles.icon}>🚭</div>
                <p style={styles.value}>{stats.smokeFreeStreak}</p>
                <p style={styles.label}>Smoke-Free Days</p>
                <p style={styles.subtext}>Today: {stats.smokesToday}/{stats.dailyBaseline}</p>
            </div>

            {/* Money Saved */}
            <div style={styles.card('linear-gradient(135deg, rgba(251,191,36,0.2), rgba(245,158,11,0.2))')}>
                <div style={styles.icon}>💰</div>
                <p style={styles.value}>₹{stats.moneySaved}</p>
                <p style={styles.label}>Saved Today</p>
                <p style={styles.subtext}>₹30 per avoided</p>
            </div>

            {/* Home Meals */}
            <div style={styles.card('linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.2))')}>
                <div style={styles.icon}>🏠</div>
                <p style={styles.value}>{stats.homeMealsThisWeek}</p>
                <p style={styles.label}>Home Meals</p>
                <p style={styles.subtext}>This week</p>
            </div>

            {/* Junk Food Spend */}
            <div style={styles.card('linear-gradient(135deg, rgba(249,115,22,0.2), rgba(220,38,38,0.2))')}>
                <div style={styles.icon}>🍔</div>
                <p style={styles.value}>₹{stats.junkFoodSpendThisMonth}</p>
                <p style={styles.label}>Eating Out</p>
                <p style={styles.subtext}>This month</p>
            </div>
        </div>
    )
}
