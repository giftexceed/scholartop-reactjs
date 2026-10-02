import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, nextMatric } from '../../db/db'
import { Avatar, Badge, Empty, Icon, Modal, PageHeader } from '../components/ui'
import { formatDate } from '../format'

const LEVELS = { UGD: [100, 200, 300, 400], MSC: [700], PGD: [800] }
const STATUSES = ['Active', 'Suspended', 'Graduated']

async function enrollInProgram(studentId, programId) {
    const courses = await db.courses.where('programId').equals(programId).toArray()
    await db.enrollments.bulkAdd(courses.map((c) => ({ studentId, courseId: c.id, score: null })))
}

async function saveStudent(existing, values) {
    await db.transaction('rw', db.students, db.users, db.courses, db.enrollments, async () => {
        if (!existing) {
            const id = await db.students.add({ ...values, matric: await nextMatric(), enrolledAt: new Date().toISOString() })
            await enrollInProgram(id, values.programId)
            return
        }
        await db.students.update(existing.id, values)
        if (existing.programId !== values.programId) {
            await db.enrollments.where('studentId').equals(existing.id).delete()
            await enrollInProgram(existing.id, values.programId)
        }
        // Keep the linked login account's contact details in sync.
        if (existing.userId) await db.users.update(existing.userId, { name: values.name, phone: values.phone })
    })
}

async function deleteStudent(s) {
    await db.transaction('rw', db.students, db.users, db.enrollments, db.attendance, async () => {
        await db.enrollments.where('studentId').equals(s.id).delete()
        await db.attendance.where('studentId').equals(s.id).delete()
        if (s.userId) await db.users.update(s.userId, { studentId: null })
        await db.students.delete(s.id)
    })
}

