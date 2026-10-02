import { DataError } from '../errors'
import { db } from '../local/db'
import { requireAdmin, toPublicUser } from './_context'

export const ROLES = ['student', 'admin']

/** All accounts (no password fields) with the linked student's matric number. */
export async function listUsers() {
    const users = (await db.users.toArray()).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    const students = await db.students.bulkGet(users.map((u) => u.studentId ?? ''))
    return users.map((u, i) => ({ ...toPublicUser(u), matric: students[i]?.matric ?? null }))
}

export async function setUserRole(id, role) {
    const me = await requireAdmin()
    if (!ROLES.includes(role)) throw new DataError('invalid', 'Unknown role.')
    if (id === me.id) throw new DataError('forbidden', "You can't change your own role.")
    await db.users.update(id, { role })
}

/** Deletes the login account; the student record (if any) is kept. */
export async function deleteUser(id) {
    const me = await requireAdmin()
    if (id === me.id) throw new DataError('forbidden', "You can't delete your own account.")
    await db.transaction('rw', db.users, db.students, async () => {
        const u = await db.users.get(id)
        if (u?.studentId) await db.students.update(u.studentId, { userId: null })
        await db.users.delete(id)
    })
}
