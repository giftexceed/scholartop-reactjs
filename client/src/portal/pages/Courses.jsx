import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { createCourse, getStudentRecord, listCoursesWithStats, listPrograms } from '../../data/api'
import { useLiveData } from '../../data/useLiveData'
import { Empty, Icon, Modal, PageHeader } from '../components/ui'

export default function Courses() {
    const { user } = useAuth()
    const isAdmin = user.role === 'admin'
    const [adding, setAdding] = useState(false)

    const programs = useLiveData(listPrograms)
    const courses = useLiveData(listCoursesWithStats)
    // Students only see their own program.
    const record = useLiveData(() => (!isAdmin && user.studentId ? getStudentRecord(user.studentId) : null), [isAdmin, user.studentId])

    if (!programs || !courses || record === undefined) return <div className='page-loader' />

    const visiblePrograms = isAdmin ? programs : programs.filter((p) => p.id === record?.student.programId)

    return (
        <>
            <PageHeader title={isAdmin ? 'Courses' : 'My courses'} subtitle={isAdmin ? `${courses.length} courses across ${programs.length} programs` : 'Courses in your program this session'}>
                {isAdmin && <button className='button primary' onClick={() => setAdding(true)}><Icon name='plus' size={18} /> New course</button>}
            </PageHeader>

            {visiblePrograms.length === 0 && <div className='card'><Empty>You are not enrolled in a program yet.</Empty></div>}

            {visiblePrograms.map((p) => {
                const list = courses.filter((c) => c.programId === p.id)
                return (
                    <section key={p.id} className='card'>
                        <div className='card-title-row'>
                            <h2 className='card-title'>{p.name}</h2>
                            <span className='muted small'>{p.award} · {p.duration}</span>
                        </div>
                        {list.length ? (
                            <div className='course-grid'>
                                {list.map((c) => (
                                    <article key={c.id} className='course-card'>
                                        <span className='course-code'>{c.code}</span>
                                        <h3>{c.title}</h3>
                                        <p className='muted small'>{c.lecturer}</p>
                                        <dl>
                                            <div><dt>Units</dt><dd>{c.units}</dd></div>
                                            {isAdmin && <div><dt>Enrolled</dt><dd>{c.enrolled}</dd></div>}
                                            {isAdmin && <div><dt>Avg score</dt><dd>{c.averageScore ?? '—'}</dd></div>}
                                        </dl>
                                        {isAdmin && <Link className='link small' to={`/dashboard/gradebook?course=${c.id}`}>Open gradebook →</Link>}
                                    </article>
                                ))}
                            </div>
                        ) : <Empty>No courses yet.</Empty>}
                    </section>
                )
            })}

            {adding && <CourseForm programs={programs} onClose={() => setAdding(false)} />}
        </>
    )
}

function CourseForm({ programs, onClose }) {
    const [error, setError] = useState('')

    const onSubmit = async (e) => {
        e.preventDefault()
        const f = Object.fromEntries(new FormData(e.currentTarget))
        try {
            await createCourse({ code: f.code, title: f.title, units: Number(f.units), lecturer: f.lecturer, programId: f.programId })
            onClose()
        } catch (err) {
            setError(err.message)
        }
    }

    return (
        <Modal title='New course' onClose={onClose}>
            <form className='form' onSubmit={onSubmit}>
                <div className='field-row'>
                    <label className='field'><span>Course code</span><input name='code' required placeholder='CSC201' /></label>
                    <label className='field'><span>Units</span><input name='units' type='number' min='1' max='6' defaultValue='3' required /></label>
                </div>
                <label className='field'><span>Title</span><input name='title' required /></label>
                <label className='field'><span>Lecturer</span><input name='lecturer' required /></label>
                <label className='field'>
                    <span>Program</span>
                    <select name='programId'>{programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                </label>
                {error && <p className='form-error' role='alert'>{error}</p>}
                <div className='form-actions'>
                    <button type='button' className='button' onClick={onClose}>Cancel</button>
                    <button className='button primary'>Create course</button>
                </div>
            </form>
        </Modal>
    )
}
