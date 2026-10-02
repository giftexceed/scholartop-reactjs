import { useSearchParams } from 'react-router-dom'
import { getGradebook, listCoursesWithStats, setScore } from '../../data/api'
import { useLiveData } from '../../data/useLiveData'
import { gradeFor } from '../../lib/grading'
import { Avatar, Badge, Empty, PageHeader } from '../components/ui'

export default function Gradebook() {
    const [params, setParams] = useSearchParams()
    const courses = useLiveData(listCoursesWithStats)
    const courseId = params.get('course') || courses?.[0]?.id
    const rows = useLiveData(() => getGradebook(courseId), [courseId])

    if (!courses || !rows) return <div className='page-loader' />

    const course = courses.find((c) => c.id === courseId)
    const graded = rows.filter((r) => r.score != null)
    const avg = graded.length ? Math.round(graded.reduce((n, r) => n + r.score, 0) / graded.length) : null

    const saveScore = async (row, raw) => {
        const score = raw === '' ? null : Math.max(0, Math.min(100, Math.round(Number(raw))))
        if (Number.isNaN(score) || score === row.score) return
        try { await setScore(row.enrollmentId, score) } catch (err) { alert(err.message) }
    }

    return (
        <>
            <PageHeader title='Gradebook' subtitle='Scores save automatically when you leave a field.'>
                <select value={courseId || ''} onChange={(e) => setParams({ course: e.target.value })} aria-label='Course'>
                    {courses.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.title}</option>)}
                </select>
            </PageHeader>

            <section className='card'>
                {course && (
                    <div className='card-title-row'>
                        <h2 className='card-title'>{course.code} · {course.title}</h2>
                        <span className='muted small'>
                            {graded.length}/{rows.length} graded{avg != null && <> · class average <strong>{avg}</strong> ({gradeFor(avg)})</>}
                        </span>
                    </div>
                )}
                {rows.length ? (
                    <div className='table-wrap'>
                        <table className='table'>
                            <thead><tr><th>Student</th><th>Matric no.</th><th className='num'>Score (0–100)</th><th>Grade</th></tr></thead>
                            <tbody>
                                {rows.map((r) => (
                                    <tr key={r.enrollmentId}>
                                        <td><div className='person'><Avatar name={r.student.name} size={28} /><strong>{r.student.name}</strong></div></td>
                                        <td className='mono'>{r.student.matric}</td>
                                        <td className='num'>
                                            <input
                                                className='score-input'
                                                type='number'
                                                min='0'
                                                max='100'
                                                inputMode='numeric'
                                                defaultValue={r.score ?? ''}
                                                key={`${r.enrollmentId}-${r.score}`}
                                                onBlur={(e) => saveScore(r, e.target.value)}
                                                onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
                                                aria-label={`Score for ${r.student.name}`}
                                            />
                                        </td>
                                        <td>{r.score == null ? <span className='muted'>Pending</span> : <Badge>{gradeFor(r.score)}</Badge>}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : <Empty>No students are enrolled in this course.</Empty>}
            </section>
        </>
    )
}
