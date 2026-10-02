// Errors thrown by the data layer. UI code shows `message` and may branch on `code`,
// so a real backend adapter should map its HTTP/DB errors onto the same codes.
export class DataError extends Error {
    constructor(code, message) {
        super(message)
        this.name = 'DataError'
        this.code = code // 'invalid' | 'conflict' | 'not_found' | 'unauthorized' | 'forbidden'
    }
}

// Translate IndexedDB unique-index violations into a friendly conflict error.
export async function mapConflict(promise, message) {
    try {
        return await promise
    } catch (err) {
        if (err?.name === 'ConstraintError' || err?.inner?.name === 'ConstraintError') {
            throw new DataError('conflict', message)
        }
        throw err
    }
}
