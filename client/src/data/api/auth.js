import { SITE } from '../../config/site'
import { DataError, mapConflict } from '../errors'
import { db, now, row, uuid } from '../local/db'
import { hashPassword, randomSalt } from '../local/crypto'
import { seedIfEmpty } from '../local/seed'
import { readSession, writeSession } from '../local/session'
import { nextMatric, requireUser, toPublicUser } from './_context'

export { DEMO_ADMIN, DEMO_STUDENT } from '../local/seed'

/** Prepare the data source (locally: seed demo data on first visit). */
export const initData = () => seedIfEmpty()

/** Id of the signed-in user, or null. */
export const getSessionUserId = () => readSession()

/** Public profile for a user id (no password fields), or null. */
export async function getUser(id) {
    return toPublicUser(id ? await db.users.get(id) : null)
}

export async function login(email, password) {
    const user = await db.users.where('email').equals(email.trim().toLowerCase()).first()
    if (!user || (await hashPassword(password, user.salt)) !== user.passwordHash) {
        throw new DataError('unauthorized', 'Incorrect email or password.')
    }
    writeSession(user.id)
    return toPublicUser(user)
}

export function logout() {
    writeSession(null)
}

/** Create a student account + student record and enroll in the program's courses. */
export async function register({ name, email, phone = '', password, programId, level }) {
    email = email.trim().toLowerCase()
    if (password.length < 6) throw new DataError('invalid', 'Password must be at least 6 characters.')
    const salt = randomSalt()
    const passwordHash = await hashPassword(password, salt)

    const user = await mapConflict(db.transaction('rw', db.users, db.students, db.courses, db.enrollments, db.meta, async () => {
        if (await db.users.where('email').equals(email).count()) {
            throw new DataError('conflict', 'An account with this email already exists.')
        }
        const seq = await nextMatric()
        const userId = uuid()
        const student = row({
            matric: `${SITE.matricPrefix}/${new Date().getFullYear()}/${String(seq).padStart(4, '0')}`,
            name, email, phone, gender: '', programId, level,
            status: 'Active', userId, enrolledAt: now(),
        })
        await db.students.add(student)
        const u = { id: userId, name, email, phone, role: 'student', studentId: student.id, salt, passwordHash, createdAt: now() }
        await db.users.add(u)
        const courseIds = await db.courses.where('programId').equals(programId).primaryKeys()
        await db.enrollments.bulkAdd(courseIds.map((courseId) => row({ studentId: student.id, courseId, score: null })))
        return u
    }), 'That email or matric number is already registered.')

    writeSession(user.id)
    return toPublicUser(user)
}

export async function changePassword(current, next) {
    const user = await requireUser()
    if ((await hashPassword(current, user.salt)) !== user.passwordHash) {
        throw new DataError('invalid', 'Current password is incorrect.')
    }
    if (next.length < 6) throw new DataError('invalid', 'New password must be at least 6 characters.')
    const salt = randomSalt()
    await db.users.update(user.id, { salt, passwordHash: await hashPassword(next, salt) })
}

/** Update the signed-in user's own name / email / phone (mirrored onto their student record). */
export async function updateProfile({ name, email, phone }) {
    const user = await requireUser()
    const changes = { name: name.trim(), email: email.trim().toLowerCase(), phone: phone.trim() }
    await mapConflict(db.transaction('rw', db.users, db.students, async () => {
        const taken = await db.users.where('email').equals(changes.email).first()
        if (taken && taken.id !== user.id) throw new DataError('conflict', 'That email is used by another account.')
        await db.users.update(user.id, changes)
        if (user.studentId) await db.students.update(user.studentId, changes)
    }), 'That email is used by another record.')
}
