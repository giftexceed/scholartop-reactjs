// Date-only strings (YYYY-MM-DD) are parsed as local dates, not UTC midnight.
export const formatDate = (iso, opts = { day: 'numeric', month: 'short', year: 'numeric' }) =>
    new Date(iso.length === 10 ? `${iso}T00:00` : iso).toLocaleDateString(undefined, opts)

export function timeAgo(iso) {
    const s = (Date.now() - new Date(iso).getTime()) / 1000
    if (s < 60) return 'just now'
    if (s < 3600) return `${Math.floor(s / 60)}m ago`
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`
    if (s < 604800) return `${Math.floor(s / 86400)}d ago`
    return formatDate(iso)
}
