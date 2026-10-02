import { useEffect, useRef } from 'react'

const ICONS = {
    home: 'M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z',
    users: 'M16 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm-8 1a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm8 1c-2.7 0-8 1.3-8 4v3h16v-3c0-2.7-5.3-4-8-4ZM8 14c-.3 0-.7 0-1.1.1A5 5 0 0 1 8 17v3H1v-2.5C1 15.3 5 14 8 14Z',
    student: 'M12 3 1 9l11 6 9-4.9V17h2V9zM5 13.2v4L12 21l7-3.8v-4L12 17z',
    book: 'M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5a1.5 1.5 0 0 0 0 3H20v-1h0v1H6.5A2.5 2.5 0 0 1 4 19.5z',
    grade: 'M4 3h16v18H4zm3 4v2h10V7zm0 4v2h10v-2zm0 4v2h6v-2z',
    calendar: 'M7 2v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2zM5 9h14v11H5zm2 2v2h2v-2zm4 0v2h2v-2zm4 0v2h2v-2z',
    megaphone: 'M3 10v4h3l5 4V6L6 10zm13.5 2A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z',
    inbox: 'M3 4h18v16H3zm2 2v7h4a3 3 0 0 0 6 0h4V6z',
    user: 'M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5Z',
    logout: 'M10 17v-3H3v-4h7V7l5 5zm2-15h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2h-8v-2h8V4h-8z',
    menu: 'M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z',
    close: 'M18.3 5.7 12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7l1.4-1.4 6.3 6.3 6.3-6.3z',
    plus: 'M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z',
    search: 'M10 2a8 8 0 0 1 6.3 12.9l5.4 5.4-1.4 1.4-5.4-5.4A8 8 0 1 1 10 2Zm0 2a6 6 0 1 0 0 12 6 6 0 0 0 0-12Z',
    trash: 'M9 3h6l1 2h4v2H4V5h4zm-3 6h12l-1 12H7z',
    edit: 'M3 17.2V21h3.8L17.8 10l-3.8-3.8zM20.7 7a1 1 0 0 0 0-1.4l-2.3-2.3a1 1 0 0 0-1.4 0l-1.8 1.8 3.8 3.8z',
    check: 'M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z',
}

export function Icon({ name, size = 20 }) {
    return (
        <svg width={size} height={size} viewBox='0 0 24 24' fill='currentColor' aria-hidden='true' focusable='false'>
            <path d={ICONS[name]} />
        </svg>
    )
}

export function PageHeader({ title, subtitle, children }) {
    return (
        <div className='page-header'>
            <div>
                <h1>{title}</h1>
                {subtitle && <p>{subtitle}</p>}
            </div>
            {children && <div className='page-actions'>{children}</div>}
        </div>
    )
}

export function StatTile({ label, value, hint, icon }) {
    return (
        <div className='card stat-tile'>
            <div className='stat-icon'><Icon name={icon} /></div>
            <div>
                <div className='stat-label'>{label}</div>
                <div className='stat-value'>{value}</div>
                {hint && <div className='stat-hint'>{hint}</div>}
            </div>
        </div>
    )
}

const STATUS_TONE = {
    Active: 'good', Present: 'good', A: 'good', B: 'good',
    Late: 'warning', C: 'neutral', D: 'warning', E: 'warning',
    Suspended: 'critical', Absent: 'critical', F: 'critical',
    Graduated: 'info', admin: 'info', student: 'neutral',
}

export function Badge({ children, tone }) {
    return <span className={`badge badge-${tone || STATUS_TONE[children] || 'neutral'}`}>{children}</span>
}

export function Avatar({ name = '?', size = 36 }) {
    const initials = name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
    let hash = 0
    for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) % 360
    return (
        <span
            className='avatar'
            style={{ width: size, height: size, fontSize: size * 0.38, background: `hsl(${hash} 55% 42%)` }}
            aria-hidden='true'
        >
            {initials}
        </span>
    )
}

export function Modal({ title, onClose, children }) {
    const ref = useRef(null)

    useEffect(() => {
        const dialog = ref.current
        dialog.showModal()
        return () => dialog.close()
    }, [])

    return (
        <dialog
            ref={ref}
            className='modal'
            onCancel={(e) => { e.preventDefault(); onClose() }}
            onClick={(e) => { if (e.target === ref.current) onClose() }}
        >
            <div className='modal-body'>
                <div className='modal-head'>
                    <h2>{title}</h2>
                    <button type='button' className='icon-btn' onClick={onClose} aria-label='Close'><Icon name='close' /></button>
                </div>
                {children}
            </div>
        </dialog>
    )
}

export function Empty({ children }) {
    return <div className='empty'>{children}</div>
}
