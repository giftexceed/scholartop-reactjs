import { SITE } from '../../config/site'
import { localISODate } from '../../lib/dates'
import { hashPassword, randomSalt } from './crypto'
import { db, now, uuid } from './db'

export const DEMO_ADMIN = { email: `admin@${SITE.emailDomain}`, password: 'admin123' }
export const DEMO_STUDENT = { email: `student@${SITE.emailDomain}`, password: 'student123' }

const PROGRAMS = [
    { code: 'UGD', name: 'Graduation Degree', award: 'B.Sc.', duration: '4 years', levels: [100, 200, 300, 400] },
    { code: 'MSC', name: 'Master Degree', award: 'M.Sc.', duration: '2 years', levels: [700] },
    { code: 'PGD', name: 'Post Graduation', award: 'PGD / Ph.D.', duration: '1–3 years', levels: [800] },
]

const COURSES = [
    ['CSC101', 'Introduction to Computing', 'UGD', 3, 'Dr. Amaka Obi'],
    ['MTH102', 'Calculus I', 'UGD', 3, 'Prof. Tunde Bakare'],
    ['ENG103', 'Communication Skills', 'UGD', 2, 'Mrs. Grace Ekpo'],
    ['PHY104', 'General Physics', 'UGD', 3, 'Dr. Ibrahim Musa'],
    ['MSC501', 'Advanced Research Methods', 'MSC', 3, 'Prof. Chika Nwosu'],
    ['MSC502', 'Data Science & Analytics', 'MSC', 4, 'Dr. Femi Adeyemi'],
    ['MSC503', 'Leadership & Ethics', 'MSC', 2, 'Dr. Halima Sani'],
    ['PGD601', 'Thesis Seminar', 'PGD', 4, 'Prof. Kelechi Eze'],
    ['PGD602', 'Policy & Development', 'PGD', 3, 'Dr. Ruth Danjuma'],
]

const FIRST = ['Chinedu', 'Aisha', 'Tobi', 'Ngozi', 'Emeka', 'Fatima', 'Segun', 'Zainab', 'David', 'Blessing',
    'Yusuf', 'Chioma', 'Samuel', 'Hadiza', 'Kunle', 'Adaeze', 'Ibrahim', 'Funmi', 'Daniel', 'Amina']
const LAST = ['Okafor', 'Bello', 'Adeyemi', 'Eze', 'Abubakar', 'Okonkwo', 'Ogunleye', 'Musa', 'Nwachukwu', 'Ibrahim',
    'Balogun', 'Uche', 'Lawal', 'Onyeka', 'Danladi']

const STUDENT_COUNT = 40

