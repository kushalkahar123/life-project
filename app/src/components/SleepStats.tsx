import type { SleepLog } from '../types/sleep'

interface Props {
    logs: SleepLog[]
    streak: number
    loading?: boolean
}

const styles = {
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
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
        fontSize: '0.875rem',
        color: '#9ca3af',
    } as React.CSSProperties,
}

export function SleepStats({ logs, streak, loading }: Props) {
    if (loading) {
        return (
            <div style={styles.grid}>
                <div style={styles.card('rgba(255,255,255,0.05)')}>
                    <p style={styles.label}>Loading...</p>
                </div>
            </div>
        )
    }

    const last7Days = logs.slice(0, 7)
    const avgDuration = last7Days.length > 0
        ? Math.round(last7Days.reduce((sum, log) => sum + (log.sleep_duration_minutes || 0), 0) / last7Days.length / 60 * 10) / 10
        : 0
    const onScheduleCount = last7Days.filter(log => log.on_schedule).length

    return (
        <div style={styles.grid}>
            <div style={styles.card('linear-gradient(135deg, rgba(249,115,22,0.2), rgba(220,38,38,0.2))')}>
                <div style={styles.icon}>🔥</div>
                <p style={styles.value}>{streak}</p>
                <p style={styles.label}>Day Streak</p>
            </div>

            <div style={styles.card('linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.2))')}>
                <div style={styles.icon}>⏰</div>
                <p style={styles.value}>{avgDuration}h</p>
                <p style={styles.label}>Avg Sleep</p>
            </div>

            <div style={styles.card('linear-gradient(135deg, rgba(34,197,94,0.2), rgba(16,185,129,0.2))')}>
                <div style={styles.icon}>📈</div>
                <p style={styles.value}>{onScheduleCount}/7</p>
                <p style={styles.label}>On Schedule</p>
            </div>
        </div>
    )
}
