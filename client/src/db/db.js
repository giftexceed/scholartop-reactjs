import Dexie from 'dexie'

// All portal data lives in the browser's IndexedDB. Nothing leaves the device.
export const db = new Dexie('easypoint')

db.version(1).stores({
    users: '++id, &email, role, studentId',
    programs: '++id, &code',
    courses: '++id, &code, programId',
    students: '++id, &matric, email, programId, level, status, userId',
    enrollments: '++id, studentId, courseId, &[studentId+courseId]',
    attendance: '++id, date, studentId, &[studentId+date]',
    announcements: '++id, createdAt',
    messages: '++id, createdAt, read',
    meta: 'key',
})

const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')

export const randomSalt = () => toHex(crypto.getRandomValues(new Uint8Array(16)))

// Demo-grade hashing (SHA-256 + per-user salt). Fine for a local-only portal,
// not a substitute for server-side auth.
export async function hashPassword(password, salt) {
    const data = new TextEncoder().encode(`${salt}:${password}`)
    return toHex(await crypto.subtle.digest('SHA-256', data))
}

// Local calendar date as YYYY-MM-DD (toISOString would give the UTC date).
export const localISODate = (d = new Date()) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const todayISO = () => localISODate()

export function gradeFor(score) {
    if (score == null) return '—'
    if (score >= 70) return 'A'
    if (score >= 60) return 'B'
    if (score >= 50) return 'C'
    if (score >= 45) return 'D'
    if (score >= 40) return 'E'
    return 'F'
}

const GRADE_POINTS = { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 }

// 5-point CGPA, weighted by course units.
export function computeGPA(rows) {
    let points = 0
    let units = 0
    for (const { score, units: u } of rows) {
        if (score == null) continue
        points += GRADE_POINTS[gradeFor(score)] * u
        units += u
    }
    return units ? (points / units).toFixed(2) : '—'
}

export async function nextMatric() {
    const year = new Date().getFullYear()
    const last = await db.students.orderBy('id').last()
    return `EP/${year}/${String((last?.id ?? 0) + 1).padStart(4, '0')}`
}
