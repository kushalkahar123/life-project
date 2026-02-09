interface Props {
    moneySaved: number
    targetAmount?: number // e.g., ₹10,000 for equipment
    targetLabel?: string // e.g., "Workout Equipment"
}

const styles = {
    container: {
        background: 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(16,185,129,0.1))',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        border: '1px solid rgba(34,197,94,0.2)',
    } as React.CSSProperties,
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem',
    } as React.CSSProperties,
    title: {
        fontSize: '1rem',
        fontWeight: '600',
        color: '#22c55e',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
    } as React.CSSProperties,
    amount: {
        fontSize: '2rem',
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: '0.5rem',
    } as React.CSSProperties,
    progressContainer: {
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '9999px',
        height: '8px',
        overflow: 'hidden',
    } as React.CSSProperties,
    progressBar: (percent: number) => ({
        width: `${Math.min(100, percent)}%`,
        height: '100%',
        background: 'linear-gradient(90deg, #22c55e, #16a34a)',
        borderRadius: '9999px',
        transition: 'width 0.5s ease',
    }),
    target: {
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '0.5rem',
        fontSize: '0.75rem',
        color: '#9ca3af',
    } as React.CSSProperties,
    celebration: {
        textAlign: 'center' as const,
        padding: '1rem',
        animation: 'bounce 1s infinite',
    },
    celebrationText: {
        fontSize: '1.5rem',
        color: '#22c55e',
        fontWeight: 'bold',
    } as React.CSSProperties,
}

export function SavingsCounter({ moneySaved, targetAmount = 10000, targetLabel = "Workout Equipment" }: Props) {
    const percent = (moneySaved / targetAmount) * 100
    const goalReached = moneySaved >= targetAmount

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <span style={styles.title}>💵 Money Saved</span>
                {goalReached && <span>🎉</span>}
            </div>

            {goalReached ? (
                <div style={styles.celebration}>
                    <p style={styles.celebrationText}>🎊 Goal Reached! 🎊</p>
                    <p style={{ color: '#22c55e', marginTop: '0.5rem' }}>
                        You saved ₹{moneySaved.toLocaleString()}!
                    </p>
                </div>
            ) : (
                <>
                    <p style={styles.amount}>₹{moneySaved.toLocaleString()}</p>
                    <div style={styles.progressContainer}>
                        <div style={styles.progressBar(percent)} />
                    </div>
                    <div style={styles.target}>
                        <span>{Math.round(percent)}% to goal</span>
                        <span>₹{targetAmount.toLocaleString()} for {targetLabel}</span>
                    </div>
                </>
            )}
        </div>
    )
}
