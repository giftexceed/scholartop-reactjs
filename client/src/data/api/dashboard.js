import { GRADES, gradeFor } from '../../lib/grading'
import { db } from '../local/db'
import { getDailyAttendance } from './attendance'
import { countUnreadMessages } from './messages'

/**
 * Aggregates for the admin overview. With a backend this becomes one
 * endpoint / SQL view so the browser never downloads every row.
 */
export async function getAdminOverview() {
    const [students, programs, courseCount, enrollments, daily, unread] = await Promise.all([
        db.students.toArray(),
        db.programs.orderBy('code').toArray(),
        db.courses.count(),
        db.enrollments.toArray(),
        getDailyAttendance(10),
        countUnreadMessages(),
    ])
    const graded = enrollments.filter((e) => e.score != null)
    const programName = Object.fromEntries(programs.map((p) => [p.id, p.name]))
    const totalDays = daily.reduce((n, d) => n + d.total, 0)
    const presentDays = daily.reduce((n, d) => n + d.present, 0)

    return {
        totals: {
            students: students.length,
            activeStudents: students.filter((s) => s.status === 'Active').length,
            courses: courseCount,
            programs: programs.length,
            unreadMessages: unread,
            attendanceRate: totalDays ? Math.round((presentDays / totalDays) * 100) : 0,
            attendanceDays: daily.length,
            gradedResults: graded.length,
        },
        dailyAttendance: daily.map((d) => ({ date: d.date, rate: Math.round((d.present / d.total) * 100) })),
        gradeDistribution: GRADES.map((grade) => ({ grade, count: graded.filter((e) => gradeFor(e.score) === grade).length })),
        studentsByProgram: programs.map((p) => ({ program: p.name, count: students.filter((s) => s.programId === p.id).length })),
        newestStudents: [...students]
            .sort((a, b) => b.enrolledAt.localeCompare(a.enrolledAt))
            .slice(0, 5)
            .map((s) => ({ id: s.id, name: s.name, level: s.level, program: programName[s.programId] })),
    }
}
