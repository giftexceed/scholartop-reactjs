// Internal helpers for the local adapter. These mimic what a backend does for
// every request: identify the caller and check permissions.
import { db } from '../local/db'
import { readSession } from '../local/session'
import { DataError } from '../errors'

// Never let password material leave the data layer.
export const toPublicUser = (u) => {
    if (!u) return null
    // eslint-disable-next-line no-unused-vars
    const { passwordHash, salt, ...rest } = u
    return rest
}

export async function currentUser() {
    const id = readSession()
    return id ? (await db.users.get(id)) ?? null : null
}

export async function requireUser() {
    const user = await currentUser()
    if (!user) throw new DataError('unauthorized', 'Please sign in again.')
    return user
}

export async function requireAdmin() {
    const user = await requireUser()
    if (user.role !== 'admin') throw new DataError('forbidden', 'Only administrators can do that.')
    return user
}

// Matric numbers come from a counter so they never repeat, even after deletes.
export async function nextMatric() {
    const seq = ((await db.meta.get('matricSeq'))?.value ?? 0) + 1
    await db.meta.put({ key: 'matricSeq', value: seq })
    return seq
}
