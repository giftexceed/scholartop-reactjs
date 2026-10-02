import { db } from '../local/db'

export const listPrograms = () => db.programs.orderBy('code').toArray()
