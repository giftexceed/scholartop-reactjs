import { useLiveQuery } from 'dexie-react-hooks'
import { useAuth } from '../../auth/AuthContext'
import { db } from '../../db/db'
import { Avatar, Badge, Icon, PageHeader } from '../components/ui'
import { formatDate } from '../format'

export default function Users() {
    const { user: me } = useAuth()
    const data = useLiveQuery(async () => {
        const users = await db.users.orderBy('id').toArray()
        const students = await db.students.bulkGet(users.map((u) => u.studentId ?? -1))
        return users.map((u, i) => ({ ...u, matric: students[i]?.matric }))
    }, [])

    if (!data) return <div className='page-loader' />

    const setRole = (u, role) => db.users.update(u.id, { role })

    const remove = async (u) => {
        if (!confirm(`Delete the login account for ${u.name}? Their student record is kept.`)) return
        await db.transaction('rw', db.users, db.students, async () => {
            if (u.studentId) await db.students.update(u.studentId, { userId: null })
            await db.users.delete(u.id)
        })
    }

    return (
        <>
            <PageHeader title='User accounts' subtitle={`${data.length} accounts stored in this browser's local database`} />
            <section className='card'>
                <div className='table-wrap'>
                    <table className='table'>
                        <thead><tr><th>User</th><th>Phone</th><th>Matric no.</th><th>Role</th><th>Joined</th><th aria-label='Actions' /></tr></thead>
                        <tbody>
                            {data.map((u) => {
                                const self = u.id === me.id
                                return (
                                    <tr key={u.id}>
                                        <td>
                                            <div className='person'>
                                                <Avatar name={u.name} size={32} />
                                                <div><strong>{u.name}{self && ' (you)'}</strong><div className='muted small'>{u.email}</div></div>
                                            </div>
                                        </td>
                                        <td>{u.phone || <span className='muted'>—</span>}</td>
                                        <td className='mono'>{u.matric || <span className='muted'>—</span>}</td>
                                        <td>
                                            {self ? <Badge>{u.role}</Badge> : (
                                                <select value={u.role} onChange={(e) => setRole(u, e.target.value)} aria-label={`Role for ${u.name}`}>
                                                    <option value='student'>student</option>
                                                    <option value='admin'>admin</option>
                                                </select>
                                            )}
                                        </td>
                                        <td className='muted'>{formatDate(u.createdAt)}</td>
                                        <td className='row-actions'>
                                            {!self && (
                                                <button className='icon-btn danger' onClick={() => remove(u)} aria-label={`Delete ${u.name}`}>
                                                    <Icon name='trash' size={18} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </section>
        </>
    )
}
