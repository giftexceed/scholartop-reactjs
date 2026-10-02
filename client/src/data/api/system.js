import { resetLocalData } from '../local/seed'
import { requireAdmin, requireUser, toPublicUser } from './_context'
import { getStudentRecord } from './students'

/** Demo-only: wipe everything in this browser and restore the sample data. */
export async function resetDemoData() {
    await requireAdmin()
    await resetLocalData()
}

/** Everything stored about the signed-in user, as a plain object. */
export async function exportMyData() {
    const user = await requireUser()
    const data = { exportedAt: new Date().toISOString(), account: toPublicUser(user) }
    if (user.studentId) {
        const record = await getStudentRecord(user.studentId)
        if (record) Object.assign(data, record)
    }
    return data
}
