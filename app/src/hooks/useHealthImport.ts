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
    const [lastResult, setLastResult] = useState<ImportResult | null>(null)

    // Parse Apple Health export CSV format
    const parseAppleHealthCSV = (csvText: string): SleepEntry[] => {
        const lines = csvText.trim().split('\n')
        const entries: SleepEntry[] = []

        // Skip header row
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i]
            if (!line.trim()) continue

            const cols = line.split(',').map(c => c.trim().replace(/"/g, ''))

            // Expected format: Date, Bedtime, Wake Time, Duration (hours)
            // Or: startDate, endDate, value (Apple Health standard)
            if (cols.length >= 3) {
                try {
                    const date = cols[0]
                    const bedtime = cols[1]
                    const wakeTime = cols[2]
                    const duration = cols[3] ? parseFloat(cols[3]) * 60 : 0 // hours to minutes

                    if (date && (bedtime || wakeTime)) {
                        entries.push({
                            date: new Date(date).toISOString().split('T')[0],
                            bedtime: bedtime || '',
                            wakeTime: wakeTime || '',
                            durationMinutes: duration || 0
                        })
                    }
                } catch {
                    // Skip invalid rows
                }
            }
        }

        return entries
    }

    // Parse JSON format (flexible)
    const parseJSON = (jsonText: string): SleepEntry[] => {
        try {
            const data = JSON.parse(jsonText)
            const entries: SleepEntry[] = []

            // Handle array of entries
            const items = Array.isArray(data) ? data : (data.entries || data.data || [])

            for (const item of items) {
                const date = item.date || item.startDate || item.start_date
                const bedtime = item.bedtime || item.startTime || item.start_time || ''
                const wakeTime = item.wakeTime || item.endTime || item.end_time || item.wake_time || ''
                const duration = item.duration || item.durationMinutes || item.duration_minutes ||
                    (item.durationHours ? item.durationHours * 60 : 0)

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
        // Use regex for speed/memory efficiency since export.xml can be >100MB
        const recordRegex = /<Record[^>]*type="HKCategoryTypeIdentifierSleepAnalysis"[^>]*startDate="([^"]+)"[^>]*endDate="([^"]+)"[^>]*value="([^"]+)"/g

        let match
        const dailyAggregator: Record<string, { start: number, end: number }> = {}

        while ((match = recordRegex.exec(xmlText)) !== null) {
            const startDateStr = match[1]
            const endDateStr = match[2]
            const value = match[3]

            // We primarily care about "Asleep" stages or "In Bed"
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

            entries.push({
                date,
                bedtime,
                wakeTime,
                durationMinutes
            })
        }

        return entries
    }

    // Import sleep data
    const importSleepData = useCallback(async (fileContent: string, fileType: 'csv' | 'json' | 'xml'): Promise<ImportResult> => {
        if (!user?.id) {
            return { success: false, imported: 0, errors: ['Not authenticated'] }
        }

        setImporting(true)
        const errors: string[] = []
        let imported = 0

        try {
            let entries: SleepEntry[] = []
            if (fileType === 'csv') entries = parseAppleHealthCSV(fileContent)
            else if (fileType === 'json') entries = parseJSON(fileContent)
            else if (fileType === 'xml') entries = parseXML(fileContent)

            if (entries.length === 0) {
                return { success: false, imported: 0, errors: ['No valid entries found in file'] }
            }

            // Process entries in batches
            for (const entry of entries) {
                // Check if entry already exists
                const { data: existing } = await supabase
                    .from('sleep_logs')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('date', entry.date)
                    .single()

                if (existing) {
                    // Update existing
                    const { error } = await supabase
                        .from('sleep_logs')
                        .update({
                            bedtime_actual: entry.bedtime || null,
                            wake_actual: entry.wakeTime || null,
                            sleep_duration_minutes: entry.durationMinutes || null,
                            imported_from: 'apple_health'
                        })
                        .eq('id', existing.id)

                    if (error) {
                        errors.push(`Failed to update ${entry.date}: ${error.message}`)
                    } else {
                        imported++
                    }
                } else {
                    // Insert new
                    const { error } = await supabase
                        .from('sleep_logs')
                        .insert({
                            user_id: user.id,
                            date: entry.date,
                            bedtime_actual: entry.bedtime || null,
                            wake_actual: entry.wakeTime || null,
                            sleep_duration_minutes: entry.durationMinutes || null,
                            on_schedule: entry.bedtime ? entry.bedtime <= '23:30' : false,
                            imported_from: 'apple_health'
                        })

                    if (error) {
                        errors.push(`Failed to import ${entry.date}: ${error.message}`)
                    } else {
                        imported++
                    }
                }
            }

            const result = {
                success: imported > 0,
                imported,
                errors
            }
            setLastResult(result)
            return result

        } catch (e) {
            const result = {
                success: false,
                imported: 0,
                errors: [`Parse error: ${e}`]
            }
            setLastResult(result)
            return result
        } finally {
            setImporting(false)
        }
    }, [user?.id])

    // Handle file upload
    const handleFileUpload = useCallback(async (file: File): Promise<ImportResult> => {
        let fileType: 'csv' | 'json' | 'xml' = 'csv'
        if (file.name.endsWith('.json')) fileType = 'json'
        else if (file.name.endsWith('.xml')) fileType = 'xml'

        const content = await file.text()
        return importSleepData(content, fileType)
    }, [importSleepData])

    return {
        importing,
        lastResult,
        importSleepData,
        handleFileUpload,
        clearResult: () => setLastResult(null)
    }
}
