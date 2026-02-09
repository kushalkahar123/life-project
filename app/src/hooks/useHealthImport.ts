import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface ImportResult {
    success: boolean
    imported: number
    errors: string[]
}

interface SleepEntry {
    date: string
    bedtime: string
    wakeTime: string
    durationMinutes: number
}

export function useHealthImport() {
    const { user } = useAuth()
    const [importing, setImporting] = useState(false)
    const [progress, setProgress] = useState(0)
    const [lastResult, setLastResult] = useState<ImportResult | null>(null)

    // Helper to batch upsert records to Supabase
    const batchUpsert = async (entries: SleepEntry[]): Promise<{ count: number, errorLines: string[] }> => {
        if (!user?.id) return { count: 0, errorLines: ['Not authenticated'] }

        let count = 0
        const errorLines: string[] = []
        const chunkSize = 200 // Safe chunk size for HTTP payloads

        for (let i = 0; i < entries.length; i += chunkSize) {
            const chunk = entries.slice(i, i + chunkSize)
            const payload = chunk.map(entry => ({
                user_id: user.id,
                date: entry.date,
                bedtime_actual: entry.bedtime || null,
                wake_actual: entry.wakeTime || null,
                sleep_duration_minutes: entry.durationMinutes || null,
                imported_from: 'apple_health'
                // on_schedule is GENERATED ALWAYS in DB, do NOT include it here
            }))

            const { error } = await supabase
                .from('sleep_logs')
                .upsert(payload, { onConflict: 'user_id,date' })

            if (error) {
                errorLines.push(`Chunk ${i / chunkSize + 1}: ${error.message}`)
            } else {
                count += chunk.length
            }
        }

        return { count, errorLines }
    }

    // Parse Apple Health export CSV format
    const parseAppleHealthCSV = (csvText: string): SleepEntry[] => {
        const lines = csvText.trim().split('\n')
        const entries: SleepEntry[] = []

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i]
            if (!line.trim()) continue
            const cols = line.split(',').map(c => c.trim().replace(/"/g, ''))
            if (cols.length >= 3) {
                try {
                    const date = cols[0]
                    const bedtime = cols[1]
                    const wakeTime = cols[2]
                    const duration = cols[3] ? parseFloat(cols[3]) * 60 : 0
                    if (date && (bedtime || wakeTime)) {
                        entries.push({
                            date: new Date(date).toISOString().split('T')[0],
                            bedtime: bedtime || '',
                            wakeTime: wakeTime || '',
                            durationMinutes: duration || 0
                        })
                    }
                } catch { }
            }
        }
        return entries
    }

    // Parse JSON format (flexible)
    const parseJSON = (jsonText: string): SleepEntry[] => {
        try {
            const data = JSON.parse(jsonText)
            const entries: SleepEntry[] = []
            const items = Array.isArray(data) ? data : (data.entries || data.data || [])
            for (const item of items) {
                const date = item.date || item.startDate || item.start_date
                const bedtime = item.bedtime || item.startTime || item.start_time || ''
                const wakeTime = item.wakeTime || item.endTime || item.end_time || item.wake_time || ''
                const duration = item.duration || item.durationMinutes || item.duration_minutes || (item.durationHours ? item.durationHours * 60 : 0)
                if (date) {
                    entries.push({
                        date: new Date(date).toISOString().split('T')[0],
                        bedtime,
                        wakeTime,
                        durationMinutes: duration
                    })
                }
            }
            return entries
        } catch {
            return []
        }
    }

    // Async streaming XML parser for massive files
    const parseStreamedXML = async (file: File, onProgress?: (p: number) => void): Promise<SleepEntry[]> => {
        const entries: SleepEntry[] = []
        const totalSize = file.size
        let processedSize = 0
        const stream = file.stream()
        const reader = stream.getReader()
        const decoder = new TextDecoder()

        // Specifically look for Sleep records
        const recordRegex = /<Record[^>]*type="HKCategoryTypeIdentifierSleepAnalysis"[^>]*startDate="([^"]+)"[^>]*endDate="([^"]+)"[^>]*value="([^"]+)"/g
        const dailyAggregator: Record<string, { start: number, end: number }> = {}

        let buffer = ''
        let lastYield = Date.now()

        while (true) {
            const { done, value } = await reader.read()
            if (done) break

            processedSize += value.length
            buffer += decoder.decode(value, { stream: true })

            // UI breathing room
            if (Date.now() - lastYield > 400) {
                if (onProgress) onProgress(Math.floor((processedSize / totalSize) * 100))
                await new Promise(resolve => setTimeout(resolve, 1))
                lastYield = Date.now()
            }

            let match
            while ((match = recordRegex.exec(buffer)) !== null) {
                const startDateStr = match[1]
                const endDateStr = match[2]
                const valueStr = match[3]

                if (valueStr.includes('Asleep') || valueStr.includes('InBed')) {
                    const start = new Date(startDateStr).getTime()
                    const end = new Date(endDateStr).getTime()
                    const date = new Date(startDateStr).toISOString().split('T')[0]

                    if (!dailyAggregator[date]) {
                        dailyAggregator[date] = { start, end }
                    } else {
                        dailyAggregator[date].start = Math.min(dailyAggregator[date].start, start)
                        dailyAggregator[date].end = Math.max(dailyAggregator[date].end, end)
                    }
                }
            }

            // Clear processed records from buffer
            const lastAngleBracket = buffer.lastIndexOf('>')
            if (lastAngleBracket !== -1) {
                buffer = buffer.substring(lastAngleBracket + 1)
                recordRegex.lastIndex = 0
            } else if (buffer.length > 50000) {
                buffer = '' // Buffer safety
            }
        }

        if (onProgress) onProgress(100)

        for (const [date, times] of Object.entries(dailyAggregator)) {
            const start = new Date(times.start)
            const end = new Date(times.end)
            const durationMinutes = Math.round((times.end - times.start) / 60000)
            const bedtime = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`
            const wakeTime = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`
            entries.push({ date, bedtime, wakeTime, durationMinutes })
        }

        return entries
    }

    // Public API to handle any file
    const handleFileUpload = useCallback(async (file: File): Promise<ImportResult> => {
        if (!user?.id) return { success: false, imported: 0, errors: ['Not authenticated'] }

        setImporting(true)
        setProgress(0)
        setLastResult(null)

        try {
            let entries: SleepEntry[] = []

            if (file.name.endsWith('.xml')) {
                entries = await parseStreamedXML(file, setProgress)
            } else {
                const content = await file.text()
                if (file.name.endsWith('.json')) {
                    entries = parseJSON(content)
                } else if (file.name.endsWith('.csv')) {
                    entries = parseAppleHealthCSV(content)
                }
            }

            if (entries.length === 0) {
                const result = { success: false, imported: 0, errors: ['No valid sleep records found in file.'] }
                setLastResult(result)
                return result
            }

            // Sync with DB using batch upsert
            const { count, errorLines } = await batchUpsert(entries)

            const result = {
                success: count > 0,
                imported: count,
                errors: errorLines
            }
            setLastResult(result)
            return result

        } catch (e: any) {
            const result = { success: false, imported: 0, errors: [e?.message || String(e)] }
            setLastResult(result)
            return result
        } finally {
            setImporting(false)
            setProgress(0)
        }
    }, [user?.id])

    return {
        importing,
        progress,
        lastResult,
        handleFileUpload,
        clearResult: () => setLastResult(null)
    }
}
