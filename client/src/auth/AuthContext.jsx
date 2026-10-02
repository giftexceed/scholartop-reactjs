import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, hashPassword, nextMatric, randomSalt } from '../db/db'
import { seedIfEmpty } from '../db/seed'

const SESSION_KEY = 'ep_session'
const AuthContext = createContext(null)

function readSession() {
    try { return Number(localStorage.getItem(SESSION_KEY)) || null } catch { return null }
}

function writeSession(id) {
    try {
        if (id) localStorage.setItem(SESSION_KEY, String(id))
        else localStorage.removeItem(SESSION_KEY)
    } catch { /* storage unavailable (private mode) — session lasts for this tab only */ }
}

export function AuthProvider({ children }) {
    const [ready, setReady] = useState(false)
    const [userId, setUserId] = useState(readSession)

    useEffect(() => {
        seedIfEmpty().finally(() => setReady(true))
    }, [])

    // Live: profile edits anywhere in the app re-render consumers.
    const user = useLiveQuery(() => (userId ? db.users.get(userId) : null), [userId])

    const startSession = useCallback((id) => { writeSession(id); setUserId(id) }, [])

    const login = useCallback(async (email, password) => {
        const found = await db.users.where('email').equals(email.trim().toLowerCase()).first()
        if (!found || (await hashPassword(password, found.salt)) !== found.passwordHash) {
            throw new Error('Incorrect email or password.')
        }
        startSession(found.id)
        return found
    }, [startSession])

    const register = useCallback(async ({ name, email, phone, password, programId, level }) => {
        email = email.trim().toLowerCase()
        if (await db.users.where('email').equals(email).count()) {
            throw new Error('An account with this email already exists.')
        }
        const salt = randomSalt()
        const passwordHash = await hashPassword(password, salt)
        const matric = await nextMatric()
        const id = await db.transaction('rw', db.users, db.students, db.courses, db.enrollments, async () => {
            const studentId = await db.students.add({
                matric, name, email, phone, gender: '', programId, level,
                status: 'Active', enrolledAt: new Date().toISOString(),
            })
            const uid = await db.users.add({
                name, email, phone, role: 'student', salt, passwordHash, studentId,
                createdAt: new Date().toISOString(),
            })
            await db.students.update(studentId, { userId: uid })
            const courses = await db.courses.where('programId').equals(programId).toArray()
            await db.enrollments.bulkAdd(courses.map((c) => ({ studentId, courseId: c.id, score: null })))
            return uid
        })
        startSession(id)
        return id
    }, [startSession])

    const logout = useCallback(() => startSession(null), [startSession])

    const value = useMemo(() => ({
        ready,
        // undefined while the live query is loading, null when signed out / user deleted
        user: userId ? user : null,
        loading: !ready || (userId != null && user === undefined),
        login, register, logout,
    }), [ready, userId, user, login, register, logout])

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
