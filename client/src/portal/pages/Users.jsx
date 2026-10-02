import { useAuth } from '../../auth/AuthContext'
import { ROLES, deleteUser, listUsers, setUserRole } from '../../data/api'
import { useLiveData } from '../../data/useLiveData'
import { formatDate } from '../../lib/dates'
import { Avatar, Badge, Icon, PageHeader } from '../components/ui'

const report = (err) => alert(err.message)

export default function Users() {
    const { user: me } = useAuth()
    const users = useLiveData(listUsers)

    if (!users) return <div className='page-loader' />

    const remove = (u) => {
        if (confirm(`Delete the login account for ${u.name}? Their student record is kept.`)) deleteUser(u.id).catch(report)
    }

    return (
        <>
            <PageHeader title='User accounts' subtitle={`${users.length} accounts`} />
            <section className='card'>
                <div className='table-wrap'>
                    <table className='table'>
                        <thead><tr><th>User</th><th>Phone</th><th>Matric no.</th><th>Role</th><th>Joined</th><th aria-label='Actions' /></tr></thead>
                        <tbody>
                            {users.map((u) => {
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
                                                <select value={u.role} onChange={(e) => setUserRole(u.id, e.target.value).catch(report)} aria-label={`Role for ${u.name}`}>
                                                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
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
