import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useAuth } from '../../auth/AuthContext'
import { db } from '../../db/db'
import { Empty, Icon, Modal, PageHeader } from '../components/ui'

export default function Courses() {
    const { user } = useAuth()
    const isAdmin = user.role === 'admin'
    const [adding, setAdding] = useState(false)

    const data = useLiveQuery(async () => {
        const [programs, courses, enrollments, student] = await Promise.all([
            db.programs.toArray(),
            db.courses.toArray(),
            db.enrollments.toArray(),
            user.studentId ? db.students.get(user.studentId) : null,
        ])
        const stats = {}
        for (const e of enrollments) {
            const s = (stats[e.courseId] ??= { enrolled: 0, total: 0, graded: 0 })
            s.enrolled++
            if (e.score != null) { s.total += e.score; s.graded++ }
        }
        return { programs, courses, stats, student }
    }, [user.studentId])

    if (!data) return <div className='page-loader' />
    const { programs, courses, stats, student } = data

    const visiblePrograms = isAdmin ? programs : programs.filter((p) => p.id === student?.programId)

    return (
        <>
            <PageHeader title={isAdmin ? 'Courses' : 'My courses'} subtitle={isAdmin ? `${courses.length} courses across ${programs.length} programs` : 'Courses in your program this session'}>
                {isAdmin && <button className='button primary' onClick={() => setAdding(true)}><Icon name='plus' size={18} /> New course</button>}
            </PageHeader>

            {visiblePrograms.length === 0 && <Empty>You are not enrolled in a program yet.</Empty>}

            {visiblePrograms.map((p) => {
                const list = courses.filter((c) => c.programId === p.id).sort((a, b) => a.code.localeCompare(b.code))
                return (
                    <section key={p.id} className='card'>
                        <div className='card-title-row'>
                            <h2 className='card-title'>{p.name}</h2>
                            <span className='muted small'>{p.award} · {p.duration}</span>
                        </div>
                        {list.length ? (
                            <div className='course-grid'>
                                {list.map((c) => {
                                    const s = stats[c.id] || { enrolled: 0, graded: 0, total: 0 }
                                    return (
                                        <article key={c.id} className='course-card'>
                                            <span className='course-code'>{c.code}</span>
                                            <h3>{c.title}</h3>
                                            <p className='muted small'>{c.lecturer}</p>
                                            <dl>
                                                <div><dt>Units</dt><dd>{c.units}</dd></div>
                                                {isAdmin && <div><dt>Enrolled</dt><dd>{s.enrolled}</dd></div>}
                                                {isAdmin && <div><dt>Avg score</dt><dd>{s.graded ? Math.round(s.total / s.graded) : '—'}</dd></div>}
                                            </dl>
                                            {isAdmin && <Link className='link small' to={`/dashboard/gradebook?course=${c.id}`}>Open gradebook →</Link>}
                                        </article>
                                    )
                                })}
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
        const programId = Number(f.programId)
        try {
            await db.transaction('rw', db.courses, db.students, db.enrollments, async () => {
                const courseId = await db.courses.add({
                    code: f.code.trim().toUpperCase(),
                    title: f.title.trim(),
                    units: Number(f.units),
                    lecturer: f.lecturer.trim(),
                    programId,
                })
                // Everyone already in the program takes the new course.
                const students = await db.students.where('programId').equals(programId).primaryKeys()
                await db.enrollments.bulkAdd(students.map((studentId) => ({ studentId, courseId, score: null })))
            })
            onClose()
        } catch (err) {
            setError(err.name === 'ConstraintError' ? 'A course with that code already exists.' : err.message)
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
