import { useState } from 'react'
import { ATTENDANCE_STATUSES, getRegister, listPrograms, markAttendance } from '../../data/api'
import { useLiveData } from '../../data/useLiveData'
import { todayISO } from '../../lib/dates'
import { Avatar, Empty, PageHeader } from '../components/ui'

export default function Attendance() {
    const [date, setDate] = useState(todayISO)
    const [programId, setProgramId] = useState('')

    const programs = useLiveData(listPrograms)
    const register = useLiveData(() => getRegister(date), [date])

    if (!register || !programs) return <div className='page-loader' />

    const { statusByStudent } = register
    const students = register.students.filter((s) => !programId || s.programId === programId)
    const counts = Object.fromEntries(ATTENDANCE_STATUSES.map((s) => [s, students.filter((st) => statusByStudent[st.id] === s).length]))
    const unmarked = students.filter((s) => !statusByStudent[s.id])

    const mark = async (ids, status) => {
        try { await markAttendance(ids, date, status) } catch (err) { alert(err.message) }
    }

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
                        {ATTENDANCE_STATUSES.map((s) => <span key={s} className='att-count'><strong>{counts[s]}</strong> {s}</span>)}
                        <span className='att-count'><strong>{unmarked.length}</strong> Unmarked</span>
                    </div>
                    <button className='button' onClick={() => mark(unmarked.map((s) => s.id), 'Present')} disabled={!unmarked.length}>
                        Mark unmarked as present
                    </button>
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
                                    {ATTENDANCE_STATUSES.map((status) => (
                                        <button
                                            key={status}
                                            type='button'
                                            role='radio'
                                            aria-checked={statusByStudent[s.id] === status}
                                            className={`seg seg-${status.toLowerCase()}`}
                                            onClick={() => mark(s.id, status)}
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
