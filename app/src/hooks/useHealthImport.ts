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

    // Parse Apple Health export.xml format (Native Export)
    const parseXML = (xmlText: string): SleepEntry[] => {
        const entries: SleepEntry[] = []
        const recordRegex = /<Record[^>]*type="HKCategoryTypeIdentifierSleepAnalysis"[^>]*startDate="([^"]+)"[^>]*endDate="([^"]+)"[^>]*value="([^"]+)"/g
        let match
        const dailyAggregator: Record<string, { start: number, end: number }> = {}
        while ((match = recordRegex.exec(xmlText)) !== null) {
            const startDateStr = match[1]
            const endDateStr = match[2]
            const value = match[3]
            if (value.includes('Asleep') || value.includes('InBed')) {
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

    // STREAMING version for massive files (Giga-files)
    const parseStreamedXML = async (file: File, onProgress?: (p: number) => void): Promise<SleepEntry[]> => {
        const entries: SleepEntry[] = []
        const totalSize = file.size
        let processedSize = 0
        const stream = file.stream()
        const reader = stream.getReader()
        const decoder = new TextDecoder()
        const recordRegex = /<Record[^>]*type="HKCategoryTypeIdentifierSleepAnalysis"[^>]*startDate="([^"]+)"[^>]*endDate="([^"]+)"[^>]*value="([^"]+)"/g
        const dailyAggregator: Record<string, { start: number, end: number }> = {}
        let buffer = ''
        let lastYield = Date.now()
        while (true) {
            const { done, value } = await reader.read()
            if (done) break
            processedSize += value.length
            buffer += decoder.decode(value, { stream: true })
            if (Date.now() - lastYield > 300) {
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
            const lastAngleBracket = buffer.lastIndexOf('>')
            if (lastAngleBracket !== -1) {
                buffer = buffer.substring(lastAngleBracket + 1)
                recordRegex.lastIndex = 0
            } else if (buffer.length > 50000) {
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

    // Import sleep data
    const importSleepData = useCallback(async (fileContent: string, fileType: 'csv' | 'json' | 'xml'): Promise<ImportResult> => {
        if (!user?.id) return { success: false, imported: 0, errors: ['Not authenticated'] }
        setImporting(true)
        try {
            let entries: SleepEntry[] = []
            if (fileType === 'csv') entries = parseAppleHealthCSV(fileContent)
            else if (fileType === 'json') entries = parseJSON(fileContent)
            else if (fileType === 'xml') entries = parseXML(fileContent)

            if (entries.length === 0) return { success: false, imported: 0, errors: ['No valid entries found'] }

            const payload = entries.map(entry => ({
                user_id: user.id,
                date: entry.date,
                bedtime_actual: entry.bedtime || null,
                wake_actual: entry.wakeTime || null,
                sleep_duration_minutes: entry.durationMinutes || null,
                imported_from: 'apple_health',
                on_schedule: entry.bedtime ? entry.bedtime <= '23:30' : false,
            }))

            const { error } = await supabase.from('sleep_logs').upsert(payload, { onConflict: 'user_id,date' })
            return { success: !error, imported: error ? 0 : entries.length, errors: error ? [error.message] : [] }
        } catch (e) {
            return { success: false, imported: 0, errors: [`Parse error: ${e}`] }
        } finally {
            setImporting(false)
        }
    }, [user?.id])

    // Handle file upload
    const handleFileUpload = useCallback(async (file: File): Promise<ImportResult> => {
        let fileType: 'csv' | 'json' | 'xml' = 'csv'
        if (file.name.endsWith('.json')) fileType = 'json'
        else if (file.name.endsWith('.xml')) fileType = 'xml'
        if (fileType === 'xml') {
            setImporting(true)
            setProgress(0)
            const entries = await parseStreamedXML(file, setProgress)
            if (!user?.id) return { success: false, imported: 0, errors: ['Not authenticated'] }
            const payload = entries.map(entry => ({
                user_id: user.id,
                date: entry.date,
                bedtime_actual: entry.bedtime || null,
                wake_actual: entry.wakeTime || null,
                sleep_duration_minutes: entry.durationMinutes || null,
                imported_from: 'apple_health',
                on_schedule: entry.bedtime ? entry.bedtime <= '23:30' : false,
            }))
            const { error } = await supabase.from('sleep_logs').upsert(payload, { onConflict: 'user_id,date' })
            const result = { success: !error, imported: error ? 0 : entries.length, errors: error ? [error.message] : [] }
            setLastResult(result)
            setImporting(false)
            setProgress(0)
            return result
        }
        const content = await file.text()
        const result = await importSleepData(content, fileType)
        setLastResult(result)
        return result
    }, [importSleepData, user?.id])

    return {
        importing,
        progress,
        lastResult,
        importSleepData,
        handleFileUpload,
        clearResult: () => setLastResult(null)
    }
}
