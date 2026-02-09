interface DataPoint {
    date: string
    value: number
}

interface Props {
    data: DataPoint[]
    label: string
    color?: string
    height?: number
    showDots?: boolean
    targetValue?: number
}

const styles = {
    container: {
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '0.75rem',
        padding: '1rem',
        border: '1px solid rgba(255,255,255,0.1)',
    } as React.CSSProperties,
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.75rem',
    } as React.CSSProperties,
    label: {
        fontSize: '0.875rem',
        fontWeight: '600',
        color: '#d1d5db',
    } as React.CSSProperties,
    value: {
        fontSize: '0.75rem',
        color: '#9ca3af',
    } as React.CSSProperties,
    empty: {
        textAlign: 'center' as const,
        color: '#6b7280',
        fontSize: '0.875rem',
        padding: '2rem 0',
    },
}

export function TrendChart({ data, label, color = '#8b5cf6', height = 120, showDots = true, targetValue }: Props) {
    if (!data || data.length < 2) {
        return (
            <div style={styles.container}>
                <div style={styles.header}>
                    <span style={styles.label}>{label}</span>
                </div>
                <div style={styles.empty}>Not enough data yet. Keep logging!</div>
            </div>
        )
    }

    const values = data.map(d => d.value)
    const minVal = Math.min(...values) * 0.9
    const maxVal = Math.max(...values) * 1.1
    const range = maxVal - minVal || 1

    const width = 100
    const padding = 5
    const chartWidth = width - padding * 2
    const chartHeight = height - 20

    // Generate path
    const points = data.map((d, i) => {
        const x = padding + (i / (data.length - 1)) * chartWidth
        const y = chartHeight - ((d.value - minVal) / range) * (chartHeight - 20) + 10
        return { x, y, value: d.value, date: d.date }
    })

    // Create smooth curve using bezier
    let pathD = `M ${points[0].x} ${points[0].y}`
    for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1]
        const curr = points[i]
        const cpx = (prev.x + curr.x) / 2
        pathD += ` Q ${cpx} ${prev.y}, ${curr.x} ${curr.y}`
    }

    // Create area fill path
    const areaPath = pathD + ` L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`

    const latestValue = values[values.length - 1]
    const avgValue = values.reduce((a, b) => a + b, 0) / values.length

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <span style={styles.label}>{label}</span>
                <span style={styles.value}>
                    Latest: {latestValue.toFixed(1)} | Avg: {avgValue.toFixed(1)}
                </span>
            </div>
            <svg
                width="100%"
                height={height}
                viewBox={`0 0 ${width} ${height}`}
                preserveAspectRatio="none"
                style={{ display: 'block' }}
            >
                <defs>
                    <linearGradient id={`gradient-${label.replace(/\s/g, '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Target line */}
                {targetValue && (
                    <line
                        x1={padding}
                        y1={chartHeight - ((targetValue - minVal) / range) * (chartHeight - 20) + 10}
                        x2={width - padding}
                        y2={chartHeight - ((targetValue - minVal) / range) * (chartHeight - 20) + 10}
                        stroke="#22c55e"
                        strokeWidth="0.5"
                        strokeDasharray="2,2"
                        opacity="0.5"
                    />
                )}

                {/* Area fill */}
                <path
                    d={areaPath}
                    fill={`url(#gradient-${label.replace(/\s/g, '')})`}
                />

                {/* Line */}
                <path
                    d={pathD}
                    fill="none"
                    stroke={color}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Dots */}
                {showDots && points.map((p, i) => (
                    <circle
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r="2"
                        fill={color}
                    />
                ))}
            </svg>
        </div>
    )
}
