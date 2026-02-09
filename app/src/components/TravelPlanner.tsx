import { useState } from 'react'

const DESTINATIONS = [
    'Elephanta Caves',
    'Sanjay Gandhi National Park',
    'Marine Drive Sunset Walk',
    'Kanheri Caves Hike',
    'Alibaug Day Trip',
    'Matheran Hill Station',
    'Vasai Fort Exploration',
    'Gorai Beach Sunset',
    'Gateway of India & Ferry',
    'Global Vipassana Pagoda'
]

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
    picker: {
        background: 'rgba(139, 92, 246, 0.1)',
        padding: '1.5rem',
        borderRadius: '0.75rem',
        textAlign: 'center' as const,
        border: '1px dashed rgba(139, 92, 246, 0.3)',
        marginBottom: '1.5rem',
    } as React.CSSProperties,
    pickedValue: {
        fontSize: '1.25rem',
        fontWeight: 'bold',
        color: '#fff',
        margin: '1rem 0',
    } as React.CSSProperties,
    button: {
        padding: '0.75rem 1.5rem',
        borderRadius: '0.5rem',
        border: 'none',
        background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
        color: '#fff',
        fontWeight: '600',
        cursor: 'pointer',
    } as React.CSSProperties,
    list: {
        display: 'flex',
        flexWrap: 'wrap' as const,
        gap: '0.5rem',
    } as React.CSSProperties,
    tag: {
        background: 'rgba(255,255,255,0.1)',
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        color: '#9ca3af',
    } as React.CSSProperties,
}

export function TravelPlanner() {
    const [picked, setPicked] = useState<string | null>(null)
    const [isSpinning, setIsSpinning] = useState(false)

    const pickDestination = () => {
        setIsSpinning(true)
        setPicked(null)

        let count = 0
        const interval = setInterval(() => {
            setPicked(DESTINATIONS[Math.floor(Math.random() * DESTINATIONS.length)])
            count++
            if (count > 10) {
                clearInterval(interval)
                setIsSpinning(false)
            }
        }, 100)
    }

    return (
        <div style={styles.container}>
            <h3 style={styles.title}>🚗 Travel & Outings</h3>

            <div style={styles.picker}>
                <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Don't know where to go this weekend?</p>
                <div style={styles.pickedValue}>
                    {picked ? picked : '???'}
                </div>
                <button
                    style={styles.button}
                    onClick={pickDestination}
                    disabled={isSpinning}
                >
                    {isSpinning ? 'Picking...' : 'Spontaneous Picker'}
                </button>
            </div>

            <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '0.75rem' }}>Mumbai Destinations Checklist:</p>
            <div style={styles.list}>
                {DESTINATIONS.map(d => (
                    <span key={d} style={styles.tag}>{d}</span>
                ))}
            </div>
        </div>
    )
}
