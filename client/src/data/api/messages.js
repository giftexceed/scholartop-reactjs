import { DataError } from '../errors'
import { db, row } from '../local/db'
import { requireAdmin } from './_context'

/** Public: called by the website contact form. No sign-in required. */
export async function sendContactMessage({ name, phone, message }) {
    if (!name?.trim() || !message?.trim()) throw new DataError('invalid', 'Please fill in your name and message.')
    await db.messages.add(row({ name: name.trim(), phone: phone?.trim() ?? '', message: message.trim(), read: false }))
}

export const listMessages = () => db.messages.orderBy('createdAt').reverse().toArray()

export const countUnreadMessages = () => db.messages.filter((m) => !m.read).count()

export async function markMessageRead(id) {
    await requireAdmin()
    await db.messages.update(id, { read: true })
}

export async function markAllMessagesRead() {
    await requireAdmin()
    await db.messages.filter((m) => !m.read).modify({ read: true })
}

export async function deleteMessage(id) {
    await requireAdmin()
    await db.messages.delete(id)
}
