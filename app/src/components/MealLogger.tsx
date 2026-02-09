import { useState } from 'react'
import type { MealType } from '../types/nutrition'

interface Props {
    onLog: (
        mealType: MealType,
        homeOrOut: 'home' | 'out',
        options?: { calories?: number; protein?: number; description?: string }
    ) => Promise<void>
}

const styles = {
    container: {
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        border: '1px solid rgba(255,255,255,0.1)',
    } as React.CSSProperties,
    title: {
        fontSize: '1.125rem',
        fontWeight: '600',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
    } as React.CSSProperties,
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '0.5rem',
        marginBottom: '1rem',
    } as React.CSSProperties,
    mealBtn: (active: boolean) => ({
        padding: '0.75rem 0.5rem',
        borderRadius: '0.5rem',
        border: 'none',
        cursor: 'pointer',
        background: active ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.1)',
        color: '#fff',
        fontSize: '0.75rem',
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        gap: '0.25rem',
    }),
    toggleContainer: {
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1rem',
    } as React.CSSProperties,
    toggleBtn: (active: boolean) => ({
        flex: 1,
        padding: '0.75rem',
        borderRadius: '0.5rem',
        border: 'none',
        cursor: 'pointer',
        background: active ? 'linear-gradient(135deg, rgba(34,197,94,0.3), rgba(16,185,129,0.3))' : 'rgba(255,255,255,0.1)',
        color: active ? '#22c55e' : '#9ca3af',
        fontWeight: '600',
    }),
    inputRow: {
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1rem',
    } as React.CSSProperties,
    input: {
        flex: 1,
        padding: '0.75rem',
        borderRadius: '0.5rem',
        border: '1px solid rgba(255,255,255,0.2)',
        background: 'rgba(255,255,255,0.1)',
        color: '#fff',
        fontSize: '0.875rem',
    } as React.CSSProperties,
    submitBtn: {
        width: '100%',
        padding: '0.75rem',
        borderRadius: '0.5rem',
        border: 'none',
        cursor: 'pointer',
        background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
        color: '#fff',
        fontWeight: '600',
    } as React.CSSProperties,
}

const mealEmojis: Record<MealType, string> = {
    breakfast: '🌅',
    lunch: '☀️',
    dinner: '🌙',
    snack: '🍎',
}

export function MealLogger({ onLog }: Props) {
    const [mealType, setMealType] = useState<MealType>('breakfast')
    const [homeOrOut, setHomeOrOut] = useState<'home' | 'out'>('home')
    const [calories, setCalories] = useState('')
    const [protein, setProtein] = useState('')
    const [description, setDescription] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async () => {
        setLoading(true)
        try {
            await onLog(mealType, homeOrOut, {
                calories: calories ? parseInt(calories) : undefined,
                protein: protein ? parseInt(protein) : undefined,
                description: description || undefined,
            })
            setCalories('')
            setProtein('')
            setDescription('')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={styles.container}>
            <h3 style={styles.title}>🍽️ Log Meal</h3>

            <div style={styles.grid}>
                {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map(type => (
                    <button
                        key={type}
                        style={styles.mealBtn(mealType === type)}
                        onClick={() => setMealType(type)}
                    >
                        <span style={{ fontSize: '1.25rem' }}>{mealEmojis[type]}</span>
                        <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                    </button>
                ))}
            </div>

            <div style={styles.toggleContainer}>
                <button
                    style={styles.toggleBtn(homeOrOut === 'home')}
                    onClick={() => setHomeOrOut('home')}
                >
                    🏠 Home
                </button>
                <button
                    style={styles.toggleBtn(homeOrOut === 'out')}
                    onClick={() => setHomeOrOut('out')}
                >
                    🍔 Ate Out
                </button>
            </div>

            <input
                type="text"
                placeholder="What did you eat?"
                value={description}
                onChange={e => setDescription(e.target.value)}
                style={{ ...styles.input, marginBottom: '0.75rem' }}
            />

            <div style={styles.inputRow}>
                <input
                    type="number"
                    placeholder="Calories"
                    value={calories}
                    onChange={e => setCalories(e.target.value)}
                    style={styles.input}
                />
                <input
                    type="number"
                    placeholder="Protein (g)"
                    value={protein}
                    onChange={e => setProtein(e.target.value)}
                    style={styles.input}
                />
            </div>

            <button onClick={handleSubmit} disabled={loading} style={styles.submitBtn}>
                {loading ? '...' : 'Log Meal'}
            </button>
        </div>
    )
}
