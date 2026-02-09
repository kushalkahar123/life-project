interface Achievement {
    id: string
    title: string
    description: string
    emoji: string
    unlocked: boolean
    unlockedAt?: string
    progress?: number
    target?: number
}

interface Props {
    achievements: Achievement[]
}

const styles = {
    container: {
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '0.75rem',
        padding: '1rem',
        border: '1px solid rgba(255,255,255,0.1)',
    } as React.CSSProperties,
    title: {
        fontSize: '0.875rem',
        fontWeight: '600',
        color: '#d1d5db',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
    } as React.CSSProperties,
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '0.75rem',
    } as React.CSSProperties,
    badge: (unlocked: boolean) => ({
        background: unlocked
            ? 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(99,102,241,0.3))'
            : 'rgba(255,255,255,0.03)',
        borderRadius: '0.75rem',
        padding: '0.75rem',
        textAlign: 'center' as const,
        border: unlocked
            ? '1px solid rgba(139,92,246,0.5)'
            : '1px solid rgba(255,255,255,0.05)',
        opacity: unlocked ? 1 : 0.5,
        transition: 'all 0.3s ease',
    }),
    badgeEmoji: {
        fontSize: '1.5rem',
        marginBottom: '0.25rem',
    },
    badgeTitle: (unlocked: boolean) => ({
        fontSize: '0.625rem',
        fontWeight: '600',
        color: unlocked ? '#fff' : '#6b7280',
    }),
    progressBar: {
        marginTop: '0.5rem',
        height: '3px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '2px',
        overflow: 'hidden',
    } as React.CSSProperties,
    progressFill: (percent: number) => ({
        height: '100%',
        width: `${percent}%`,
        background: 'linear-gradient(90deg, #8b5cf6, #ec4899)',
        transition: 'width 0.3s ease',
    }),
}

const defaultAchievements: Achievement[] = [
    { id: '1', title: '1 Week Smoke-Free', emoji: '🚭', description: '7 days without smoking', unlocked: false, progress: 0, target: 7 },
    { id: '2', title: '2 Weeks Smoke-Free', emoji: '💪', description: '14 days without smoking', unlocked: false, progress: 0, target: 14 },
    { id: '3', title: '1 Month Smoke-Free', emoji: '🏆', description: '30 days without smoking', unlocked: false, progress: 0, target: 30 },
    { id: '4', title: 'Sleep Champion', emoji: '🌙', description: '7 days on-time sleep', unlocked: false, progress: 0, target: 7 },
    { id: '5', title: '₹1K Saved', emoji: '💰', description: 'Saved ₹1,000 from not smoking', unlocked: false, progress: 0, target: 1000 },
    { id: '6', title: '₹5K Saved', emoji: '💎', description: 'Saved ₹5,000 from not smoking', unlocked: false, progress: 0, target: 5000 },
    { id: '7', title: 'Workout Week', emoji: '🏃', description: '5 workouts in one week', unlocked: false, progress: 0, target: 5 },
    { id: '8', title: 'Home Chef', emoji: '👨‍🍳', description: '7 days home cooking', unlocked: false, progress: 0, target: 7 },
    { id: '9', title: 'Couple Goals', emoji: '👫', description: 'Both partners hit streak', unlocked: false },
]

export function AchievementBadges({ achievements = defaultAchievements }: Props) {
    return (
        <div style={styles.container}>
            <div style={styles.title}>
                <span>🏅</span> Achievements
            </div>
            <div style={styles.grid}>
                {achievements.map(a => {
                    const progress = a.progress && a.target ? (a.progress / a.target) * 100 : 0

                    return (
                        <div key={a.id} style={styles.badge(a.unlocked)}>
                            <div style={styles.badgeEmoji}>
                                {a.unlocked ? a.emoji : '🔒'}
                            </div>
                            <div style={styles.badgeTitle(a.unlocked)}>
                                {a.title}
                            </div>
                            {!a.unlocked && a.target && (
                                <div style={styles.progressBar}>
                                    <div style={styles.progressFill(progress)} />
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
