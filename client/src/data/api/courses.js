import { mapConflict } from '../errors'
import { db, row } from '../local/db'
import { requireAdmin } from './_context'

/** All courses with enrollment count and average score. */
export async function listCoursesWithStats() {
    const [courses, enrollments] = await Promise.all([db.courses.toArray(), db.enrollments.toArray()])
    const stats = {}
    for (const e of enrollments) {
        const s = (stats[e.courseId] ??= { enrolled: 0, total: 0, graded: 0 })
        s.enrolled++
        if (e.score != null) { s.total += e.score; s.graded++ }
    }
    return courses
        .map((c) => {
            const s = stats[c.id] || { enrolled: 0, total: 0, graded: 0 }
            return { ...c, enrolled: s.enrolled, averageScore: s.graded ? Math.round(s.total / s.graded) : null }
        })
        .sort((a, b) => a.code.localeCompare(b.code))
}

/** Create a course; every student already in the program is enrolled in it. */
export async function createCourse({ code, title, units, lecturer, programId }) {
    await requireAdmin()
    return mapConflict(db.transaction('rw', db.courses, db.students, db.enrollments, async () => {
        const course = row({ code: code.trim().toUpperCase(), title: title.trim(), units, lecturer: lecturer.trim(), programId })
        await db.courses.add(course)
        const studentIds = await db.students.where('programId').equals(programId).primaryKeys()
        await db.enrollments.bulkAdd(studentIds.map((studentId) => row({ studentId, courseId: course.id, score: null })))
        return course
    }), 'A course with that code already exists.')
}
