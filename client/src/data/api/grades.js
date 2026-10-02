import { DataError } from '../errors'
import { db } from '../local/db'
import { requireAdmin } from './_context'

/** Enrolled students for a course with their scores, sorted by name. */
export async function getGradebook(courseId) {
    if (!courseId) return []
    const enrollments = await db.enrollments.where('courseId').equals(courseId).toArray()
    const students = await db.students.bulkGet(enrollments.map((e) => e.studentId))
    return enrollments
        .map((e, i) => students[i] && {
            enrollmentId: e.id,
            score: e.score,
            student: { id: students[i].id, name: students[i].name, matric: students[i].matric },
        })
        .filter(Boolean)
        .sort((a, b) => a.student.name.localeCompare(b.student.name))
}

/** score: integer 0–100, or null to clear. */
export async function setScore(enrollmentId, score) {
    await requireAdmin()
    if (score != null && !(Number.isInteger(score) && score >= 0 && score <= 100)) {
        throw new DataError('invalid', 'Score must be a whole number from 0 to 100.')
    }
    await db.enrollments.update(enrollmentId, { score })
}
