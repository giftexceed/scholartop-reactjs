import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, todayISO } from '../../db/db'
import { Avatar, Empty, PageHeader } from '../components/ui'

const STATUSES = ['Present', 'Late', 'Absent']

async function mark(studentId, date, status) {
    await db.transaction('rw', db.attendance, async () => {
        const existing = await db.attendance.where({ studentId, date }).first()
        if (existing) await db.attendance.update(existing.id, { status })
        else await db.attendance.add({ studentId, date, status })
    })
}

export default function Attendance() {
    const [date, setDate] = useState(todayISO)
    const [programId, setProgramId] = useState('')

    const programs = useLiveQuery(() => db.programs.toArray(), [])
    const data = useLiveQuery(async () => {
        const [students, records] = await Promise.all([
            db.students.where('status').equals('Active').toArray(),
            db.attendance.where('date').equals(date).toArray(),
        ])
        return { students, byStudent: Object.fromEntries(records.map((r) => [r.studentId, r.status])) }
    }, [date])

    if (!data || !programs) return <div className='page-loader' />

    const students = data.students
        .filter((s) => !programId || s.programId === Number(programId))
        .sort((a, b) => a.name.localeCompare(b.name))
    const counts = Object.fromEntries(STATUSES.map((s) => [s, students.filter((st) => data.byStudent[st.id] === s).length]))
    const unmarked = students.filter((s) => !data.byStudent[s.id])

    const markAllPresent = () => Promise.all(unmarked.map((s) => mark(s.id, date, 'Present')))

    return (
        <>
            <PageHeader title='Attendance' subtitle='Register is saved as you click.'>
                <input type='date' value={date} max={todayISO()} onChange={(e) => e.target.value && setDate(e.target.value)} aria-label='Date' />
                <select value={programId} onChange={(e) => setProgramId(e.target.value)} aria-label='Filter by program'>
                    <option value=''>All programs</option>
                    {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            </PageHeader>

            <section className='card'>
                <div className='card-title-row'>
                    <div className='att-summary'>
                        {STATUSES.map((s) => <span key={s} className={`att-count att-${s.toLowerCase()}`}><strong>{counts[s]}</strong> {s}</span>)}
                        <span className='att-count'><strong>{unmarked.length}</strong> Unmarked</span>
                    </div>
                    <button className='button' onClick={markAllPresent} disabled={!unmarked.length}>Mark unmarked as present</button>
                </div>

                {students.length ? (
                    <ul className='att-list'>
                        {students.map((s) => (
                            <li key={s.id}>
                                <div className='person'>
                                    <Avatar name={s.name} size={32} />
                                    <div><strong>{s.name}</strong><div className='muted small mono'>{s.matric}</div></div>
                                </div>
                                <div className='segmented' role='radiogroup' aria-label={`Attendance for ${s.name}`}>
                                    {STATUSES.map((status) => (
                                        <button
                                            key={status}
                                            type='button'
                                            role='radio'
                                            aria-checked={data.byStudent[s.id] === status}
                                            className={`seg seg-${status.toLowerCase()}`}
                                            onClick={() => mark(s.id, date, status)}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : <Empty>No active students in this program.</Empty>}
            </section>
        </>
    )
}
