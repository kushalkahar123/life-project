import type { Milestone } from '../types/milestones'

interface Props {
    milestones: Milestone[]
    onToggle: (id: string, index: number) => void
}

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '1rem',
    },
    card: {
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '0.75rem',
        padding: '1.25rem',
        border: '1px solid rgba(255,255,255,0.1)',
    } as React.CSSProperties,
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
    } as React.CSSProperties,
    title: {
        fontSize: '1rem',
        fontWeight: 'bold',
        color: '#fff',
    } as React.CSSProperties,
    date: {
        fontSize: '0.75rem',
        color: '#9ca3af',
    } as React.CSSProperties,
    taskRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.5rem 0',
        cursor: 'pointer',
    } as React.CSSProperties,
    checkbox: (completed: boolean) => ({
        width: '18px',
        height: '18px',
        borderRadius: '4px',
        border: `2px solid ${completed ? '#22c55e' : 'rgba(255,255,255,0.2)'}`,
        background: completed ? '#22c55e' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        color: '#fff',
    }),
    taskText: (completed: boolean) => ({
        fontSize: '0.875rem',
        color: completed ? '#6b7280' : '#d1d5db',
        textDecoration: completed ? 'line-through' : 'none',
    }),
    progressBar: {
        height: '4px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '2px',
        marginTop: '1rem',
        overflow: 'hidden',
    } as React.CSSProperties,
    progressFill: (percent: number) => ({
        width: `${percent}%`,
        height: '100%',
        background: '#22c55e',
        transition: 'width 0.3s ease',
    }),
}

export function MilestoneTracker({ milestones, onToggle }: Props) {
    return (
        <div style={styles.container}>
            {milestones.map(m => {
                const completedCount = m.checklist.filter(c => c.completed).length
                const percent = (completedCount / m.checklist.length) * 100

                return (
                    <div key={m.id} style={styles.card}>
                        <div style={styles.header}>
                            <h4 style={styles.title}>{m.title}</h4>
                            <span style={styles.date}>Target: {m.target_date}</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {m.checklist.map((task, idx) => (
                                <div
                                    key={idx}
                                    style={styles.taskRow}
                                    onClick={() => onToggle(m.id, idx)}
                                >
                                    <div style={styles.checkbox(task.completed)}>
                                        {task.completed && '✓'}
                                    </div>
                                    <span style={styles.taskText(task.completed)}>
                                        {task.task}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div style={styles.progressBar}>
                            <div style={styles.progressFill(percent)} />
                        </div>
                        <p style={{ fontSize: '0.625rem', color: '#9ca3af', marginTop: '0.5rem', textAlign: 'right' }}>
                            {completedCount}/{m.checklist.length} Tasks
                        </p>
                    </div>
                )
            })}
        </div>
    )
}
