interface Props {
    yourData: UserDayData
    partnerData: UserDayData | null
    yourName: string
    partnerName: string
    loading: boolean
}

interface UserDayData {
    sleepHours: number | null
    sleepOnTime: boolean
    smokedToday: boolean
    workedOut: boolean
    workoutType?: string
    smokeFreeStreak: number
    sleepStreak: number
}

const styles = {
    container: {
        background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(59,130,246,0.15) 100%)',
        borderRadius: '1rem',
        padding: '1.25rem',
        border: '1px solid rgba(139,92,246,0.3)',
        marginBottom: '1.5rem',
    } as React.CSSProperties,
    title: {
        fontSize: '0.875rem',
        fontWeight: '600',
        color: '#a78bfa',
        marginBottom: '1rem',
        textAlign: 'center' as const,
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem',
    } as React.CSSProperties,
    column: {
        textAlign: 'center' as const,
    } as React.CSSProperties,
    name: {
        fontSize: '0.875rem',
        fontWeight: '600',
        color: '#fff',
        marginBottom: '0.75rem',
    } as React.CSSProperties,
    row: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem',
        background: 'rgba(0,0,0,0.2)',
        borderRadius: '0.5rem',
        marginBottom: '0.5rem',
    } as React.CSSProperties,
    icon: {
        fontSize: '1rem',
    },
    value: {
        fontSize: '0.75rem',
        color: '#d1d5db',
    } as React.CSSProperties,
    badge: (good: boolean) => ({
        fontSize: '0.625rem',
        padding: '0.125rem 0.375rem',
        borderRadius: '9999px',
        background: good ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
        color: good ? '#22c55e' : '#ef4444',
    }),
    divider: {
        position: 'absolute' as const,
        left: '50%',
        top: '20%',
        bottom: '10%',
        width: '1px',
        background: 'rgba(255,255,255,0.1)',
    },
    streak: {
        marginTop: '0.75rem',
        padding: '0.5rem',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '0.5rem',
    } as React.CSSProperties,
    streakLabel: {
        fontSize: '0.625rem',
        color: '#9ca3af',
    } as React.CSSProperties,
    streakValue: {
        fontSize: '1rem',
        fontWeight: 'bold',
        color: '#fff',
    } as React.CSSProperties,
}

function PersonColumn({ data, name }: { data: UserDayData; name: string }) {
    return (
        <div style={styles.column}>
            <div style={styles.name}>{name}</div>

            <div style={styles.row}>
                <span style={styles.icon}>🌙</span>
                <span style={styles.value}>
                    {data.sleepHours !== null ? `${data.sleepHours.toFixed(1)}h` : '-'}
                </span>
                <span style={styles.badge(data.sleepOnTime)}>
                    {data.sleepOnTime ? '✓' : '✗'}
                </span>
            </div>

            <div style={styles.row}>
                <span style={styles.icon}>🚭</span>
                <span style={styles.value}>
                    {data.smokedToday ? 'Smoked' : 'Clean'}
                </span>
                <span style={styles.badge(!data.smokedToday)}>
                    {data.smokedToday ? '✗' : '✓'}
                </span>
            </div>

            <div style={styles.row}>
                <span style={styles.icon}>💪</span>
                <span style={styles.value}>
                    {data.workedOut ? (data.workoutType || 'Done') : 'Rest'}
                </span>
                <span style={styles.badge(data.workedOut)}>
                    {data.workedOut ? '✓' : '-'}
                </span>
            </div>

            <div style={styles.streak}>
                <div style={styles.streakLabel}>🔥 Smoke-free</div>
                <div style={styles.streakValue}>{data.smokeFreeStreak} days</div>
            </div>
        </div>
    )
}

export function CoupleComparison({ yourData, partnerData, yourName, partnerName, loading }: Props) {
    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.title}>Loading couple data...</div>
            </div>
        )
    }

    if (!partnerData) {
        return (
            <div style={styles.container}>
                <div style={styles.title}>👫 Partner not linked yet</div>
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center' }}>
                    Share data with your partner by linking accounts.
                </p>
            </div>
        )
    }

    return (
        <div style={styles.container}>
            <div style={styles.title}>👫 Today's Progress</div>
            <div style={styles.grid}>
                <PersonColumn data={yourData} name={yourName} />
                <PersonColumn data={partnerData} name={partnerName} />
            </div>
        </div>
    )
}
