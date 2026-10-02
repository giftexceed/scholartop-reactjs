import Dexie from 'dexie'

// Local (browser-only) implementation of the data store, backed by IndexedDB.
// Only files in src/data/ may import this — the UI talks to src/data/api.
//
// Rows use string UUID primary keys and ISO-8601 timestamps so they map 1:1
// onto a hosted database (e.g. Postgres `uuid` / `timestamptz` columns).
export const db = new Dexie('topscholars')

db.version(1).stores({
    users: 'id, &email, role',
    programs: 'id, &code',
    courses: 'id, &code, programId',
    students: 'id, &matric, programId, status, userId',
    enrollments: 'id, studentId, courseId, &[studentId+courseId]',
    attendance: 'id, date, studentId, &[studentId+date]',
    announcements: 'id, createdAt',
    messages: 'id, createdAt',
    meta: 'key',
})

export const uuid = () =>
    crypto.randomUUID?.() ??
    '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
        (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16))

export const now = () => new Date().toISOString()

// Adds an id and createdAt, like a database default would.
export const row = (fields) => ({ id: uuid(), createdAt: now(), ...fields })
