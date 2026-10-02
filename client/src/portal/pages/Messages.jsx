import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import { Avatar, Empty, Icon, PageHeader } from '../components/ui'
import { formatDate, timeAgo } from '../format'

export default function Messages() {
    const messages = useLiveQuery(() => db.messages.orderBy('createdAt').reverse().toArray(), [])
    const [openId, setOpenId] = useState(null)

    if (!messages) return <div className='page-loader' />
    const unread = messages.filter((m) => !m.read)

    const toggle = (m) => {
        setOpenId(openId === m.id ? null : m.id)
        if (!m.read) db.messages.update(m.id, { read: 1 })
    }

    const remove = async (m) => {
        if (confirm(`Delete the message from ${m.name}?`)) await db.messages.delete(m.id)
    }

    return (
        <>
            <PageHeader title='Inbox' subtitle='Messages sent through the website contact form.'>
                <button className='button' disabled={!unread.length} onClick={() => db.messages.where('read').equals(0).modify({ read: 1 })}>
                    <Icon name='check' size={18} /> Mark all as read
                </button>
            </PageHeader>

            <section className='card'>
                {messages.length ? (
                    <ul className='inbox'>
                        {messages.map((m) => (
                            <li key={m.id} className={m.read ? '' : 'unread'}>
                                <button type='button' className='inbox-row' onClick={() => toggle(m)} aria-expanded={openId === m.id}>
                                    <Avatar name={m.name} size={36} />
                                    <div className='inbox-text'>
                                        <strong>{m.name}</strong>
                                        <span className={openId === m.id ? '' : 'truncate'}>{m.message}</span>
                                    </div>
                                    <time className='muted small' dateTime={m.createdAt} title={formatDate(m.createdAt)}>{timeAgo(m.createdAt)}</time>
                                </button>
                                {openId === m.id && (
                                    <div className='inbox-detail'>
                                        <a className='button' href={`tel:${m.phone}`}>Call {m.phone}</a>
                                        <button className='button danger' onClick={() => remove(m)}><Icon name='trash' size={18} /> Delete</button>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : <Empty>No messages yet. Submissions from the website's contact form will appear here.</Empty>}
            </section>
        </>
    )
}
