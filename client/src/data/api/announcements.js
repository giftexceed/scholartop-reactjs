import { db, row } from '../local/db'
import { currentUser, requireAdmin } from './_context'

/** Announcements visible to the signed-in user, newest first. */
export async function listAnnouncements({ limit } = {}) {
    const user = await currentUser()
    let items = await db.announcements.orderBy('createdAt').reverse().toArray()
    if (user?.role !== 'admin') {
        const student = user?.studentId ? await db.students.get(user.studentId) : null
        const program = student ? await db.programs.get(student.programId) : null
        items = items.filter((a) => a.audience === 'All' || a.audience === program?.name)
    }
    return limit ? items.slice(0, limit) : items
}

export async function createAnnouncement({ title, body, audience }) {
    const author = await requireAdmin()
    const item = row({ title: title.trim(), body: body.trim(), audience, authorId: author.id })
    await db.announcements.add(item)
    return item
}

export async function deleteAnnouncement(id) {
    await requireAdmin()
    await db.announcements.delete(id)
}
