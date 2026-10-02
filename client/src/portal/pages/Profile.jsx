import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { changePassword, exportMyData, getStudentRecord, resetDemoData, updateProfile } from '../../data/api'
import { useLiveData } from '../../data/useLiveData'
import { formatDate } from '../../lib/dates'
import { Avatar, Badge, PageHeader } from '../components/ui'

export default function Profile() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const record = useLiveData(() => (user.studentId ? getStudentRecord(user.studentId) : null), [user.studentId])
    const student = record?.student
    const [detailsMsg, setDetailsMsg] = useState(null)
    const [pwMsg, setPwMsg] = useState(null)

    const saveDetails = async (e) => {
        e.preventDefault()
        try {
            await updateProfile(Object.fromEntries(new FormData(e.currentTarget)))
            setDetailsMsg({ text: 'Profile updated.' })
        } catch (err) {
            setDetailsMsg({ error: true, text: err.message })
        }
    }

    const onChangePassword = async (e) => {
        e.preventDefault()
        const form = e.currentTarget
        const f = Object.fromEntries(new FormData(form))
        if (f.next !== f.confirm) return setPwMsg({ error: true, text: 'New passwords do not match.' })
        try {
            await changePassword(f.current, f.next)
            form.reset()
            setPwMsg({ text: 'Password changed.' })
        } catch (err) {
            setPwMsg({ error: true, text: err.message })
        }
    }

    const onExport = async () => {
        const data = await exportMyData()
        const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
        const a = Object.assign(document.createElement('a'), { href: url, download: 'topscholars-my-data.json' })
        a.click()
        URL.revokeObjectURL(url)
    }

    const onReset = async () => {
        if (!confirm('Reset the demo? This deletes every account and record in this browser and restores the sample data.')) return
        await resetDemoData()
        logout()
        navigate('/login', { replace: true })
    }

    return (
        <>
            <PageHeader title='My profile' subtitle='Manage your account details and password.' />

            <div className='grid-2'>
                <section className='card'>
                    <div className='profile-head'>
                        <Avatar name={user.name} size={64} />
                        <div>
                            <h2>{user.name}</h2>
                            <p className='muted'>{user.email}</p>
                            <Badge>{user.role}</Badge>
                        </div>
                    </div>
                    {student && (
                        <dl className='details'>
                            <div><dt>Matric no.</dt><dd className='mono'>{student.matric}</dd></div>
                            <div><dt>Level</dt><dd>{student.level}</dd></div>
                            <div><dt>Status</dt><dd><Badge>{student.status}</Badge></dd></div>
                            <div><dt>Enrolled</dt><dd>{formatDate(student.enrolledAt)}</dd></div>
                        </dl>
                    )}
                    <dl className='details'>
                        <div><dt>Account created</dt><dd>{formatDate(user.createdAt)}</dd></div>
                    </dl>

                    <form className='form' onSubmit={saveDetails} key={user.id}>
                        <h3>Personal details</h3>
                        <label className='field'><span>Full name</span><input name='name' required defaultValue={user.name} /></label>
                        <div className='field-row'>
                            <label className='field'><span>Email</span><input name='email' type='email' required defaultValue={user.email} /></label>
                            <label className='field'><span>Phone</span><input name='phone' type='tel' defaultValue={user.phone} /></label>
                        </div>
                        {detailsMsg && <p className={detailsMsg.error ? 'form-error' : 'form-ok'} role='status'>{detailsMsg.text}</p>}
                        <div className='form-actions'><button className='button primary'>Save details</button></div>
                    </form>
                </section>

                <div className='stack'>
                    <section className='card'>
                        <form className='form' onSubmit={onChangePassword}>
                            <h3>Change password</h3>
                            <label className='field'><span>Current password</span><input name='current' type='password' required autoComplete='current-password' /></label>
                            <label className='field'><span>New password</span><input name='next' type='password' required minLength={6} autoComplete='new-password' /></label>
                            <label className='field'><span>Confirm new password</span><input name='confirm' type='password' required autoComplete='new-password' /></label>
                            {pwMsg && <p className={pwMsg.error ? 'form-error' : 'form-ok'} role='status'>{pwMsg.text}</p>}
                            <div className='form-actions'><button className='button primary'>Update password</button></div>
                        </form>
                    </section>

                    <section className='card'>
                        <h3>Your data</h3>
                        <p className='muted small'>This demo stores everything in your browser. Clearing site data removes it.</p>
                        <div className='form-actions start'>
                            <button className='button' onClick={onExport}>Download my data (JSON)</button>
                            {user.role === 'admin' && <button className='button danger' onClick={onReset}>Reset demo data</button>}
                        </div>
                    </section>
                </div>
            </div>
        </>
    )
}
