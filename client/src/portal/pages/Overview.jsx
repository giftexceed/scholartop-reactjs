import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useAuth } from '../../auth/AuthContext'
import { computeGPA, db, gradeFor } from '../../db/db'
import { BarList, ColumnChart } from '../components/charts'
import { Avatar, Badge, Empty, PageHeader, StatTile } from '../components/ui'
import { formatDate, timeAgo } from '../format'

const pct = (v) => `${v}%`
const GRADES = ['A', 'B', 'C', 'D', 'E', 'F']

export default function Overview() {
    const { user } = useAuth()
    return user.role === 'admin' ? <AdminOverview user={user} /> : <StudentOverview user={user} />
}

function greeting() {
    const h = new Date().getHours()
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

function attendanceRate(rows) {
    if (!rows.length) return 0
    const present = rows.filter((r) => r.status !== 'Absent').length
    return Math.round((present / rows.length) * 100)
}

function AdminOverview({ user }) {
    const data = useLiveQuery(async () => {
        const [students, programs, courses, enrollments, attendance, announcements, unread] = await Promise.all([
            db.students.toArray(),
            db.programs.toArray(),
            db.courses.count(),
            db.enrollments.toArray(),
            db.attendance.toArray(),
            db.announcements.orderBy('createdAt').reverse().limit(3).toArray(),
            db.messages.where('read').equals(0).count(),
        ])
        return { students, programs, courses, enrollments, attendance, announcements, unread }
    }, [])

    if (!data) return <div className='page-loader' />
    const { students, programs, courses, enrollments, attendance, announcements, unread } = data

    const active = students.filter((s) => s.status === 'Active').length

    const byDate = {}
    for (const a of attendance) (byDate[a.date] ??= []).push(a)
    const days = Object.keys(byDate).sort().slice(-10)
    const attendanceSeries = days.map((d) => ({
        label: d,
        short: formatDate(d, { day: 'numeric', month: 'short' }),
        tip: formatDate(d, { weekday: 'long', day: 'numeric', month: 'long' }),
        value: attendanceRate(byDate[d]),
    }))
    const overallAttendance = attendanceRate(days.flatMap((d) => byDate[d]))

    const byProgram = programs.map((p) => {
        const n = students.filter((s) => s.programId === p.id).length
        return { label: p.name, value: n, tip: `${Math.round((n / (students.length || 1)) * 100)}% of all students` }
    })

    const graded = enrollments.filter((e) => e.score != null)
    const gradeCounts = GRADES.map((g) => ({
        label: g,
        value: graded.filter((e) => gradeFor(e.score) === g).length,
        tip: `Grade ${g} results`,
    }))

    const newest = [...students].sort((a, b) => b.enrolledAt.localeCompare(a.enrolledAt)).slice(0, 5)
    const programName = Object.fromEntries(programs.map((p) => [p.id, p.name]))

    return (
        <>
            <PageHeader title={`${greeting()}, ${user.name.split(' ')[0]}`} subtitle="Here's what's happening across campus." />

            <div className='stat-grid'>
                <StatTile icon='users' label='Active students' value={active} hint={`${students.length} enrolled in total`} />
                <StatTile icon='book' label='Courses' value={courses} hint={`across ${programs.length} programs`} />
                <StatTile icon='calendar' label='Attendance' value={pct(overallAttendance)} hint={`last ${days.length} school days`} />
                <StatTile icon='inbox' label='Unread messages' value={unread} hint={<Link to='/dashboard/messages'>Open inbox →</Link>} />
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
                    <p className='card-sub'>{graded.length} graded course results this session</p>
                    <ColumnChart data={gradeCounts} showValues label='Grade distribution' />
                </section>
            </div>

            <div className='grid-3'>
                <section className='card'>
                    <h2 className='card-title'>Students by program</h2>
                    <BarList data={byProgram} />
                </section>
                <section className='card'>
                    <div className='card-title-row'>
                        <h2 className='card-title'>Newest students</h2>
                        <Link to='/dashboard/students' className='link'>View all</Link>
                    </div>
                    <ul className='people-list'>
                        {newest.map((s) => (
                            <li key={s.id}>
                                <Avatar name={s.name} size={32} />
                                <div>
                                    <strong>{s.name}</strong>
                                    <span>{programName[s.programId]} · {s.level}L</span>
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
    const data = useLiveQuery(async () => {
        const student = user.studentId ? await db.students.get(user.studentId) : null
        if (!student) return { student: null }
        const [program, enrollments, attendance, announcements] = await Promise.all([
            db.programs.get(student.programId),
            db.enrollments.where('studentId').equals(student.id).toArray(),
            db.attendance.where('studentId').equals(student.id).sortBy('date'),
            db.announcements.orderBy('createdAt').reverse().toArray(),
        ])
        const courses = await db.courses.bulkGet(enrollments.map((e) => e.courseId))
        const results = enrollments.map((e, i) => ({ ...e, ...courses[i], id: e.id })).filter((r) => r.code)
        return {
            student, program, results, attendance,
            announcements: announcements.filter((a) => a.audience === 'All' || a.audience === program?.name).slice(0, 4),
        }
    }, [user.studentId])

    if (!data) return <div className='page-loader' />
    if (!data.student) {
        return <Empty>Your account isn't linked to a student record yet. Please contact the registrar.</Empty>
    }
    const { student, program, results, attendance, announcements } = data
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
                                    <tr key={r.id}>
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
