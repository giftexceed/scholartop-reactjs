import { DataError } from '../errors'
import { db, row } from '../local/db'
import { requireAdmin } from './_context'

export const ATTENDANCE_STATUSES = ['Present', 'Late', 'Absent']

/** Active students plus the status recorded for each on `date` (YYYY-MM-DD). */
export async function getRegister(date) {
    const [students, records] = await Promise.all([
        db.students.where('status').equals('Active').toArray(),
        db.attendance.where('date').equals(date).toArray(),
    ])
    return {
        students: students.sort((a, b) => a.name.localeCompare(b.name)),
        statusByStudent: Object.fromEntries(records.map((r) => [r.studentId, r.status])),
    }
}

/** Upsert one or more students' status for a date. */
export async function markAttendance(studentIds, date, status) {
    await requireAdmin()
    if (!ATTENDANCE_STATUSES.includes(status)) throw new DataError('invalid', 'Unknown attendance status.')
    await db.transaction('rw', db.attendance, async () => {
        for (const studentId of [].concat(studentIds)) {
            const existing = await db.attendance.where({ studentId, date }).first()
            if (existing) await db.attendance.update(existing.id, { status })
            else await db.attendance.add(row({ studentId, date, status }))
        }
    })
}

/** Attendance rate per school day, oldest first: [{ date, rate }] (rate = % present or late). */
export async function getDailyAttendance(days = 10) {
    const all = await db.attendance.toArray()
    const byDate = {}
    for (const a of all) (byDate[a.date] ??= []).push(a)
    return Object.keys(byDate).sort().slice(-days).map((date) => {
        const rows = byDate[date]
        return { date, total: rows.length, present: rows.filter((r) => r.status !== 'Absent').length }
    })
}
