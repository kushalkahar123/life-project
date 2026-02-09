import { useState, useEffect } from 'react'

interface Props {
    targetBedtime: string // "23:00" format
    warningMinutes: number // e.g., 30 minutes before
    onDismiss: () => void
}

const styles = {
    overlay: {
        position: 'fixed' as const,
        inset: 0,
        background: 'linear-gradient(180deg, #0f0a1f 0%, #1a0a2e 50%, #0f0a1f 100%)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        animation: 'fadeIn 0.5s ease-out',
    },
    warningOverlay: {
        position: 'fixed' as const,
        bottom: 0,
        left: 0,
        right: 0,
        background: 'linear-gradient(180deg, transparent, rgba(139,92,246,0.95))',
        padding: '1.5rem',
        zIndex: 9998,
        animation: 'slideUp 0.3s ease-out',
    },
    moon: {
        fontSize: '6rem',
        marginBottom: '1.5rem',
        animation: 'pulse 2s infinite',
    },
    title: {
        fontSize: '2rem',
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: '0.5rem',
        textAlign: 'center' as const,
    },
    subtitle: {
        fontSize: '1rem',
        color: '#a78bfa',
        marginBottom: '2rem',
        textAlign: 'center' as const,
    },
    countdown: {
        fontSize: '4rem',
        fontWeight: 'bold',
        color: '#8b5cf6',
        fontFamily: 'monospace',
        marginBottom: '2rem',
    },
    message: {
        fontSize: '1rem',
        color: '#d1d5db',
        textAlign: 'center' as const,
        maxWidth: '300px',
        lineHeight: 1.6,
        marginBottom: '2rem',
    },
    button: {
        padding: '1rem 2rem',
        borderRadius: '0.75rem',
        border: 'none',
        background: 'rgba(255,255,255,0.1)',
        color: '#9ca3af',
        fontSize: '0.875rem',
        cursor: 'pointer',
    },
    warningText: {
        color: '#fff',
        fontSize: '1rem',
        textAlign: 'center' as const,
        marginBottom: '0.5rem',
    },
    warningTime: {
        color: '#fbbf24',
        fontSize: '1.5rem',
        fontWeight: 'bold',
        textAlign: 'center' as const,
    },
    dismissLink: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: '0.75rem',
        textAlign: 'center' as const,
        marginTop: '0.75rem',
        cursor: 'pointer',
    },
    shortcutBtn: {
        padding: '1rem 2rem',
        borderRadius: '0.75rem',
        border: 'none',
        background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
        color: '#fff',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer',
        marginBottom: '1rem',
    },
}

export function BedtimeEnforcer({ targetBedtime, warningMinutes, onDismiss }: Props) {
    const [currentTime, setCurrentTime] = useState(new Date())
    const [dismissed, setDismissed] = useState(false)

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date())
        }, 1000)
        return () => clearInterval(interval)
    }, [])

    // Parse target bedtime
    const [targetHour, targetMin] = targetBedtime.split(':').map(Number)
    const now = currentTime
    const todayTarget = new Date(now)
    todayTarget.setHours(targetHour, targetMin, 0, 0)

    // If current time is past midnight but before 6 AM, assume we mean yesterday's bedtime
    if (now.getHours() < 6) {
        todayTarget.setDate(todayTarget.getDate() - 1)
    }

    const msUntilBedtime = todayTarget.getTime() - now.getTime()
    const minutesUntilBedtime = Math.floor(msUntilBedtime / 60000)
    const secondsUntilBedtime = Math.floor((msUntilBedtime % 60000) / 1000)

    const isPastBedtime = msUntilBedtime < 0
    const isWarningPhase = !isPastBedtime && minutesUntilBedtime <= warningMinutes
    const isEnforcementPhase = isPastBedtime && Math.abs(minutesUntilBedtime) < 60 // Show for 1 hour past bedtime

    // If dismissed, don't show for this session
    if (dismissed) return null

    // Before warning phase - don't show anything
    if (!isWarningPhase && !isEnforcementPhase) return null

    // Full screen enforcement (past bedtime)
    if (isEnforcementPhase) {
        const minutesPast = Math.abs(minutesUntilBedtime)

        return (
            <div style={styles.overlay}>
                <style>{`
                    @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
                    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                `}</style>
                <div style={styles.moon}>🌙</div>
                <h1 style={styles.title}>It's Past Bedtime</h1>
                <p style={styles.subtitle}>Your goal: Sleep by {targetBedtime}</p>

                <div style={styles.countdown}>
                    +{minutesPast}:{String(Math.abs(secondsUntilBedtime)).padStart(2, '0')}
                </div>

                <p style={styles.message}>
                    You're {minutesPast} minutes past your bedtime goal.
                    Put down your phone and get some rest.
                    Tomorrow's success starts tonight! 💪
                </p>

                <a
                    href="shortcuts://run-shortcut?name=Bedtime"
                    style={styles.shortcutBtn}
                >
                    🔒 Activate Sleep Mode
                </a>

                <button
                    style={styles.button}
                    onClick={() => setDismissed(true)}
                >
                    I understand, dismiss for tonight
                </button>
            </div>
        )
    }

    // Warning banner (approaching bedtime)
    return (
        <div style={styles.warningOverlay}>
            <style>{`
                @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
            `}</style>
            <p style={styles.warningText}>🌙 Bedtime approaching</p>
            <p style={styles.warningTime}>
                {minutesUntilBedtime}:{String(secondsUntilBedtime).padStart(2, '0')} remaining
            </p>
            <p style={styles.dismissLink} onClick={onDismiss}>
                Dismiss
            </p>
        </div>
    )
}
