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

        // Ensure profile exists first to prevent foreign key errors
        try {
            await supabase.from('profiles').upsert({
                id: user.id,
                email: user.email,
                display_name: user.user_metadata?.display_name || 'User'
            }, { onConflict: 'id' })
        } catch (e) {
            console.error('Profile sync failed:', e)
        }

        let count = 0
        const errorLines: string[] = []
        const chunkSize = 100 // Smaller chunks for reliability

        // Sort entries by date
        const sortedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date))

        for (let i = 0; i < sortedEntries.length; i += chunkSize) {
            const chunk = sortedEntries.slice(i, i + chunkSize)
            const payload = chunk.map(entry => ({
                user_id: user.id,
                date: entry.date,
                bedtime_actual: entry.bedtime || null,
                wake_actual: entry.wakeTime || null,
                sleep_duration_minutes: entry.durationMinutes || null,
                imported_from: 'apple_health'
            }))

            const { error } = await supabase
                .from('sleep_logs')
                .upsert(payload, { onConflict: 'user_id,date' })

            if (error) {
                // If the error suggests the column doesn't exist, we skip imported_from
                if (error.message.includes('imported_from')) {
                    const fallbackPayload = payload.map(({ imported_from, ...rest }) => rest)
                    const { error: retryError } = await supabase.from('sleep_logs').upsert(fallbackPayload, { onConflict: 'user_id,date' })
                    if (!retryError) count += chunk.length
                    else errorLines.push(retryError.message)
                } else {
                    errorLines.push(`${error.message} (Start Date: ${chunk[0].date})`)
                }
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
        const dailyAggregator: Record<string, { start: number, end: number }> = {}

        let buffer = ''
        let lastYield = Date.now()

        while (true) {
            const { done, value } = await reader.read()
            if (done) break

            processedSize += value.length
            buffer += decoder.decode(value, { stream: true })

            // Progress & Yielding
            if (Date.now() - lastYield > 300) {
                if (onProgress) onProgress(Math.floor((processedSize / totalSize) * 100))
                await new Promise(resolve => setTimeout(resolve, 1))
                lastYield = Date.now()
            }

            // Robust XML Record Parsing (order-independent)
            let recordStart = buffer.indexOf('<Record')
            while (recordStart !== -1) {
                const recordEnd = buffer.indexOf('/>', recordStart)
                if (recordEnd === -1) break // Wait for more data

                const tag = buffer.substring(recordStart, recordEnd + 2)

                // Only process sleep analysis records
                if (tag.includes('HKCategoryTypeIdentifierSleepAnalysis')) {
                    const startMatch = tag.match(/startDate="([^"]+)"/)
                    const endMatch = tag.match(/endDate="([^"]+)"/)
                    const valueMatch = tag.match(/value="([^"]+)"/)

                    if (startMatch && endMatch && valueMatch) {
                        const val = valueMatch[1]
                        // Match Asleep, InBed, Core, Deep, REM (supports full strings or IDs 1-5)
                        const isSleepRecord = val.includes('Asleep') ||
                            val.includes('InBed') ||
                            /^[1-5]$/.test(val) ||
                            val.includes('SleepAnalysis')

                        if (isSleepRecord) {
                            const startTs = new Date(startMatch[1]).getTime()
                            const endTs = new Date(endMatch[1]).getTime()
                            const dateStr = new Date(startMatch[1]).toISOString().split('T')[0]

                            if (!isNaN(startTs) && !isNaN(endTs)) {
                                if (!dailyAggregator[dateStr]) {
                                    dailyAggregator[dateStr] = { start: startTs, end: endTs }
                                } else {
                                    dailyAggregator[dateStr].start = Math.min(dailyAggregator[dateStr].start, startTs)
                                    dailyAggregator[dateStr].end = Math.max(dailyAggregator[dateStr].end, endTs)
                                }
                            }
                        }
                    }
                }
                recordStart = buffer.indexOf('<Record', recordEnd)
            }

            // Buffer cleanup: keep only the unfinished tag at the end
            const lastRecordPos = buffer.lastIndexOf('<Record')
            const lastClosePos = buffer.lastIndexOf('/>')
            if (lastRecordPos > lastClosePos) {
                buffer = buffer.substring(lastRecordPos)
            } else {
                buffer = ''
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
                const result = { success: false, imported: 0, errors: ['No sleep records found. Ensure your Health Export includes Sleep data.'] }
                setLastResult(result)
                return result
            }

            const { count, errorLines } = await batchUpsert(entries)
            const result = { success: count > 0, imported: count, errors: errorLines }
            setLastResult(result)
            return result
        } catch (e: any) {
            const result = { success: false, imported: 0, errors: [e?.message || 'Unexpected parse error'] }
            setLastResult(result)
            return result
        } finally {
            setImporting(false)
            setProgress(0)
        }
    }, [user?.id, user?.email, user?.user_metadata])

    return { importing, progress, lastResult, handleFileUpload, clearResult: () => setLastResult(null) }
}
