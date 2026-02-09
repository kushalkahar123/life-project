interface TaperPhase {
    week: number
    maxPerDay: number
    label: string
}

interface Props {
    currentStreak: number
    startDate?: string // When the user started the taper plan
}

const phases: TaperPhase[] = [
    { week: 1, maxPerDay: 3, label: 'Week 1-2: Max 3/day' },
    { week: 3, maxPerDay: 2, label: 'Week 3-4: Max 2/day' },
    { week: 5, maxPerDay: 1, label: 'Week 5-6: Max 1/day' },
    { week: 7, maxPerDay: 0.5, label: 'Week 7-8: 1 every other day' },
    { week: 9, maxPerDay: 0, label: 'Week 9+: Zero 🎉' },
]

const styles = {
    container: {
        background: 'linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(249,115,22,0.1) 100%)',
        borderRadius: '0.75rem',
        padding: '1rem',
        border: '1px solid rgba(239,68,68,0.2)',
    } as React.CSSProperties,
    title: {
        fontSize: '0.875rem',
        fontWeight: '600',
        color: '#fbbf24',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
    } as React.CSSProperties,
    progressContainer: {
        marginBottom: '1rem',
    } as React.CSSProperties,
    phaseRow: (active: boolean, completed: boolean) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.5rem',
        borderRadius: '0.5rem',
        marginBottom: '0.25rem',
        background: active ? 'rgba(139,92,246,0.2)' : 'transparent',
        opacity: completed ? 0.6 : 1,
    }),
    phaseIndicator: (active: boolean, completed: boolean) => ({
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.75rem',
        background: completed
            ? 'rgba(34,197,94,0.3)'
            : active
                ? 'linear-gradient(135deg, #8b5cf6, #6366f1)'
                : 'rgba(255,255,255,0.1)',
        color: completed ? '#22c55e' : '#fff',
        border: active ? '2px solid #a78bfa' : '1px solid rgba(255,255,255,0.2)',
    }),
    phaseLabel: (active: boolean) => ({
        fontSize: '0.75rem',
        color: active ? '#fff' : '#9ca3af',
        fontWeight: active ? '600' : '400',
    }),
    phaseLimit: {
        marginLeft: 'auto',
        fontSize: '0.625rem',
        color: '#9ca3af',
        background: 'rgba(255,255,255,0.05)',
        padding: '0.125rem 0.5rem',
        borderRadius: '9999px',
    } as React.CSSProperties,
    stats: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '0.75rem',
        marginTop: '1rem',
        paddingTop: '1rem',
        borderTop: '1px solid rgba(255,255,255,0.1)',
    } as React.CSSProperties,
    statCard: {
        textAlign: 'center' as const,
    },
    statValue: {
        fontSize: '1.25rem',
        fontWeight: 'bold',
        color: '#22c55e',
    } as React.CSSProperties,
    statLabel: {
        fontSize: '0.625rem',
        color: '#9ca3af',
    } as React.CSSProperties,
    motivationText: {
        marginTop: '1rem',
        padding: '0.75rem',
        background: 'rgba(34,197,94,0.1)',
        borderRadius: '0.5rem',
        fontSize: '0.75rem',
        color: '#22c55e',
        textAlign: 'center' as const,
    } as React.CSSProperties,
}

export function SmokingTaperPlan({ currentStreak }: Props) {
    // Calculate current phase based on streak (7 days per phase transition)
    const currentWeek = Math.floor(currentStreak / 7) + 1

    // Find which phase we're in
    const currentPhaseIndex = phases.findIndex((p, i) => {
        const nextPhase = phases[i + 1]
        return currentWeek >= p.week && (!nextPhase || currentWeek < nextPhase.week)
    })

    const daysInCurrentPhase = currentStreak % 14 // 2-week phases
    const daysRemaining = 14 - daysInCurrentPhase

    // Calculate cigarettes avoided (assuming baseline of 5/day)
    const baselinePerDay = 5
    const cigarettesAvoided = currentStreak * baselinePerDay
    const moneyPerCig = 15 // ₹15 per cigarette
    const moneySaved = cigarettesAvoided * moneyPerCig

    return (
        <div style={styles.container}>
            <div style={styles.title}>
                <span>📉</span> Smoking Taper Plan
            </div>

            <div style={styles.progressContainer}>
                {phases.map((phase, idx) => {
                    const isCompleted = currentWeek > phase.week + 1
                    const isActive = idx === currentPhaseIndex

                    return (
                        <div key={idx} style={styles.phaseRow(isActive, isCompleted)}>
                            <div style={styles.phaseIndicator(isActive, isCompleted)}>
                                {isCompleted ? '✓' : idx + 1}
                            </div>
                            <span style={styles.phaseLabel(isActive)}>{phase.label}</span>
                            <span style={styles.phaseLimit}>
                                {phase.maxPerDay === 0 ? 'Zero!' : `≤${phase.maxPerDay}/day`}
                            </span>
                        </div>
                    )
                })}
            </div>

            <div style={styles.stats}>
                <div style={styles.statCard}>
                    <div style={styles.statValue}>{cigarettesAvoided}</div>
                    <div style={styles.statLabel}>Cigarettes avoided</div>
                </div>
                <div style={styles.statCard}>
                    <div style={styles.statValue}>₹{moneySaved.toLocaleString()}</div>
                    <div style={styles.statLabel}>Money saved</div>
                </div>
            </div>

            {currentStreak >= 7 && (
                <div style={styles.motivationText}>
                    🎉 {currentStreak >= 30
                        ? "You're smoke-free! Keep going!"
                        : `${daysRemaining} days until next phase!`}
                </div>
            )}
        </div>
    )
}
