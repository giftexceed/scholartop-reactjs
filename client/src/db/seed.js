import { db, hashPassword, localISODate, randomSalt } from './db'

export const DEMO_ADMIN = { email: 'admin@easypoint.edu', password: 'admin123' }
export const DEMO_STUDENT = { email: 'student@easypoint.edu', password: 'student123' }

const PROGRAMS = [
    { code: 'UGD', name: 'Graduation Degree', award: 'B.Sc.', duration: '4 years' },
    { code: 'MSC', name: 'Master Degree', award: 'M.Sc.', duration: '2 years' },
    { code: 'PGD', name: 'Post Graduation', award: 'PGD / Ph.D.', duration: '1–3 years' },
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

async function makeUser(name, email, password, role, extra = {}) {
    const salt = randomSalt()
    return {
        name, email, role, salt,
        passwordHash: await hashPassword(password, salt),
        phone: '',
        createdAt: new Date().toISOString(),
        ...extra,
    }
}

// Memoised so concurrent callers (StrictMode, multiple components) seed only once.
let seeding = null
export function seedIfEmpty() {
    seeding ??= seed().catch((err) => { seeding = null; throw err })
    return seeding
}

async function seed() {
    const done = await db.meta.get('seeded')
    if (done) return

    // Hash outside the transaction: IndexedDB transactions auto-commit across non-DB awaits.
    const admin = await makeUser('Registrar Admin', DEMO_ADMIN.email, DEMO_ADMIN.password, 'admin', { phone: '+2347035923194' })
    const studentUser = await makeUser('Chinedu Okafor', DEMO_STUDENT.email, DEMO_STUDENT.password, 'student')

    const rand = mulberry32(2026)
    const pick = (arr) => arr[Math.floor(rand() * arr.length)]
    const year = new Date().getFullYear()
    const days = recentSchoolDays(10)

    await db.transaction('rw', db.tables, async () => {
        const programIds = await db.programs.bulkAdd(PROGRAMS, { allKeys: true })
        const programByCode = Object.fromEntries(PROGRAMS.map((p, i) => [p.code, programIds[i]]))

        const courses = COURSES.map(([code, title, prog, units, lecturer]) => ({
            code, title, units, lecturer, programId: programByCode[prog],
        }))
        const courseIds = await db.courses.bulkAdd(courses, { allKeys: true })
        courses.forEach((c, i) => { c.id = courseIds[i] })

        const students = []
        for (let i = 0; i < 40; i++) {
            const isDemo = i === 0
            const first = isDemo ? 'Chinedu' : pick(FIRST)
            const last = isDemo ? 'Okafor' : pick(LAST)
            const prog = isDemo ? 'UGD' : (i % 5 < 3 ? 'UGD' : i % 5 === 3 ? 'MSC' : 'PGD')
            students.push({
                matric: `EP/${year}/${String(i + 1).padStart(4, '0')}`,
                name: `${first} ${last}`,
                email: isDemo ? DEMO_STUDENT.email : `${first}.${last}${i}@student.easypoint.edu`.toLowerCase(),
                phone: `+23480${String(Math.floor(rand() * 1e8)).padStart(8, '0')}`,
                gender: rand() > 0.5 ? 'Female' : 'Male',
                programId: programByCode[prog],
                level: prog === 'UGD' ? pick([100, 200, 300, 400]) : prog === 'MSC' ? 700 : 800,
                status: rand() > 0.92 ? 'Suspended' : 'Active',
                enrolledAt: new Date(year - 1, Math.floor(rand() * 12), 1 + Math.floor(rand() * 27)).toISOString(),
            })
        }
        students[0].status = 'Active'
        const studentIds = await db.students.bulkAdd(students, { allKeys: true })

        const enrollments = []
        const attendance = []
        students.forEach((s, i) => {
            const sid = studentIds[i]
            const ability = 45 + rand() * 40
            courses.filter((c) => c.programId === s.programId).forEach((c) => {
                const graded = rand() > 0.1
                const score = Math.max(20, Math.min(98, Math.round(ability + (rand() - 0.5) * 30)))
                enrollments.push({ studentId: sid, courseId: c.id, score: graded ? score : null })
            })
            const diligence = 0.7 + rand() * 0.28
            days.forEach((date) => {
                const r = rand()
                const status = r < diligence ? 'Present' : r < diligence + 0.06 ? 'Late' : 'Absent'
                attendance.push({ studentId: sid, date, status })
            })
        })
        await db.enrollments.bulkAdd(enrollments)
        await db.attendance.bulkAdd(attendance)

        const adminId = await db.users.add(admin)
        const studentUserId = await db.users.add({ ...studentUser, studentId: studentIds[0] })
        await db.students.update(studentIds[0], { userId: studentUserId })

        const now = Date.now()
        const hoursAgo = (h) => new Date(now - h * 3600e3).toISOString()
        await db.announcements.bulkAdd([
            { title: 'First semester exams timetable released', body: 'The examination timetable is now available. Check your course pages and confirm there are no clashes before Friday.', audience: 'All', authorId: adminId, createdAt: hoursAgo(5) },
            { title: 'Library opening hours extended', body: 'The main library will stay open until 10pm on weekdays throughout the exam period.', audience: 'All', authorId: adminId, createdAt: hoursAgo(30) },
            { title: 'Masters thesis proposal deadline', body: 'M.Sc. candidates should submit their thesis proposals to the department office by the end of the month.', audience: 'Master Degree', authorId: adminId, createdAt: hoursAgo(72) },
            { title: 'Campus career fair', body: 'Over 30 employers will be on campus next Wednesday. Bring printed copies of your CV.', audience: 'All', authorId: adminId, createdAt: hoursAgo(120) },
        ])

        await db.messages.bulkAdd([
            { name: 'Mrs. Bisi Ade', phone: '+2348031234567', message: 'Good day, I would like to know the admission requirements for the Masters programme.', read: 0, createdAt: hoursAgo(2) },
            { name: 'Ahmed Garba', phone: '+2348099876543', message: 'When does registration for the next session begin?', read: 0, createdAt: hoursAgo(26) },
            { name: 'Joy Etim', phone: '+2347012223344', message: 'Thank you for the campus tour last week. It was very informative.', read: 1, createdAt: hoursAgo(80) },
        ])

        await db.meta.put({ key: 'seeded', value: new Date().toISOString() })
    })
}

export async function resetDatabase() {
    // Clear rather than db.delete(): deleting closes the connection and would
    // break any live queries still mounted.
    await db.transaction('rw', db.tables, () => Promise.all(db.tables.map((t) => t.clear())))
    seeding = null
    await seedIfEmpty()
}
