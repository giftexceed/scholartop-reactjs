// The signed-in user's id, persisted in localStorage. With a real backend this
// would hold an access token instead (or be managed by the auth SDK).
const KEY = 'ts_session'

export function readSession() {
    try { return localStorage.getItem(KEY) || null } catch { return null }
}

export function writeSession(id) {
    try {
        if (id) localStorage.setItem(KEY, id)
        else localStorage.removeItem(KEY)
    } catch { /* storage unavailable (private mode) — session lasts for this tab only */ }
}
