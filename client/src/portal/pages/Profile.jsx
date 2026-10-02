import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useAuth } from '../../auth/AuthContext'
import { db, hashPassword, randomSalt } from '../../db/db'
import { resetDatabase } from '../../db/seed'
import { Avatar, Badge, PageHeader } from '../components/ui'
import { formatDate } from '../format'

export default function Profile() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const student = useLiveQuery(() => (user.studentId ? db.students.get(user.studentId) : null), [user.studentId])
    const [detailsMsg, setDetailsMsg] = useState(null)
    const [pwMsg, setPwMsg] = useState(null)

    const saveDetails = async (e) => {
        e.preventDefault()
        const f = Object.fromEntries(new FormData(e.currentTarget))
        const email = f.email.trim().toLowerCase()
        const taken = await db.users.where('email').equals(email).first()
        if (taken && taken.id !== user.id) return setDetailsMsg({ error: true, text: 'That email is used by another account.' })
        const changes = { name: f.name.trim(), phone: f.phone.trim(), email }
        await db.transaction('rw', db.users, db.students, async () => {
            await db.users.update(user.id, changes)
            if (user.studentId) await db.students.update(user.studentId, changes)
        })
        setDetailsMsg({ text: 'Profile updated.' })
    }

    const changePassword = async (e) => {
        e.preventDefault()
        const form = e.currentTarget
        const f = Object.fromEntries(new FormData(form))
        if ((await hashPassword(f.current, user.salt)) !== user.passwordHash) return setPwMsg({ error: true, text: 'Current password is incorrect.' })
        if (f.next.length < 6) return setPwMsg({ error: true, text: 'New password must be at least 6 characters.' })
        if (f.next !== f.confirm) return setPwMsg({ error: true, text: 'New passwords do not match.' })
        const salt = randomSalt()
        await db.users.update(user.id, { salt, passwordHash: await hashPassword(f.next, salt) })
        form.reset()
        setPwMsg({ text: 'Password changed.' })
    }

    const exportData = async () => {
        const { passwordHash: _h, salt: _s, ...account } = user
        const payload = { account }
        if (student) {
            payload.student = student
            const enrollments = await db.enrollments.where('studentId').equals(student.id).toArray()
            const courses = await db.courses.bulkGet(enrollments.map((x) => x.courseId))
            payload.results = enrollments.map((x, i) => ({ course: courses[i]?.code, title: courses[i]?.title, score: x.score }))
            payload.attendance = await db.attendance.where('studentId').equals(student.id).toArray()
        }
        const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }))
        const a = Object.assign(document.createElement('a'), { href: url, download: 'easypoint-my-data.json' })
        a.click()
        URL.revokeObjectURL(url)
    }

    const reset = async () => {
        if (!confirm('Reset the demo? This deletes every account and record in this browser and restores the sample data.')) return
        logout()
        await resetDatabase()
        navigate('/login', { replace: true })
    }

    return (
        <>
            <PageHeader title='My profile' subtitle='Your details are stored only in this browser.' />

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
                        <form className='form' onSubmit={changePassword}>
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
                        <p className='muted small'>Everything in this portal is kept in your browser's IndexedDB. Clearing site data removes it.</p>
                        <div className='form-actions start'>
                            <button className='button' onClick={exportData}>Download my data (JSON)</button>
                            {user.role === 'admin' && <button className='button danger' onClick={reset}>Reset demo data</button>}
                        </div>
                    </section>
                </div>
            </div>
        </>
    )
}
