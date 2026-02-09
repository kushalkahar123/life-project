interface LifeMilestone {
    id: string
    title: string
    emoji: string
    targetDate: string
    requirements: {
        label: string
        current: number
        target: number
        unit: string
    }[]
    status: 'locked' | 'ready' | 'achieved'
}

interface Props {
    milestones: LifeMilestone[]
}

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '1rem',
    },
    card: (status: string) => ({
        background: status === 'achieved'
            ? 'linear-gradient(135deg, rgba(34,197,94,0.2) 0%, rgba(16,185,129,0.2) 100%)'
            : status === 'ready'
                ? 'linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(99,102,241,0.2) 100%)'
                : 'rgba(255,255,255,0.05)',
        borderRadius: '0.75rem',
        padding: '1.25rem',
        border: status === 'achieved'
            ? '1px solid rgba(34,197,94,0.3)'
            : status === 'ready'
                ? '1px solid rgba(139,92,246,0.3)'
                : '1px solid rgba(255,255,255,0.1)',
    }),
    header: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '1rem',
    } as React.CSSProperties,
    emoji: {
        fontSize: '2rem',
    },
    titleSection: {
        flex: 1,
    } as React.CSSProperties,
    title: {
        fontSize: '1rem',
        fontWeight: 'bold',
        color: '#fff',
    } as React.CSSProperties,
    date: {
        fontSize: '0.75rem',
        color: '#9ca3af',
    } as React.CSSProperties,
    statusBadge: (status: string) => ({
        padding: '0.25rem 0.5rem',
        borderRadius: '9999px',
        fontSize: '0.625rem',
        fontWeight: '600',
        background: status === 'achieved'
            ? 'rgba(34,197,94,0.2)'
            : status === 'ready'
                ? 'rgba(139,92,246,0.2)'
                : 'rgba(255,255,255,0.1)',
        color: status === 'achieved'
            ? '#22c55e'
            : status === 'ready'
                ? '#a78bfa'
                : '#6b7280',
    }),
    requirements: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '0.5rem',
    },
    reqRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
    } as React.CSSProperties,
    reqLabel: {
        flex: 1,
        fontSize: '0.75rem',
        color: '#d1d5db',
    } as React.CSSProperties,
    reqProgress: {
        fontSize: '0.75rem',
        color: '#9ca3af',
    } as React.CSSProperties,
    progressBar: {
        height: '4px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '2px',
        overflow: 'hidden',
        marginTop: '0.25rem',
    } as React.CSSProperties,
    progressFill: (percent: number, complete: boolean) => ({
        height: '100%',
        width: `${Math.min(percent, 100)}%`,
        background: complete ? '#22c55e' : '#8b5cf6',
        transition: 'width 0.3s ease',
    }),
    checkIcon: (complete: boolean) => ({
        width: '16px',
        height: '16px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.5rem',
        background: complete ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.1)',
        color: complete ? '#22c55e' : '#6b7280',
    }),
}

function formatTargetDate(dateStr: string): string {
    const target = new Date(dateStr)
    const now = new Date()
    const diffMs = target.getTime() - now.getTime()
    const diffMonths = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30))

    if (diffMonths <= 0) return 'Ready!'
    if (diffMonths < 12) return `${diffMonths} months away`
    const years = Math.floor(diffMonths / 12)
    const months = diffMonths % 12
    return months > 0 ? `${years}y ${months}mo away` : `${years} years away`
}

export function LongTermMilestones({ milestones }: Props) {
    return (
        <div style={styles.container}>
            {milestones.map(m => {
                const allComplete = m.requirements.every(r => r.current >= r.target)
                const status = allComplete ? 'ready' : m.status

                return (
                    <div key={m.id} style={styles.card(status)}>
                        <div style={styles.header}>
                            <span style={styles.emoji}>{m.emoji}</span>
                            <div style={styles.titleSection}>
                                <div style={styles.title}>{m.title}</div>
                                <div style={styles.date}>{formatTargetDate(m.targetDate)}</div>
                            </div>
                            <span style={styles.statusBadge(status)}>
                                {status === 'achieved' ? '✓ Done' : status === 'ready' ? 'Ready!' : 'In Progress'}
                            </span>
                        </div>

                        <div style={styles.requirements}>
                            {m.requirements.map((req, idx) => {
                                const percent = (req.current / req.target) * 100
                                const complete = req.current >= req.target

                                return (
                                    <div key={idx}>
                                        <div style={styles.reqRow}>
                                            <div style={styles.checkIcon(complete)}>
                                                {complete ? '✓' : ''}
                                            </div>
                                            <span style={styles.reqLabel}>{req.label}</span>
                                            <span style={styles.reqProgress}>
                                                {req.current}/{req.target} {req.unit}
                                            </span>
                                        </div>
                                        <div style={styles.progressBar}>
                                            <div style={styles.progressFill(percent, complete)} />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
