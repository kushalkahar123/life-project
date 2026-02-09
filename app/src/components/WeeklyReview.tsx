import { useState } from 'react'

interface Props {
    onComplete: (review: WeeklyReviewData) => void
    onDismiss: () => void
    weekStats: {
        sleepOnTimeCount: number
        smokeFreeCount: number
        workoutsCount: number
        mealsLoggedCount: number
    }
}

export interface WeeklyReviewData {
    wins: string
    struggles: string
    nextWeekFocus: string
    rating: number
}

const styles = {
    overlay: {
        position: 'fixed' as const,
        inset: 0,
        background: 'rgba(0,0,0,0.9)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
    },
    modal: {
        background: 'linear-gradient(135deg, #1e1b4b 0%, #0f0a1f 100%)',
        borderRadius: '1rem',
        padding: '1.5rem',
        maxWidth: '400px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto' as const,
        border: '1px solid rgba(139,92,246,0.3)',
    },
    header: {
        textAlign: 'center' as const,
        marginBottom: '1.5rem',
    },
    emoji: {
        fontSize: '3rem',
        marginBottom: '0.5rem',
    },
    title: {
        fontSize: '1.5rem',
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: '0.25rem',
    },
    subtitle: {
        color: '#9ca3af',
        fontSize: '0.875rem',
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '0.75rem',
        marginBottom: '1.5rem',
    },
    statCard: {
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '0.75rem',
        padding: '0.75rem',
        textAlign: 'center' as const,
    },
    statValue: {
        fontSize: '1.5rem',
        fontWeight: 'bold',
        color: '#8b5cf6',
    },
    statLabel: {
        fontSize: '0.625rem',
        color: '#9ca3af',
        marginTop: '0.25rem',
    },
    section: {
        marginBottom: '1rem',
    },
    label: {
        fontSize: '0.875rem',
        color: '#d1d5db',
        marginBottom: '0.5rem',
        display: 'block',
    },
    textarea: {
        width: '100%',
        padding: '0.75rem',
        borderRadius: '0.5rem',
        border: '1px solid rgba(255,255,255,0.2)',
        background: 'rgba(255,255,255,0.1)',
        color: '#fff',
        fontSize: '0.875rem',
        resize: 'vertical' as const,
        minHeight: '80px',
    },
    ratingContainer: {
        display: 'flex',
        justifyContent: 'center',
        gap: '0.5rem',
        marginBottom: '1.5rem',
    },
    ratingBtn: (active: boolean) => ({
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        border: 'none',
        cursor: 'pointer',
        background: active ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : 'rgba(255,255,255,0.1)',
        color: active ? '#fff' : '#9ca3af',
        fontSize: '1rem',
        fontWeight: '600',
    }),
    buttonRow: {
        display: 'flex',
        gap: '0.75rem',
    },
    dismissBtn: {
        flex: 1,
        padding: '0.75rem',
        borderRadius: '0.5rem',
        border: '1px solid rgba(255,255,255,0.2)',
        background: 'transparent',
        color: '#9ca3af',
        cursor: 'pointer',
    },
    submitBtn: {
        flex: 2,
        padding: '0.75rem',
        borderRadius: '0.5rem',
        border: 'none',
        background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
        color: '#fff',
        fontWeight: '600',
        cursor: 'pointer',
    },
}

export function WeeklyReview({ onComplete, onDismiss, weekStats }: Props) {
    const [wins, setWins] = useState('')
    const [struggles, setStruggles] = useState('')
    const [nextWeekFocus, setNextWeekFocus] = useState('')
    const [rating, setRating] = useState(0)

    const handleSubmit = () => {
        if (rating === 0) return
        onComplete({ wins, struggles, nextWeekFocus, rating })
    }

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.header}>
                    <div style={styles.emoji}>📝</div>
                    <h2 style={styles.title}>Weekly Review</h2>
                    <p style={styles.subtitle}>Reflect on your progress this week</p>
                </div>

                <div style={styles.statsGrid}>
                    <div style={styles.statCard}>
                        <div style={styles.statValue}>{weekStats.sleepOnTimeCount}/7</div>
                        <div style={styles.statLabel}>Days on-time sleep</div>
                    </div>
                    <div style={styles.statCard}>
                        <div style={styles.statValue}>{weekStats.smokeFreeCount}/7</div>
                        <div style={styles.statLabel}>Smoke-free days</div>
                    </div>
                    <div style={styles.statCard}>
                        <div style={styles.statValue}>{weekStats.workoutsCount}</div>
                        <div style={styles.statLabel}>Workouts logged</div>
                    </div>
                    <div style={styles.statCard}>
                        <div style={styles.statValue}>{weekStats.mealsLoggedCount}</div>
                        <div style={styles.statLabel}>Meals tracked</div>
                    </div>
                </div>

                <div style={styles.section}>
                    <label style={styles.label}>🏆 What went well this week?</label>
                    <textarea
                        style={styles.textarea}
                        placeholder="I slept on time 5 days, didn't smoke at all..."
                        value={wins}
                        onChange={e => setWins(e.target.value)}
                    />
                </div>

                <div style={styles.section}>
                    <label style={styles.label}>😓 What was challenging?</label>
                    <textarea
                        style={styles.textarea}
                        placeholder="Struggled with late-night phone use..."
                        value={struggles}
                        onChange={e => setStruggles(e.target.value)}
                    />
                </div>

                <div style={styles.section}>
                    <label style={styles.label}>🎯 Next week's focus</label>
                    <textarea
                        style={styles.textarea}
                        placeholder="Put phone away by 10:30 PM every night..."
                        value={nextWeekFocus}
                        onChange={e => setNextWeekFocus(e.target.value)}
                    />
                </div>

                <div style={styles.section}>
                    <label style={{ ...styles.label, textAlign: 'center' }}>Rate this week (1-5)</label>
                    <div style={styles.ratingContainer}>
                        {[1, 2, 3, 4, 5].map(n => (
                            <button
                                key={n}
                                style={styles.ratingBtn(rating === n)}
                                onClick={() => setRating(n)}
                            >
                                {n}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={styles.buttonRow}>
                    <button style={styles.dismissBtn} onClick={onDismiss}>
                        Later
                    </button>
                    <button
                        style={{ ...styles.submitBtn, opacity: rating === 0 ? 0.5 : 1 }}
                        onClick={handleSubmit}
                        disabled={rating === 0}
                    >
                        Complete Review ✓
                    </button>
                </div>
            </div>
        </div>
    )
}
