import { useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { createAnnouncement, deleteAnnouncement, listAnnouncements, listPrograms } from '../../data/api'
import { useLiveData } from '../../data/useLiveData'
import { formatDate, timeAgo } from '../../lib/dates'
import { Badge, Empty, Icon, Modal, PageHeader } from '../components/ui'

export default function Announcements() {
    const { user } = useAuth()
    const isAdmin = user.role === 'admin'
    const [composing, setComposing] = useState(false)
    const items = useLiveData(() => listAnnouncements(), [user.id])

    if (!items) return <div className='page-loader' />

    const onDelete = async (a) => {
        if (!confirm(`Delete "${a.title}"?`)) return
        try { await deleteAnnouncement(a.id) } catch (err) { alert(err.message) }
    }

    return (
        <>
            <PageHeader title='Announcements' subtitle={isAdmin ? 'Notices shown on student dashboards.' : 'Latest news from the school.'}>
                {isAdmin && <button className='button primary' onClick={() => setComposing(true)}><Icon name='plus' size={18} /> New announcement</button>}
            </PageHeader>

            {items.length ? (
                <div className='stack'>
                    {items.map((a) => (
                        <article key={a.id} className='card announcement'>
                            <div className='card-title-row'>
                                <h2 className='card-title'>{a.title}</h2>
                                {isAdmin && (
                                    <button className='icon-btn danger' onClick={() => onDelete(a)} aria-label={`Delete ${a.title}`}>
                                        <Icon name='trash' size={18} />
                                    </button>
                                )}
                            </div>
                            <p>{a.body}</p>
                            <div className='muted small'>
                                <Badge tone='info'>{a.audience}</Badge> · <time dateTime={a.createdAt} title={formatDate(a.createdAt)}>{timeAgo(a.createdAt)}</time>
                            </div>
                        </article>
                    ))}
                </div>
            ) : <div className='card'><Empty>No announcements yet.</Empty></div>}

            {composing && <Composer onClose={() => setComposing(false)} />}
        </>
    )
}

function Composer({ onClose }) {
    const programs = useLiveData(listPrograms, [], [])
    const [error, setError] = useState('')

    const onSubmit = async (e) => {
        e.preventDefault()
        try {
            await createAnnouncement(Object.fromEntries(new FormData(e.currentTarget)))
            onClose()
        } catch (err) {
            setError(err.message)
        }
    }

    return (
        <Modal title='New announcement' onClose={onClose}>
            <form className='form' onSubmit={onSubmit}>
                <label className='field'><span>Title</span><input name='title' required maxLength={120} /></label>
                <label className='field'><span>Message</span><textarea name='body' rows='5' required /></label>
                <label className='field'>
                    <span>Audience</span>
                    <select name='audience'>
                        <option value='All'>Everyone</option>
                        {programs.map((p) => <option key={p.id} value={p.name}>{p.name} students</option>)}
                    </select>
                </label>
                {error && <p className='form-error' role='alert'>{error}</p>}
                <div className='form-actions'>
                    <button type='button' className='button' onClick={onClose}>Cancel</button>
                    <button className='button primary'>Publish</button>
                </div>
            </form>
        </Modal>
    )
}
