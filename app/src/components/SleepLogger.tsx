import { useState } from 'react'

interface Props {
    onLog: (bedtime: string, wakeTime: string, quality: number) => Promise<void>
}

const styles = {
    container: {
        background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.2) 100%)',
        borderRadius: '1rem',
        padding: '1.5rem',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.1)',
    } as React.CSSProperties,
    header: {
        fontSize: '1.25rem',
        fontWeight: 600,
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        color: '#fff',
    } as React.CSSProperties,
    grid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem',
        marginBottom: '1rem',
    } as React.CSSProperties,
    label: {
        display: 'block',
        fontSize: '0.875rem',
        color: '#9ca3af',
        marginBottom: '0.25rem',
    } as React.CSSProperties,
    input: {
        width: '100%',
        padding: '0.75rem',
        borderRadius: '0.5rem',
        border: '1px solid rgba(255,255,255,0.2)',
        background: 'rgba(255,255,255,0.1)',
        color: '#fff',
        fontSize: '1rem',
    } as React.CSSProperties,
    statusOk: {
        color: '#4ade80',
        fontSize: '0.875rem',
        marginTop: '0.25rem',
    } as React.CSSProperties,
    statusWarn: {
        color: '#fb923c',
        fontSize: '0.875rem',
        marginTop: '0.25rem',
    } as React.CSSProperties,
    slider: {
        width: '100%',
        height: '0.5rem',
        borderRadius: '0.25rem',
        appearance: 'none' as const,
        background: 'rgba(255,255,255,0.2)',
        accentColor: '#8b5cf6',
    } as React.CSSProperties,
    button: {
        width: '100%',
        padding: '0.75rem',
        borderRadius: '0.5rem',
        border: 'none',
        background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)',
        color: '#fff',
        fontWeight: 600,
        fontSize: '1rem',
        cursor: 'pointer',
        marginTop: '1rem',
    } as React.CSSProperties,
    buttonSuccess: {
        background: '#16a34a',
    } as React.CSSProperties,
}

export function SleepLogger({ onLog }: Props) {
    const [bedtime, setBedtime] = useState('23:00')
    const [wakeTime, setWakeTime] = useState('07:00')
    const [quality, setQuality] = useState(7)
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await onLog(bedtime, wakeTime, quality)
            setSuccess(true)
            setTimeout(() => setSuccess(false), 3000)
        } catch (err) {
            console.error(err)
        }
        setLoading(false)
    }

    const isOnSchedule = bedtime <= '23:15'

    return (
        <div style={styles.container}>
            <h2 style={styles.header}>🌙 Log Today's Sleep</h2>

            <form onSubmit={handleSubmit}>
                <div style={styles.grid}>
                    <div>
                        <label style={styles.label}>Bedtime</label>
                        <input
                            type="time"
                            value={bedtime}
                            onChange={(e) => setBedtime(e.target.value)}
                            style={styles.input}
                        />
                        {isOnSchedule ? (
                            <p style={styles.statusOk}>✓ On schedule!</p>
                        ) : (
                            <p style={styles.statusWarn}>⚠ Past 11:15 PM</p>
                        )}
                    </div>

                    <div>
                        <label style={styles.label}>Wake Time</label>
                        <input
                            type="time"
                            value={wakeTime}
                            onChange={(e) => setWakeTime(e.target.value)}
                            style={styles.input}
                        />
                    </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={styles.label}>
                        Sleep Quality: <span style={{ color: '#fff', fontWeight: 500 }}>{quality}/10</span>
                    </label>
                    <input
                        type="range"
                        min="1"
                        max="10"
                        value={quality}
                        onChange={(e) => setQuality(parseInt(e.target.value))}
                        style={styles.slider}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                        <span>😴 Poor</span>
                        <span>😊 Excellent</span>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    style={{ ...styles.button, ...(success ? styles.buttonSuccess : {}), opacity: loading ? 0.5 : 1 }}
                >
                    {loading ? 'Saving...' : success ? '✓ Saved!' : 'Log Sleep'}
                </button>
            </form>
        </div>
    )
}
