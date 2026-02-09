import { useState } from 'react'
import type { WorkoutType } from '../types/nutrition'

interface Props {
    onLog: (
        workoutType: WorkoutType,
        durationMin: number,
        intensity: 'light' | 'moderate' | 'intense',
        notes?: string
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
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '0.5rem',
        marginBottom: '1rem',
    } as React.CSSProperties,
    typeBtn: (active: boolean) => ({
        padding: '0.75rem 0.5rem',
        borderRadius: '0.5rem',
        border: 'none',
        cursor: 'pointer',
        background: active ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)',
        color: active ? '#22c55e' : '#9ca3af',
        fontSize: '0.75rem',
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        gap: '0.25rem',
    }),
    intensityRow: {
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1rem',
    } as React.CSSProperties,
    intensityBtn: (active: boolean, color: string) => ({
        flex: 1,
        padding: '0.5rem',
        borderRadius: '0.5rem',
        border: 'none',
        cursor: 'pointer',
        background: active ? `rgba(${color}, 0.3)` : 'rgba(255,255,255,0.1)',
        color: active ? '#fff' : '#9ca3af',
        fontSize: '0.75rem',
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
        background: 'linear-gradient(135deg, #22c55e, #16a34a)',
        color: '#fff',
        fontWeight: '600',
    } as React.CSSProperties,
}

const workoutEmojis: Record<WorkoutType, string> = {
    cardio: '🏃',
    strength: '💪',
    yoga: '🧘',
    walk: '🚶',
    joint_activity: '👫',
    rest: '😴',
}

const workoutLabels: Record<WorkoutType, string> = {
    cardio: 'Cardio',
    strength: 'Strength',
    yoga: 'Yoga',
    walk: 'Walk',
    joint_activity: 'Together',
    rest: 'Rest Day',
}

export function WorkoutLogger({ onLog }: Props) {
    const [workoutType, setWorkoutType] = useState<WorkoutType>('cardio')
    const [duration, setDuration] = useState('20')
    const [intensity, setIntensity] = useState<'light' | 'moderate' | 'intense'>('moderate')
    const [notes, setNotes] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async () => {
        setLoading(true)
        try {
            await onLog(workoutType, parseInt(duration) || 20, intensity, notes || undefined)
            setNotes('')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={styles.container}>
            <h3 style={styles.title}>🏋️ Log Workout</h3>

            <div style={styles.grid}>
                {(['cardio', 'strength', 'yoga', 'walk', 'joint_activity', 'rest'] as WorkoutType[]).map(type => (
                    <button
                        key={type}
                        style={styles.typeBtn(workoutType === type)}
                        onClick={() => setWorkoutType(type)}
                    >
                        <span style={{ fontSize: '1.25rem' }}>{workoutEmojis[type]}</span>
                        <span>{workoutLabels[type]}</span>
                    </button>
                ))}
            </div>

            <div style={styles.intensityRow}>
                <button
                    style={styles.intensityBtn(intensity === 'light', '96,165,250')}
                    onClick={() => setIntensity('light')}
                >
                    😌 Light
                </button>
                <button
                    style={styles.intensityBtn(intensity === 'moderate', '251,191,36')}
                    onClick={() => setIntensity('moderate')}
                >
                    💪 Moderate
                </button>
                <button
                    style={styles.intensityBtn(intensity === 'intense', '239,68,68')}
                    onClick={() => setIntensity('intense')}
                >
                    🔥 Intense
                </button>
            </div>

            <div style={styles.inputRow}>
                <input
                    type="number"
                    placeholder="Duration (min)"
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                    style={styles.input}
                />
                <input
                    type="text"
                    placeholder="Notes (optional)"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    style={styles.input}
                />
            </div>

            <button onClick={handleSubmit} disabled={loading} style={styles.submitBtn}>
                {loading ? '...' : workoutType === 'rest' ? 'Log Rest Day' : 'Log Workout'}
            </button>
        </div>
    )
}
