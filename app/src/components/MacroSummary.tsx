interface MacroData {
    calories: number
    protein: number
    carbs: number
    fats: number
}

interface Props {
    current: MacroData
    targets: MacroData
    loading?: boolean
}

const styles = {
    container: {
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '0.75rem',
        padding: '1rem',
        border: '1px solid rgba(255,255,255,0.1)',
        marginBottom: '1rem',
    } as React.CSSProperties,
    title: {
        fontSize: '0.875rem',
        fontWeight: '600',
        color: '#d1d5db',
        marginBottom: '1rem',
    } as React.CSSProperties,
    row: {
        marginBottom: '0.75rem',
    } as React.CSSProperties,
    labelRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.25rem',
    } as React.CSSProperties,
    label: {
        fontSize: '0.75rem',
        color: '#9ca3af',
    } as React.CSSProperties,
    values: {
        fontSize: '0.75rem',
        color: '#d1d5db',
    } as React.CSSProperties,
    progressBg: {
        height: '6px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '3px',
        overflow: 'hidden',
    } as React.CSSProperties,
    progressFill: (percent: number, color: string) => ({
        height: '100%',
        width: `${Math.min(percent, 100)}%`,
        background: percent > 100 ? '#ef4444' : color,
        borderRadius: '3px',
        transition: 'width 0.3s ease',
    }),
}

const macroColors = {
    calories: '#f59e0b',
    protein: '#ef4444',
    carbs: '#3b82f6',
    fats: '#22c55e',
}

const macroEmojis = {
    calories: '🔥',
    protein: '🥩',
    carbs: '🍚',
    fats: '🥑',
}

export function MacroSummary({ current, targets, loading }: Props) {
    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.title}>📊 Today's Nutrition</div>
                <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Loading...</p>
            </div>
        )
    }

    const macros: (keyof MacroData)[] = ['calories', 'protein', 'carbs', 'fats']
    const units = {
        calories: 'kcal',
        protein: 'g',
        carbs: 'g',
        fats: 'g',
    }

    return (
        <div style={styles.container}>
            <div style={styles.title}>📊 Today's Nutrition</div>

            {macros.map(macro => {
                const percent = targets[macro] > 0 ? (current[macro] / targets[macro]) * 100 : 0
                const isOver = percent > 100

                return (
                    <div key={macro} style={styles.row}>
                        <div style={styles.labelRow}>
                            <span style={styles.label}>
                                {macroEmojis[macro]} {macro.charAt(0).toUpperCase() + macro.slice(1)}
                            </span>
                            <span style={{ ...styles.values, color: isOver ? '#ef4444' : '#d1d5db' }}>
                                {current[macro]} / {targets[macro]} {units[macro]}
                            </span>
                        </div>
                        <div style={styles.progressBg}>
                            <div style={styles.progressFill(percent, macroColors[macro])} />
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
