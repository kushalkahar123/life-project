console.log('[Dashboard] Module starting...')

import { useAuth } from '../contexts/AuthContext'
import { useSleepLogs } from '../hooks/useSleepLogs'
import type { SleepLog } from '../types/sleep'
import { SleepLogger } from '../components/SleepLogger'
import { SleepStats } from '../components/SleepStats'
import { TrendChart } from '../components/TrendChart'
import { HealthImporter } from '../components/HealthImporter'

console.log('[Dashboard] All imports complete')

const styles = {
    container: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #111827 0%, #1e1b4b 50%, #111827 100%)',
        color: '#fff',
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
    logDate: {
        fontWeight: '500',
    } as React.CSSProperties,
    logDetails: {
        color: '#9ca3af',
        fontSize: '0.875rem',
    } as React.CSSProperties,
    badge: (good: boolean) => ({
        padding: '0.25rem 0.5rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        background: good ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
        color: good ? '#22c55e' : '#ef4444',
    }) as React.CSSProperties,
}

export function Dashboard() {
    console.log('[Dashboard] Rendering...')
    const { signOut } = useAuth()
    const { logs, loading, streak, logSleep, last30Days } = useSleepLogs()

    console.log('[Dashboard] Got hooks:', { logsCount: logs.length, loading, streak })

    const formatDuration = (minutes: number | null) => {
        if (minutes === null) return '-'
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return `${hours}h ${mins}m`
    }

    return (
        <div style={styles.container}>
            <div style={styles.wrapper}>
                <div style={styles.header}>
                    <div>
                        <h1 style={styles.title}>🌙 Life Project</h1>
                        <p style={styles.subtitle}>Phase 1: Sleep Discipline</p>
                    </div>
                    <button onClick={signOut} style={styles.logoutBtn} title="Sign Out">
                        🚪
                    </button>
                </div>

                <SleepStats streak={streak} logs={logs} loading={loading} />

                <h2 style={styles.sectionTitle}>30-Day Sleep Trend</h2>
                <TrendChart
                    data={last30Days}
                    label="Sleep Duration (hours)"
                    color="#8b5cf6"
                    targetValue={7}
                />

                <h2 style={styles.sectionTitle}>Log Tonight's Sleep</h2>
                <SleepLogger onLog={logSleep} />

                <h2 style={styles.sectionTitle}>Recent Logs</h2>
                <div style={styles.card}>
                    {loading ? (
                        <p style={{ color: '#9ca3af' }}>Loading...</p>
                    ) : logs.length === 0 ? (
                        <p style={{ color: '#9ca3af', textAlign: 'center', padding: '1rem' }}>
                            No sleep logs yet. Start tracking!
                        </p>
                    ) : (
                        logs.slice(0, 7).map((log: SleepLog) => (
                            <div key={log.id} style={styles.logItem}>
                                <div>
                                    <div style={styles.logDate}>
                                        {new Date(log.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </div>
                                    <div style={styles.logDetails}>
                                        🛏️ {log.bedtime_actual || '-'} → ⏰ {log.wake_actual || '-'} ({formatDuration(log.sleep_duration_minutes)})
                                    </div>
                                </div>
                                <span style={styles.badge(log.on_schedule)}>
                                    {log.on_schedule ? '✓ On time' : '✗ Late'}
                                </span>
                            </div>
                        ))
                    )}
                </div>

                <h2 style={styles.sectionTitle}>Import Data</h2>
                <HealthImporter />
            </div>
        </div>
    )
}
