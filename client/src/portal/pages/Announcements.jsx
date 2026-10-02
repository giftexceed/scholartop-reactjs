import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useAuth } from '../../auth/AuthContext'
import { db } from '../../db/db'
import { Badge, Empty, Icon, Modal, PageHeader } from '../components/ui'
import { formatDate, timeAgo } from '../format'

export default function Announcements() {
    const { user } = useAuth()
    const isAdmin = user.role === 'admin'
    const [composing, setComposing] = useState(false)

    const data = useLiveQuery(async () => {
        const [items, programs, student] = await Promise.all([
            db.announcements.orderBy('createdAt').reverse().toArray(),
            db.programs.toArray(),
            user.studentId ? db.students.get(user.studentId) : null,
        ])
        const myProgram = programs.find((p) => p.id === student?.programId)?.name
        return {
            programs,
            items: isAdmin ? items : items.filter((a) => a.audience === 'All' || a.audience === myProgram),
        }
    }, [isAdmin, user.studentId])

    if (!data) return <div className='page-loader' />

    const onDelete = async (a) => {
        if (confirm(`Delete "${a.title}"?`)) await db.announcements.delete(a.id)
    }

    return (
        <>
            <PageHeader title='Announcements' subtitle={isAdmin ? 'Notices shown on student dashboards.' : 'Latest news from the school.'}>
                {isAdmin && <button className='button primary' onClick={() => setComposing(true)}><Icon name='plus' size={18} /> New announcement</button>}
            </PageHeader>

            {data.items.length ? (
                <div className='stack'>
                    {data.items.map((a) => (
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

            {composing && <Composer programs={data.programs} authorId={user.id} onClose={() => setComposing(false)} />}
        </>
    )
}

function Composer({ programs, authorId, onClose }) {
    const onSubmit = async (e) => {
        e.preventDefault()
        const f = Object.fromEntries(new FormData(e.currentTarget))
        await db.announcements.add({
            title: f.title.trim(),
            body: f.body.trim(),
            audience: f.audience,
            authorId,
            createdAt: new Date().toISOString(),
        })
        onClose()
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
                <div className='form-actions'>
                    <button type='button' className='button' onClick={onClose}>Cancel</button>
                    <button className='button primary'>Publish</button>
                </div>
            </form>
        </Modal>
    )
}
