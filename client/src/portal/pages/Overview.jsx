import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { getAdminOverview, getStudentRecord, listAnnouncements } from '../../data/api'
import { useLiveData } from '../../data/useLiveData'
import { attendanceRate, computeGPA, gradeFor } from '../../lib/grading'
import { formatDate, timeAgo } from '../../lib/dates'
import { BarList, ColumnChart } from '../components/charts'
import { Avatar, Badge, Empty, PageHeader, StatTile } from '../components/ui'

const pct = (v) => `${v}%`

export default function Overview() {
    const { user } = useAuth()
    return user.role === 'admin' ? <AdminOverview user={user} /> : <StudentOverview user={user} />
}

function greeting() {
    const h = new Date().getHours()
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

function AdminOverview({ user }) {
    const overview = useLiveData(getAdminOverview)
    const announcements = useLiveData(() => listAnnouncements({ limit: 3 }), [user.id])

    if (!overview || !announcements) return <div className='page-loader' />
    const { totals, dailyAttendance, gradeDistribution, studentsByProgram, newestStudents } = overview

    const attendanceSeries = dailyAttendance.map((d) => ({
        label: d.date,
        short: formatDate(d.date, { day: 'numeric', month: 'short' }),
        tip: formatDate(d.date, { weekday: 'long', day: 'numeric', month: 'long' }),
        value: d.rate,
    }))
    const gradeSeries = gradeDistribution.map((g) => ({ label: g.grade, value: g.count, tip: `Grade ${g.grade} results` }))
    const programSeries = studentsByProgram.map((p) => ({
        label: p.program,
        value: p.count,
        tip: `${Math.round((p.count / (totals.students || 1)) * 100)}% of all students`,
    }))

    return (
        <>
            <PageHeader title={`${greeting()}, ${user.name.split(' ')[0]}`} subtitle="Here's what's happening across campus." />

            <div className='stat-grid'>
                <StatTile icon='users' label='Active students' value={totals.activeStudents} hint={`${totals.students} enrolled in total`} />
                <StatTile icon='book' label='Courses' value={totals.courses} hint={`across ${totals.programs} programs`} />
                <StatTile icon='calendar' label='Attendance' value={pct(totals.attendanceRate)} hint={`last ${totals.attendanceDays} school days`} />
                <StatTile icon='inbox' label='Unread messages' value={totals.unreadMessages} hint={<Link to='/dashboard/messages'>Open inbox →</Link>} />
            </div>

            <div className='grid-2'>
                <section className='card'>
                    <h2 className='card-title'>Daily attendance rate</h2>
                    <p className='card-sub'>Present or late, as a share of all students</p>
                    {attendanceSeries.length
                        ? <ColumnChart data={attendanceSeries} format={pct} max={100} label='Daily attendance rate' />
                        : <Empty>No attendance recorded yet.</Empty>}
                </section>
                <section className='card'>
                    <h2 className='card-title'>Grade distribution</h2>
                    <p className='card-sub'>{totals.gradedResults} graded course results this session</p>
                    <ColumnChart data={gradeSeries} showValues label='Grade distribution' />
                </section>
            </div>

            <div className='grid-3'>
                <section className='card'>
                    <h2 className='card-title'>Students by program</h2>
                    <BarList data={programSeries} />
                </section>
                <section className='card'>
                    <div className='card-title-row'>
                        <h2 className='card-title'>Newest students</h2>
                        <Link to='/dashboard/students' className='link'>View all</Link>
                    </div>
                    <ul className='people-list'>
                        {newestStudents.map((s) => (
                            <li key={s.id}>
                                <Avatar name={s.name} size={32} />
                                <div>
                                    <strong>{s.name}</strong>
                                    <span>{s.program} · {s.level}L</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>
                <section className='card'>
                    <div className='card-title-row'>
                        <h2 className='card-title'>Announcements</h2>
                        <Link to='/dashboard/announcements' className='link'>Manage</Link>
                    </div>
                    <AnnouncementList items={announcements} />
                </section>
            </div>
        </>
    )
}

function StudentOverview({ user }) {
    // null = no linked student record; undefined = loading
    const record = useLiveData(() => (user.studentId ? getStudentRecord(user.studentId) : null), [user.studentId])
    const announcements = useLiveData(() => listAnnouncements({ limit: 4 }), [user.id])

    if (record === undefined || !announcements) return <div className='page-loader' />
    if (!record) {
        return <Empty>Your account isn't linked to a student record yet. Please contact the registrar.</Empty>
    }
    const { student, program, results, attendance } = record
    const units = results.reduce((n, r) => n + r.units, 0)
    const recent = attendance.slice(-10)

    return (
        <>
            <PageHeader title={`${greeting()}, ${student.name.split(' ')[0]}`} subtitle={`${program?.name} · ${student.level} Level · ${student.matric}`} />

            <div className='stat-grid'>
                <StatTile icon='grade' label='CGPA' value={computeGPA(results)} hint='on a 5.0 scale' />
                <StatTile icon='book' label='Courses' value={results.length} hint={`${units} units registered`} />
                <StatTile icon='calendar' label='Attendance' value={pct(attendanceRate(attendance))} hint={`${attendance.length} days recorded`} />
                <StatTile icon='student' label='Status' value={<Badge>{student.status}</Badge>} hint={`since ${formatDate(student.enrolledAt)}`} />
            </div>

            <div className='grid-2'>
                <section className='card'>
                    <h2 className='card-title'>My results</h2>
                    <div className='table-wrap'>
                        <table className='table'>
                            <thead><tr><th>Course</th><th className='num'>Units</th><th className='num'>Score</th><th>Grade</th></tr></thead>
                            <tbody>
                                {results.map((r) => (
                                    <tr key={r.enrollmentId}>
                                        <td><strong>{r.code}</strong><div className='muted small'>{r.title}</div></td>
                                        <td className='num'>{r.units}</td>
                                        <td className='num'>{r.score ?? '—'}</td>
                                        <td>{r.score == null ? <span className='muted'>Pending</span> : <Badge>{gradeFor(r.score)}</Badge>}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
                <div className='stack'>
                    <section className='card'>
                        <h2 className='card-title'>Recent attendance</h2>
                        {recent.length ? (
                            <ul className='attendance-strip'>
                                {recent.map((a) => (
                                    <li key={a.id}>
                                        <span className='muted small'>{formatDate(a.date, { weekday: 'short', day: 'numeric' })}</span>
                                        <Badge>{a.status}</Badge>
                                    </li>
                                ))}
                            </ul>
                        ) : <Empty>No attendance recorded yet.</Empty>}
                    </section>
                    <section className='card'>
                        <h2 className='card-title'>Announcements</h2>
                        <AnnouncementList items={announcements} />
                    </section>
                </div>
            </div>
        </>
    )
}

function AnnouncementList({ items }) {
    if (!items.length) return <Empty>No announcements yet.</Empty>
    return (
        <ul className='announce-list'>
            {items.map((a) => (
                <li key={a.id}>
                    <strong>{a.title}</strong>
                    <p>{a.body}</p>
                    <span className='muted small'>{timeAgo(a.createdAt)} · {a.audience}</span>
                </li>
            ))}
        </ul>
    )
}