// Deterministic PRNG so every fresh install shows the same demo data.
function mulberry32(seed) {
    return () => {
        seed |= 0; seed = (seed + 0x6d2b79f5) | 0
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

// Last n weekdays up to and including today, oldest first.
function recentSchoolDays(n) {
    const days = []
    const d = new Date()
    while (days.length < n) {
        const dow = d.getDay()
        if (dow !== 0 && dow !== 6) days.unshift(localISODate(d))
        d.setDate(d.getDate() - 1)
    }
    return days
}

async function makeUser(fields, password) {
    const salt = randomSalt()
    return { id: uuid(), phone: '', studentId: null, createdAt: now(), ...fields, salt, passwordHash: await hashPassword(password, salt) }
}

// Memoised so concurrent callers (StrictMode, multiple components) seed only once.
let seeding = null
export function seedIfEmpty() {
    seeding ??= seed().catch((err) => { seeding = null; throw err })
    return seeding
}

async function seed() {
    if (await db.meta.get('seeded')) return

    // Hash outside the transaction: IndexedDB transactions auto-commit across non-DB awaits.
    const admin = await makeUser({ name: 'Registrar Admin', email: DEMO_ADMIN.email, role: 'admin', phone: SITE.phone }, DEMO_ADMIN.password)
    const studentUser = await makeUser({ name: 'Chinedu Okafor', email: DEMO_STUDENT.email, role: 'student' }, DEMO_STUDENT.password)

    const rand = mulberry32(2026)
    const pick = (arr) => arr[Math.floor(rand() * arr.length)]
    const year = new Date().getFullYear()
    const days = recentSchoolDays(10)
    const stamp = now()

    const programs = PROGRAMS.map((p) => ({ id: uuid(), createdAt: stamp, ...p }))
    const programByCode = Object.fromEntries(programs.map((p) => [p.code, p]))

    const courses = COURSES.map(([code, title, prog, units, lecturer]) => ({
        id: uuid(), code, title, units, lecturer, programId: programByCode[prog].id, createdAt: stamp,
    }))

    const students = []
    for (let i = 0; i < STUDENT_COUNT; i++) {
        const isDemo = i === 0
        const first = isDemo ? 'Chinedu' : pick(FIRST)
        const last = isDemo ? 'Okafor' : pick(LAST)
        const program = programByCode[isDemo ? 'UGD' : (i % 5 < 3 ? 'UGD' : i % 5 === 3 ? 'MSC' : 'PGD')]
        const enrolledAt = new Date(year - 1, Math.floor(rand() * 12), 1 + Math.floor(rand() * 27)).toISOString()
        students.push({
            id: uuid(),
            matric: `${SITE.matricPrefix}/${year}/${String(i + 1).padStart(4, '0')}`,
            name: `${first} ${last}`,
            email: isDemo ? DEMO_STUDENT.email : `${first}.${last}${i}@student.${SITE.emailDomain}`.toLowerCase(),
            phone: `+23480${String(Math.floor(rand() * 1e8)).padStart(8, '0')}`,
            gender: rand() > 0.5 ? 'Female' : 'Male',
            programId: program.id,
            level: pick(program.levels),
            status: isDemo || rand() <= 0.92 ? 'Active' : 'Suspended',
            userId: isDemo ? studentUser.id : null,
            enrolledAt,
            createdAt: enrolledAt,
        })
    }
    studentUser.studentId = students[0].id

    const enrollments = []
    const attendance = []
    for (const s of students) {
        const ability = 45 + rand() * 40
        for (const c of courses.filter((c) => c.programId === s.programId)) {
            const graded = rand() > 0.1
            const score = Math.max(20, Math.min(98, Math.round(ability + (rand() - 0.5) * 30)))
            enrollments.push({ id: uuid(), studentId: s.id, courseId: c.id, score: graded ? score : null, createdAt: stamp })
        }
        const diligence = 0.7 + rand() * 0.28
        for (const date of days) {
            const r = rand()
            const status = r < diligence ? 'Present' : r < diligence + 0.06 ? 'Late' : 'Absent'
            attendance.push({ id: uuid(), studentId: s.id, date, status, createdAt: stamp })
        }
    }

    const hoursAgo = (h) => new Date(Date.now() - h * 3600e3).toISOString()
    const announcements = [
        ['First semester exams timetable released', 'The examination timetable is now available. Check your course pages and confirm there are no clashes before Friday.', 'All', 5],
        ['Library opening hours extended', 'The main library will stay open until 10pm on weekdays throughout the exam period.', 'All', 30],
        ['Masters thesis proposal deadline', 'M.Sc. candidates should submit their thesis proposals to the department office by the end of the month.', 'Master Degree', 72],
        ['Campus career fair', 'Over 30 employers will be on campus next Wednesday. Bring printed copies of your CV.', 'All', 120],
    ].map(([title, body, audience, h]) => ({ id: uuid(), title, body, audience, authorId: admin.id, createdAt: hoursAgo(h) }))

    const messages = [
        ['Mrs. Bisi Ade', '+2348031234567', 'Good day, I would like to know the admission requirements for the Masters programme.', false, 2],
        ['Ahmed Garba', '+2348099876543', 'When does registration for the next session begin?', false, 26],
        ['Joy Etim', '+2347012223344', 'Thank you for the campus tour last week. It was very informative.', true, 80],
    ].map(([name, phone, message, read, h]) => ({ id: uuid(), name, phone, message, read, createdAt: hoursAgo(h) }))

    await db.transaction('rw', db.tables, async () => {
        await db.programs.bulkAdd(programs)
        await db.courses.bulkAdd(courses)
        await db.students.bulkAdd(students)
        await db.enrollments.bulkAdd(enrollments)
        await db.attendance.bulkAdd(attendance)
        await db.users.bulkAdd([admin, studentUser])
        await db.announcements.bulkAdd(announcements)
        await db.messages.bulkAdd(messages)
        await db.meta.bulkPut([
            { key: 'seeded', value: stamp },
            { key: 'matricSeq', value: STUDENT_COUNT },
        ])
    })
}

export async function resetLocalData() {
    // Clear rather than db.delete(): deleting closes the connection and would
    // break any live queries still mounted.
    await db.transaction('rw', db.tables, () => Promise.all(db.tables.map((t) => t.clear())))
    seeding = null
    await seedIfEmpty()
}
