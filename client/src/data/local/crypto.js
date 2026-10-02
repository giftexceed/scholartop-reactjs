const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')

export const randomSalt = () => toHex(crypto.getRandomValues(new Uint8Array(16)))

// Demo-grade hashing (SHA-256 + per-user salt). Fine for a local-only portal;
// a real backend would hash server-side (bcrypt/argon2) or use a hosted auth provider.
export async function hashPassword(password, salt) {
    const data = new TextEncoder().encode(`${salt}:${password}`)
    return toHex(await crypto.subtle.digest('SHA-256', data))
}
