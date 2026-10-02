import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as api from '../data/api'
import { useLiveData } from '../data/useLiveData'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [ready, setReady] = useState(false)
    const [userId, setUserId] = useState(api.getSessionUserId)

    useEffect(() => {
        api.initData().finally(() => setReady(true))
    }, [])

    // Live: profile edits anywhere in the app re-render consumers.
    const user = useLiveData(() => api.getUser(userId), [userId])

    const login = useCallback(async (email, password) => {
        const u = await api.login(email, password)
        setUserId(u.id)
        return u
    }, [])

    const register = useCallback(async (input) => {
        const u = await api.register(input)
        setUserId(u.id)
        return u
    }, [])

    const logout = useCallback(() => {
        api.logout()
        setUserId(null)
    }, [])

    const value = useMemo(() => ({
        ready,
        // null when signed out or the account was deleted
        user: userId ? user ?? null : null,
        loading: !ready || (userId != null && user === undefined),
        login, register, logout,
    }), [ready, userId, user, login, register, logout])

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
