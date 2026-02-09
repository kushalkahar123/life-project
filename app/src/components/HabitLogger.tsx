import { useState } from 'react'
import type { HabitType } from '../types/habit'

interface Props {
    onLog: (type: HabitType, options?: { triggerReason?: string; cost?: number; restaurantName?: string }) => Promise<void>
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
        gap: '0.75rem',
    } as React.CSSProperties,
    button: (variant: 'smoke' | 'junk' | 'home', active: boolean) => ({
        padding: '1rem',
        borderRadius: '0.75rem',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        gap: '0.5rem',
        transition: 'all 0.2s',
        background: active
            ? variant === 'smoke' ? 'rgba(239,68,68,0.3)'
                : variant === 'junk' ? 'rgba(249,115,22,0.3)'
                    : 'rgba(34,197,94,0.3)'
            : 'rgba(255,255,255,0.1)',
        color: '#fff',
        transform: active ? 'scale(0.95)' : 'scale(1)',
    }),
    emoji: {
        fontSize: '1.75rem',
    } as React.CSSProperties,
    label: {
        fontSize: '0.75rem',
        color: '#9ca3af',
    } as React.CSSProperties,
    modal: {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    modalContent: {
        background: 'linear-gradient(135deg, #1f2937, #111827)',
        borderRadius: '1rem',
        padding: '1.5rem',
        width: '90%',
        maxWidth: '320px',
        border: '1px solid rgba(255,255,255,0.1)',
    } as React.CSSProperties,
    modalTitle: {
        fontSize: '1.125rem',
        fontWeight: '600',
        marginBottom: '1rem',
        color: '#fff',
    } as React.CSSProperties,
    input: {
        width: '100%',
        padding: '0.75rem',
        borderRadius: '0.5rem',
        border: '1px solid rgba(255,255,255,0.2)',
        background: 'rgba(255,255,255,0.1)',
        color: '#fff',
        marginBottom: '0.75rem',
        fontSize: '1rem',
    } as React.CSSProperties,
    modalButtons: {
        display: 'flex',
        gap: '0.5rem',
        marginTop: '1rem',
    } as React.CSSProperties,
    modalBtn: (primary: boolean) => ({
        flex: 1,
        padding: '0.75rem',
        borderRadius: '0.5rem',
        border: 'none',
        cursor: 'pointer',
        fontWeight: '600',
        background: primary ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : 'rgba(255,255,255,0.1)',
        color: '#fff',
    }),
    successOverlay: {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(34,197,94,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1001,
        animation: 'fadeInOut 1.5s ease-in-out',
    },
    successText: {
        fontSize: '3rem',
        color: '#22c55e',
    } as React.CSSProperties,
}

export function HabitLogger({ onLog }: Props) {
    const [activeButton, setActiveButton] = useState<HabitType | null>(null)
    const [showModal, setShowModal] = useState<'smoke' | 'junk' | null>(null)
    const [showSuccess, setShowSuccess] = useState(false)
    const [triggerReason, setTriggerReason] = useState('')
    const [cost, setCost] = useState('')
    const [restaurantName, setRestaurantName] = useState('')
    const [loading, setLoading] = useState(false)

    const handleQuickLog = async (type: HabitType) => {
        setActiveButton(type)

        if (type === 'home_meal') {
            // Home meal is instant success
            setLoading(true)
            await onLog(type)
            setLoading(false)
            setShowSuccess(true)
            setTimeout(() => {
                setShowSuccess(false)
                setActiveButton(null)
            }, 1500)
        } else if (type === 'smoke') {
            setShowModal('smoke')
        } else if (type === 'junk_food') {
            setShowModal('junk')
        }
    }

    const handleSubmitModal = async () => {
        setLoading(true)
        try {
            if (showModal === 'smoke') {
                await onLog('smoke', { triggerReason: triggerReason || undefined })
            } else if (showModal === 'junk') {
                await onLog('junk_food', {
                    cost: cost ? parseInt(cost) : undefined,
                    restaurantName: restaurantName || undefined
                })
            }
        } finally {
            setLoading(false)
            setShowModal(null)
            setActiveButton(null)
            setTriggerReason('')
            setCost('')
            setRestaurantName('')
        }
    }

    const closeModal = () => {
        setShowModal(null)
        setActiveButton(null)
        setTriggerReason('')
        setCost('')
        setRestaurantName('')
    }

    return (
        <>
            <div style={styles.container}>
                <h2 style={styles.title}>⚡ Quick Log</h2>
                <div style={styles.grid}>
                    <button
                        style={styles.button('smoke', activeButton === 'smoke')}
                        onClick={() => handleQuickLog('smoke')}
                        disabled={loading}
                    >
                        <span style={styles.emoji}>🚬</span>
                        <span style={styles.label}>I smoked</span>
                    </button>

                    <button
                        style={styles.button('junk', activeButton === 'junk_food')}
                        onClick={() => handleQuickLog('junk_food')}
                        disabled={loading}
                    >
                        <span style={styles.emoji}>🍔</span>
                        <span style={styles.label}>Ate out</span>
                    </button>

                    <button
                        style={styles.button('home', activeButton === 'home_meal')}
                        onClick={() => handleQuickLog('home_meal')}
                        disabled={loading}
                    >
                        <span style={styles.emoji}>🏠</span>
                        <span style={styles.label}>Ate home</span>
                    </button>
                </div>
            </div>

            {/* Smoke Modal */}
            {showModal === 'smoke' && (
                <div style={styles.modal} onClick={closeModal}>
                    <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <h3 style={styles.modalTitle}>🚬 Log Smoke</h3>
                        <input
                            type="text"
                            placeholder="Trigger (stress, boredom, etc.)"
                            value={triggerReason}
                            onChange={e => setTriggerReason(e.target.value)}
                            style={styles.input}
                        />
                        <div style={styles.modalButtons}>
                            <button style={styles.modalBtn(false)} onClick={closeModal}>Cancel</button>
                            <button style={styles.modalBtn(true)} onClick={handleSubmitModal} disabled={loading}>
                                {loading ? '...' : 'Log'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Junk Food Modal */}
            {showModal === 'junk' && (
                <div style={styles.modal} onClick={closeModal}>
                    <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <h3 style={styles.modalTitle}>🍔 Log Eating Out</h3>
                        <input
                            type="text"
                            placeholder="Restaurant name"
                            value={restaurantName}
                            onChange={e => setRestaurantName(e.target.value)}
                            style={styles.input}
                        />
                        <input
                            type="number"
                            placeholder="Cost (₹)"
                            value={cost}
                            onChange={e => setCost(e.target.value)}
                            style={styles.input}
                        />
                        <div style={styles.modalButtons}>
                            <button style={styles.modalBtn(false)} onClick={closeModal}>Cancel</button>
                            <button style={styles.modalBtn(true)} onClick={handleSubmitModal} disabled={loading}>
                                {loading ? '...' : 'Log'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Animation */}
            {showSuccess && (
                <div style={styles.successOverlay}>
                    <span style={styles.successText}>🎉 Great choice!</span>
                </div>
            )}
        </>
    )
}
