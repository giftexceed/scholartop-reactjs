import { SITE } from '../../config/site'
import { DataError, mapConflict } from '../errors'
import { db, now, row } from '../local/db'
import { nextMatric, requireAdmin, requireUser } from './_context'

export const STUDENT_STATUSES = ['Active', 'Suspended', 'Graduated']

export const listStudents = () => db.students.toArray()

async function enrollInProgram(studentId, programId) {
    const courseIds = await db.courses.where('programId').equals(programId).primaryKeys()
    await db.enrollments.bulkAdd(courseIds.map((courseId) => row({ studentId, courseId, score: null })))
}

const CONFLICT = 'Another student already uses that email or matric number.'

export async function createStudent(input) {
    await requireAdmin()
    return mapConflict(db.transaction('rw', db.students, db.courses, db.enrollments, db.meta, async () => {
        const seq = await nextMatric()
        const student = row({
            ...input,
            matric: `${SITE.matricPrefix}/${new Date().getFullYear()}/${String(seq).padStart(4, '0')}`,
            userId: null,
            enrolledAt: now(),
        })
        await db.students.add(student)
        await enrollInProgram(student.id, input.programId)
        return student
    }), CONFLICT)
}

/** Changing program re-enrolls the student in the new program's courses. */
export async function updateStudent(id, input) {
    await requireAdmin()
    await mapConflict(db.transaction('rw', db.students, db.users, db.courses, db.enrollments, async () => {
        const existing = await db.students.get(id)
        if (!existing) throw new DataError('not_found', 'Student not found.')
        await db.students.update(id, input)
        if (existing.programId !== input.programId) {
            await db.enrollments.where('studentId').equals(id).delete()
            await enrollInProgram(id, input.programId)
        }
        // Keep the linked login account's contact details in sync.
        if (existing.userId) await db.users.update(existing.userId, { name: input.name, phone: input.phone })
    }), CONFLICT)
}

/** Deletes the student with their results and attendance; any login account is kept but unlinked. */
export async function deleteStudent(id) {
    await requireAdmin()
    await db.transaction('rw', db.students, db.users, db.enrollments, db.attendance, async () => {
        const s = await db.students.get(id)
        if (!s) return
        await db.enrollments.where('studentId').equals(id).delete()
        await db.attendance.where('studentId').equals(id).delete()
        if (s.userId) await db.users.update(s.userId, { studentId: null })
        await db.students.delete(id)
    })
}

/**
 * A student's full record: program, course results and attendance.
 * Students may only read their own; admins may read anyone's.
 */
export async function getStudentRecord(studentId) {
    const user = await requireUser()
    if (user.role !== 'admin' && user.studentId !== studentId) {
        throw new DataError('forbidden', 'You can only view your own record.')
    }
    const student = studentId ? await db.students.get(studentId) : null
    if (!student) return null
    const [program, enrollments, attendance] = await Promise.all([
        db.programs.get(student.programId),
        db.enrollments.where('studentId').equals(studentId).toArray(),
        db.attendance.where('studentId').equals(studentId).sortBy('date'),
    ])
    const courses = await db.courses.bulkGet(enrollments.map((e) => e.courseId))
    const results = enrollments
        .map((e, i) => courses[i] && {
            enrollmentId: e.id, score: e.score,
            courseId: courses[i].id, code: courses[i].code, title: courses[i].title,
            units: courses[i].units, lecturer: courses[i].lecturer,
        })
        .filter(Boolean)
        .sort((a, b) => a.code.localeCompare(b.code))
    return { student, program, results, attendance }
}
