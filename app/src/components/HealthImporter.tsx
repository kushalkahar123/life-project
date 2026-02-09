import { useRef, useState } from 'react'
import { useHealthImport } from '../hooks/useHealthImport'

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
        marginBottom: '0.75rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
    } as React.CSSProperties,
    description: {
        fontSize: '0.75rem',
        color: '#9ca3af',
        marginBottom: '1rem',
        lineHeight: 1.5,
    } as React.CSSProperties,
    uploadZone: {
        border: '2px dashed rgba(139,92,246,0.3)',
        borderRadius: '0.5rem',
        padding: '1.5rem',
        textAlign: 'center' as const,
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
    uploadZoneActive: {
        border: '2px dashed rgba(139,92,246,0.8)',
        background: 'rgba(139,92,246,0.1)',
    },
    uploadIcon: {
        fontSize: '2rem',
        marginBottom: '0.5rem',
    },
    uploadText: {
        fontSize: '0.875rem',
        color: '#a78bfa',
        marginBottom: '0.25rem',
    } as React.CSSProperties,
    uploadHint: {
        fontSize: '0.625rem',
        color: '#6b7280',
    } as React.CSSProperties,
    hiddenInput: {
        display: 'none',
    } as React.CSSProperties,
    result: (success: boolean) => ({
        marginTop: '1rem',
        padding: '0.75rem',
        borderRadius: '0.5rem',
        background: success ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
        border: `1px solid ${success ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
    }),
    resultText: (success: boolean) => ({
        fontSize: '0.75rem',
        color: success ? '#22c55e' : '#ef4444',
    }),
    loading: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        padding: '1rem',
        color: '#a78bfa',
        fontSize: '0.875rem',
    } as React.CSSProperties,
    instructions: {
        marginTop: '1rem',
        padding: '0.75rem',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '0.5rem',
    } as React.CSSProperties,
    instructionTitle: {
        fontSize: '0.75rem',
        fontWeight: '600',
        color: '#d1d5db',
        marginBottom: '0.5rem',
    } as React.CSSProperties,
    instructionList: {
        fontSize: '0.625rem',
        color: '#9ca3af',
        paddingLeft: '1rem',
        margin: 0,
        lineHeight: 1.8,
    } as React.CSSProperties,
}

export function HealthImporter() {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { importing, progress, lastResult, handleFileUpload, clearResult } = useHealthImport()
    const [dragActive, setDragActive] = useState(false)

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true)
        } else if (e.type === 'dragleave') {
            setDragActive(false)
        }
    }

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            await handleFileUpload(e.dataTransfer.files[0])
        }
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            await handleFileUpload(e.target.files[0])
        }
    }

    const handleClick = () => {
        clearResult()
        fileInputRef.current?.click()
    }

    return (
        <div style={styles.container}>
            <div style={styles.title}>
                <span>📱</span> Import from Apple Health
            </div>
            <p style={styles.description}>
                Import your sleep data from Apple Health. Export your data as XML, CSV, or JSON and upload it here.
            </p>

            {importing ? (
                <div style={styles.loading}>
                    <span>⏳</span> {progress > 0 ? `Scanning: ${progress}%` : 'Importing...'}
                </div>
            ) : (
                <div
                    style={{
                        ...styles.uploadZone,
                        ...(dragActive ? styles.uploadZoneActive : {})
                    }}
                    onClick={handleClick}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <div style={styles.uploadIcon}>📤</div>
                    <div style={styles.uploadText}>
                        Drop file or click to upload
                    </div>
                    <div style={styles.uploadHint}>
                        Supports .xml, .csv and .json files
                    </div>
                </div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json,.xml"
                onChange={handleFileChange}
                style={styles.hiddenInput}
            />

            {lastResult && (
                <div style={styles.result(lastResult.success)}>
                    <div style={styles.resultText(lastResult.success)}>
                        {lastResult.success
                            ? `✓ Imported ${lastResult.imported} sleep entries`
                            : `✗ ${lastResult.errors[0] || 'Import failed'}${lastResult.errors.length > 1 ? ` (+${lastResult.errors.length - 1} more)` : ''}`
                        }
                    </div>
                </div>
            )}

            <div style={styles.instructions}>
                <div style={styles.instructionTitle}>How to export from Apple Health:</div>
                <ol style={styles.instructionList}>
                    <li>Open the Health app on your iPhone</li>
                    <li>Tap your profile picture → Export All Health Data</li>
                    <li>Extract the ZIP and find sleep data in export.xml</li>
                    <li>Or use an app like "Health Export" for CSV</li>
                </ol>
            </div>
        </div>
    )
}
