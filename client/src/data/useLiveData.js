import { useLiveQuery } from 'dexie-react-hooks'

/**
 * Run a data-API read and re-render whenever the underlying data changes.
 * Returns `initial` (default undefined) while loading.
 *
 * This is the only React hook coupled to the local store. When moving to a
 * backend, re-implement it with TanStack Query's useQuery (invalidating after
 * mutations) or the backend's realtime subscriptions — call sites stay the same.
 */
export function useLiveData(query, deps = [], initial) {
    return useLiveQuery(query, deps, initial)
}
