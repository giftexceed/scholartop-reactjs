// The data API — the ONLY module the UI imports for reading or writing data.
//
// Every function is async and returns plain JSON-serialisable objects, so this
// folder is the single seam for moving to a real backend: re-implement these
// functions with fetch()/an SDK, keep the signatures, and the UI is unchanged.
// See README → "Moving to a real backend".
export * from './auth'
export * from './programs'
export * from './students'
export * from './courses'
export * from './grades'
export * from './attendance'
export * from './announcements'
export * from './messages'
export * from './users'
export * from './dashboard'
export * from './system'
export { DataError } from '../errors'