export default function Students() {
    const students = useLiveQuery(() => db.students.toArray(), [])
    const programs = useLiveQuery(() => db.programs.toArray(), [])
    const [query, setQuery] = useState('')
    const [programFilter, setProgramFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [editing, setEditing] = useState(null) // null | 'new' | student

    const programById = useMemo(() => Object.fromEntries((programs || []).map((p) => [p.id, p])), [programs])

    const rows = useMemo(() => {
        const q = query.trim().toLowerCase()
        return (students || [])
            .filter((s) => !programFilter || s.programId === Number(programFilter))
            .filter((s) => !statusFilter || s.status === statusFilter)
            .filter((s) => !q || [s.name, s.matric, s.email].some((v) => v?.toLowerCase().includes(q)))
            .sort((a, b) => a.name.localeCompare(b.name))
    }, [students, query, programFilter, statusFilter])

    if (!students || !programs) return <div className='page-loader' />

    const onDelete = async (s) => {
        if (confirm(`Delete ${s.name}? Their results and attendance will also be removed.`)) await deleteStudent(s)
    }

    return (
        <>
            <PageHeader title='Students' subtitle={`${students.length} students on record`}>
                <button className='button primary' onClick={() => setEditing('new')}><Icon name='plus' size={18} /> Add student</button>
            </PageHeader>

            <div className='card'>
                <div className='toolbar'>
                    <label className='search'>
                        <Icon name='search' size={18} />
                        <input type='search' placeholder='Search name, matric or email' value={query} onChange={(e) => setQuery(e.target.value)} aria-label='Search students' />
                    </label>
                    <select value={programFilter} onChange={(e) => setProgramFilter(e.target.value)} aria-label='Filter by program'>
                        <option value=''>All programs</option>
                        {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label='Filter by status'>
                        <option value=''>Any status</option>
                        {STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                </div>

                {rows.length ? (
                    <div className='table-wrap'>
                        <table className='table'>
                            <thead>
                                <tr><th>Student</th><th>Matric no.</th><th>Program</th><th className='num'>Level</th><th>Status</th><th>Enrolled</th><th aria-label='Actions' /></tr>
                            </thead>
                            <tbody>
                                {rows.map((s) => (
                                    <tr key={s.id}>
                                        <td>
                                            <div className='person'>
                                                <Avatar name={s.name} size={32} />
                                                <div><strong>{s.name}</strong><div className='muted small'>{s.email}</div></div>
                                            </div>
                                        </td>
                                        <td className='mono'>{s.matric}</td>
                                        <td>{programById[s.programId]?.name}</td>
                                        <td className='num'>{s.level}</td>
                                        <td><Badge>{s.status}</Badge></td>
                                        <td className='muted'>{formatDate(s.enrolledAt)}</td>
                                        <td className='row-actions'>
                                            <button className='icon-btn' onClick={() => setEditing(s)} aria-label={`Edit ${s.name}`}><Icon name='edit' size={18} /></button>
                                            <button className='icon-btn danger' onClick={() => onDelete(s)} aria-label={`Delete ${s.name}`}><Icon name='trash' size={18} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : <Empty>No students match your filters.</Empty>}
            </div>

            {editing && (
                <StudentForm
                    student={editing === 'new' ? null : editing}
                    programs={programs}
                    onClose={() => setEditing(null)}
                />
            )}
        </>
    )
}

function StudentForm({ student, programs, onClose }) {
    const [programId, setProgramId] = useState(student?.programId ?? programs[0]?.id)
    const [error, setError] = useState('')
    const levels = LEVELS[programs.find((p) => p.id === Number(programId))?.code] || []

    const onSubmit = async (e) => {
        e.preventDefault()
        const f = Object.fromEntries(new FormData(e.currentTarget))
        try {
            await saveStudent(student, {
                name: f.name.trim(),
                email: f.email.trim().toLowerCase(),
                phone: f.phone.trim(),
                gender: f.gender,
                programId: Number(f.programId),
                level: Number(f.level),
                status: f.status,
            })
            onClose()
        } catch (err) {
            setError(err.name === 'ConstraintError' ? 'That record conflicts with an existing student.' : err.message)
        }
    }

    return (
        <Modal title={student ? 'Edit student' : 'Add student'} onClose={onClose}>
            <form onSubmit={onSubmit} className='form'>
                <label className='field'><span>Full name</span><input name='name' required defaultValue={student?.name} /></label>
                <div className='field-row'>
                    <label className='field'><span>Email</span><input name='email' type='email' required defaultValue={student?.email} /></label>
                    <label className='field'><span>Phone</span><input name='phone' type='tel' defaultValue={student?.phone} /></label>
                </div>
                <div className='field-row'>
                    <label className='field'>
                        <span>Program</span>
                        <select name='programId' value={programId} onChange={(e) => setProgramId(Number(e.target.value))}>
                            {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </label>
                    <label className='field'>
                        <span>Level</span>
                        <select name='level' key={programId} defaultValue={student?.programId === programId ? student.level : levels[0]}>
                            {levels.map((l) => <option key={l} value={l}>{l}</option>)}
                        </select>
                    </label>
                </div>
                <div className='field-row'>
                    <label className='field'>
                        <span>Gender</span>
                        <select name='gender' defaultValue={student?.gender || ''}>
                            <option value=''>Prefer not to say</option><option>Female</option><option>Male</option>
                        </select>
                    </label>
                    <label className='field'>
                        <span>Status</span>
                        <select name='status' defaultValue={student?.status || 'Active'}>
                            {STATUSES.map((s) => <option key={s}>{s}</option>)}
                        </select>
                    </label>
                </div>
                {student && student.programId !== programId && (
                    <p className='form-note'>Changing program re-enrolls this student in the new program's courses and clears their current results.</p>
                )}
                {error && <p className='form-error' role='alert'>{error}</p>}
                <div className='form-actions'>
                    <button type='button' className='button' onClick={onClose}>Cancel</button>
                    <button className='button primary'>{student ? 'Save changes' : 'Add student'}</button>
                </div>
            </form>
        </Modal>
    )
}
