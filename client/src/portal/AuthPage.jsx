import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useAuth } from '../auth/AuthContext'
import { db } from '../db/db'
import { DEMO_ADMIN, DEMO_STUDENT } from '../db/seed'
import { Icon } from './components/ui'

const LEVELS = { UGD: [100, 200, 300, 400], MSC: [700], PGD: [800] }

export default function AuthPage({ mode }) {
    const isLogin = mode === 'login'
    const { login, register } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const programs = useLiveQuery(() => db.programs.toArray(), [])
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)
    const [programId, setProgramId] = useState('')

    const goNext = () => navigate(location.state?.from || '/dashboard', { replace: true })

    const run = async (fn) => {
        setError('')
        setBusy(true)
        try {
            await fn()
            goNext()
        } catch (err) {
            setError(err.message || 'Something went wrong.')
            setBusy(false)
        }
    }

    const onSubmit = (e) => {
        e.preventDefault()
        const f = Object.fromEntries(new FormData(e.currentTarget))
        if (isLogin) return run(() => login(f.email, f.password))
        if (f.password.length < 6) return setError('Password must be at least 6 characters.')
        if (f.password !== f.confirm) return setError('Passwords do not match.')
        run(() => register({
            name: f.name.trim(),
            email: f.email,
            phone: f.phone.trim(),
            password: f.password,
            programId: Number(f.programId),
            level: Number(f.level),
        }))
    }

    const selectedProgram = programs?.find((p) => p.id === Number(programId))

    return (
        <div className='auth-page'>
            <aside className='auth-aside'>
                <Link to='/' className='brand brand-light'>
                    <span className='brand-mark'><Icon name='student' size={22} /></span> EasyPoint
                </Link>
                <div>
                    <h2>Student &amp; staff portal</h2>
                    <p>Track courses, results, attendance and campus announcements in one place.</p>
                </div>
                <p className='auth-note'>Demo portal — all accounts and records are stored only in this browser (IndexedDB).</p>
            </aside>

            <main className='auth-main'>
                <form className='auth-card' onSubmit={onSubmit}>
                    <h1>{isLogin ? 'Welcome back' : 'Create your student account'}</h1>
                    <p className='muted'>
                        {isLogin ? 'Sign in to continue to your dashboard.' : 'Register to get a matric number and access the portal.'}
                    </p>

                    {!isLogin && (
                        <>
                            <label className='field'>
                                <span>Full name</span>
                                <input name='name' required autoComplete='name' placeholder='e.g. Amaka Obi' />
                            </label>
                            <label className='field'>
                                <span>Phone</span>
                                <input name='phone' type='tel' autoComplete='tel' placeholder='+234…' />
                            </label>
                        </>
                    )}

                    <label className='field'>
                        <span>Email</span>
                        <input name='email' type='email' required autoComplete='email' placeholder='you@example.com' />
                    </label>

                    {!isLogin && (
                        <div className='field-row'>
                            <label className='field'>
                                <span>Program</span>
                                <select name='programId' required value={programId} onChange={(e) => setProgramId(e.target.value)}>
                                    <option value='' disabled>Select…</option>
                                    {programs?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </label>
                            <label className='field'>
                                <span>Level</span>
                                <select name='level' required disabled={!selectedProgram} key={programId}>
                                    {(LEVELS[selectedProgram?.code] || []).map((l) => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </label>
                        </div>
                    )}

                    <label className='field'>
                        <span>Password</span>
                        <input name='password' type='password' required autoComplete={isLogin ? 'current-password' : 'new-password'} minLength={isLogin ? undefined : 6} />
                    </label>

                    {!isLogin && (
                        <label className='field'>
                            <span>Confirm password</span>
                            <input name='confirm' type='password' required autoComplete='new-password' />
                        </label>
                    )}

                    {error && <p className='form-error' role='alert'>{error}</p>}

                    <button className='button primary block' disabled={busy}>
                        {busy ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'}
                    </button>

                    {isLogin && (
                        <div className='demo-logins'>
                            <span>Try a demo account</span>
                            <div>
                                <button type='button' className='button' disabled={busy} onClick={() => run(() => login(DEMO_ADMIN.email, DEMO_ADMIN.password))}>
                                    Admin
                                </button>
                                <button type='button' className='button' disabled={busy} onClick={() => run(() => login(DEMO_STUDENT.email, DEMO_STUDENT.password))}>
                                    Student
                                </button>
                            </div>
                        </div>
                    )}

                    <p className='auth-switch'>
                        {isLogin ? <>New student? <Link to='/register'>Create an account</Link></> : <>Already registered? <Link to='/login'>Sign in</Link></>}
                    </p>
                    <p className='auth-switch'><Link to='/'>← Back to website</Link></p>
                </form>
            </main>
        </div>
    )
}
