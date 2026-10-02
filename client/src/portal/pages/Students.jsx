import { useMemo, useState } from 'react'
import { STUDENT_STATUSES, createStudent, deleteStudent, listPrograms, listStudents, updateStudent } from '../../data/api'
import { useLiveData } from '../../data/useLiveData'
import { formatDate } from '../../lib/dates'
import { Avatar, Badge, Empty, Icon, Modal, PageHeader } from '../components/ui'

export default function Students() {
    const students = useLiveData(listStudents)
    const programs = useLiveData(listPrograms)
    const [query, setQuery] = useState('')
    const [programFilter, setProgramFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [editing, setEditing] = useState(null) // null | 'new' | student

    const programById = useMemo(() => Object.fromEntries((programs || []).map((p) => [p.id, p])), [programs])

    const rows = useMemo(() => {
        const q = query.trim().toLowerCase()
        return (students || [])
            .filter((s) => !programFilter || s.programId === programFilter)
            .filter((s) => !statusFilter || s.status === statusFilter)
            .filter((s) => !q || [s.name, s.matric, s.email].some((v) => v?.toLowerCase().includes(q)))
            .sort((a, b) => a.name.localeCompare(b.name))
    }, [students, query, programFilter, statusFilter])

    if (!students || !programs) return <div className='page-loader' />

    const onDelete = async (s) => {
        if (!confirm(`Delete ${s.name}? Their results and attendance will also be removed.`)) return
        try { await deleteStudent(s.id) } catch (err) { alert(err.message) }
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
                        {STUDENT_STATUSES.map((s) => <option key={s}>{s}</option>)}
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
    const levels = programs.find((p) => p.id === programId)?.levels || []

    const onSubmit = async (e) => {
        e.preventDefault()
        const f = Object.fromEntries(new FormData(e.currentTarget))
        const values = {
            name: f.name.trim(),
            email: f.email.trim().toLowerCase(),
            phone: f.phone.trim(),
            gender: f.gender,
            programId: f.programId,
            level: Number(f.level),
            status: f.status,
        }
        try {
            if (student) await updateStudent(student.id, values)
            else await createStudent(values)
            onClose()
        } catch (err) {
            setError(err.message)
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
                        <select name='programId' value={programId} onChange={(e) => setProgramId(e.target.value)}>
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
                            {STUDENT_STATUSES.map((s) => <option key={s}>{s}</option>)}
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
