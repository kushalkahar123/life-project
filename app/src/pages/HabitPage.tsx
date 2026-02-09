import { useAuth } from '../contexts/AuthContext'
import { useHabitLogs } from '../hooks/useHabitLogs'
import { HabitLogger } from '../components/HabitLogger'
import { HabitStats } from '../components/HabitStats'
import { SavingsCounter } from '../components/SavingsCounter'
import { AchievementBadges } from '../components/AchievementBadges'
import { SmokingTaperPlan } from '../components/SmokingTaperPlan'
import type { HabitLog } from '../types/habit'

const styles = {
    container: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #111827 0%, #1e1b4b 50%, #111827 100%)',
        color: '#fff',
        paddingBottom: '5rem', // Space for bottom nav
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
        padding: '1.5rem',
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
    logType: (type: string) => ({
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.25rem 0.5rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        background: type === 'smoke' ? 'rgba(239,68,68,0.2)'
            : type === 'junk_food' ? 'rgba(249,115,22,0.2)'
                : 'rgba(34,197,94,0.2)',
        color: type === 'smoke' ? '#ef4444'
            : type === 'junk_food' ? '#f59e0b'
                : '#22c55e',
    }),
    logTime: {
        color: '#9ca3af',
        fontSize: '0.75rem',
    } as React.CSSProperties,
}

const typeEmojis: Record<string, string> = {
    smoke: '🚬',
    junk_food: '🍔',
    home_meal: '🏠',
}

const typeLabels: Record<string, string> = {
    smoke: 'Smoked',
    junk_food: 'Ate out',
    home_meal: 'Home meal',
}

export function HabitPage() {
    const { signOut } = useAuth()
    const { logs, loading, stats, logHabit } = useHabitLogs()

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp)
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    }

    const formatDate = (timestamp: string) => {
        const date = new Date(timestamp)
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    }

    // Compute achievements based on stats
    const achievements = [
        { id: '1', title: '1 Week Smoke-Free', emoji: '🚭', description: '7 days', unlocked: stats.smokeFreeStreak >= 7, progress: Math.min(stats.smokeFreeStreak, 7), target: 7 },
        { id: '2', title: '2 Weeks Smoke-Free', emoji: '💪', description: '14 days', unlocked: stats.smokeFreeStreak >= 14, progress: Math.min(stats.smokeFreeStreak, 14), target: 14 },
        { id: '3', title: '1 Month Smoke-Free', emoji: '🏆', description: '30 days', unlocked: stats.smokeFreeStreak >= 30, progress: Math.min(stats.smokeFreeStreak, 30), target: 30 },
        { id: '5', title: '₹1K Saved', emoji: '💰', description: 'Saved ₹1,000', unlocked: stats.moneySaved >= 1000, progress: Math.min(stats.moneySaved, 1000), target: 1000 },
        { id: '6', title: '₹5K Saved', emoji: '💎', description: 'Saved ₹5,000', unlocked: stats.moneySaved >= 5000, progress: Math.min(stats.moneySaved, 5000), target: 5000 },
        { id: '8', title: 'Home Chef', emoji: '👨‍🍳', description: '7 home meals', unlocked: stats.homeMealsThisWeek >= 7, progress: Math.min(stats.homeMealsThisWeek, 7), target: 7 },
    ]

    return (
        <div style={styles.container}>
            <div style={styles.wrapper}>
                <div style={styles.header}>
                    <div>
                        <h1 style={styles.title}>🎯 Life Project</h1>
                        <p style={styles.subtitle}>Phase 2: Habit Breaking</p>
                    </div>
                    <button onClick={signOut} style={styles.logoutBtn} title="Sign Out">
                        🚪
                    </button>
                </div>

                <HabitStats stats={stats} loading={loading} />

                <div style={{ marginTop: '1.5rem' }}>
                    <SavingsCounter
                        moneySaved={stats.moneySaved}
                        targetAmount={10000}
                        targetLabel="Workout Equipment"
                    />
                </div>

                <h2 style={styles.sectionTitle}>📉 Quit Plan</h2>
                <SmokingTaperPlan currentStreak={stats.smokeFreeStreak} />

                <h2 style={styles.sectionTitle}>Your Achievements</h2>
                <AchievementBadges achievements={achievements} />

                <h2 style={styles.sectionTitle}>Quick Log</h2>
                <HabitLogger onLog={logHabit} />

                <h2 style={styles.sectionTitle}>Recent Activity</h2>
                <div style={styles.card}>
                    {loading ? (
                        <p style={{ color: '#9ca3af' }}>Loading...</p>
                    ) : logs.length === 0 ? (
                        <p style={{ color: '#9ca3af', textAlign: 'center', padding: '1rem' }}>
                            No activity logged yet. Start tracking!
                        </p>
                    ) : (
                        logs.slice(0, 10).map((log: HabitLog) => (
                            <div key={log.id} style={styles.logItem}>
                                <div>
                                    <span style={styles.logType(log.habit_type)}>
                                        {typeEmojis[log.habit_type]} {typeLabels[log.habit_type]}
                                    </span>
                                    {log.cost_rupees && (
                                        <span style={{ marginLeft: '0.5rem', color: '#f59e0b', fontSize: '0.75rem' }}>
                                            ₹{log.cost_rupees}
                                        </span>
                                    )}
                                    {log.trigger_reason && (
                                        <span style={{ marginLeft: '0.5rem', color: '#9ca3af', fontSize: '0.75rem' }}>
                                            ({log.trigger_reason})
                                        </span>
                                    )}
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={styles.logTime}>{formatTime(log.timestamp)}</div>
                                    <div style={styles.logTime}>{formatDate(log.timestamp)}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
