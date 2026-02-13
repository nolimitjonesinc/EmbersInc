/**
 * Dual storage: localStorage (instant) + Supabase (synced).
 *
 * Saves to localStorage immediately for zero-latency UX,
 * then syncs to Supabase in the background. Handles offline
 * gracefully — queues sync attempts and retries when back online.
 *
 * Inspired by Loomiverse PsychologyStorage + cloudStorage patterns.
 */

export type SyncStatus = 'synced' | 'pending' | 'offline' | 'error'

export interface DualStorageCallbacks {
  onSyncStatusChange?: (status: SyncStatus) => void
  onSyncError?: (error: string) => void
}

interface StorageEntry<T> {
  data: T
  updatedAt: string
  syncedAt?: string
}

const SYNC_QUEUE_KEY = 'embers_sync_queue'
const MAX_QUEUE_SIZE = 10

/**
 * Save data to localStorage immediately, queue Supabase sync.
 */
export function saveWithSync<T>(
  key: string,
  data: T,
  callbacks?: DualStorageCallbacks
): void {
  const entry: StorageEntry<T> = {
    data,
    updatedAt: new Date().toISOString(),
  }

  // 1. Save to localStorage immediately
  try {
    localStorage.setItem(key, JSON.stringify(entry))
  } catch (err) {
    callbacks?.onSyncError?.('Could not save locally. Storage may be full.')
    console.error('[DualStorage] localStorage save failed:', err)
    return
  }

  // 2. Queue for Supabase sync
  queueSync(key)
  callbacks?.onSyncStatusChange?.('pending')
}

/**
 * Load data, preferring localStorage (instant) with Supabase fallback.
 * If both exist, most recent timestamp wins.
 */
export function loadLocal<T>(key: string): { data: T; updatedAt: Date } | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null

    const entry: StorageEntry<T> = JSON.parse(raw)
    return {
      data: entry.data,
      updatedAt: new Date(entry.updatedAt),
    }
  } catch (err) {
    console.warn(`[DualStorage] Failed to parse localStorage key "${key}":`, err)
    return null
  }
}

/**
 * Load from Supabase and resolve conflicts with local data.
 * Returns the most recent version. Updates localStorage if cloud is newer.
 */
export async function loadWithSync<T>(
  key: string,
  fetchFromCloud: () => Promise<{ data: T; updatedAt: Date } | null>
): Promise<{ data: T; updatedAt: Date; source: 'local' | 'cloud' } | null> {
  const local = loadLocal<T>(key)

  try {
    const cloud = await fetchFromCloud()

    if (!local && !cloud) return null
    if (!cloud) return local ? { ...local, source: 'local' } : null
    if (!local) return { ...cloud, source: 'cloud' }

    // Conflict resolution: most recent timestamp wins
    if (cloud.updatedAt > local.updatedAt) {
      // Cloud is newer — update localStorage
      const entry: StorageEntry<T> = {
        data: cloud.data,
        updatedAt: cloud.updatedAt.toISOString(),
        syncedAt: new Date().toISOString(),
      }
      localStorage.setItem(key, JSON.stringify(entry))
      return { ...cloud, source: 'cloud' }
    }

    return { ...local, source: 'local' }
  } catch (err) {
    console.warn('[DualStorage] Cloud fetch failed, falling back to local:', err)
    return local ? { ...local, source: 'local' } : null
  }
}

/**
 * Remove data from both localStorage and Supabase.
 */
export function clearWithSync(
  key: string,
  clearFromCloud?: () => Promise<void>
): void {
  localStorage.removeItem(key)
  removeSyncQueueEntry(key)

  if (clearFromCloud) {
    clearFromCloud().catch((err) => {
      console.error('[DualStorage] Cloud clear failed:', err)
    })
  }
}

// --- Sync queue management ---

function queueSync(key: string): void {
  try {
    const queue: string[] = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]')

    // Dedup
    if (!queue.includes(key)) {
      queue.push(key)
    }

    // Cap queue size to prevent infinite growth
    while (queue.length > MAX_QUEUE_SIZE) {
      queue.shift()
    }

    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue))
  } catch (err) {
    console.warn('[DualStorage] Sync queue update failed:', err)
  }
}

function removeSyncQueueEntry(key: string): void {
  try {
    const queue: string[] = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]')
    const filtered = queue.filter((k) => k !== key)
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(filtered))
  } catch (err) {
    console.warn('[DualStorage] Sync queue entry removal failed:', err)
  }
}

/**
 * Process the sync queue — call this periodically or on online event.
 * Provide a syncFn that takes a key and syncs that item to Supabase.
 */
export async function processSyncQueue(
  syncFn: (key: string) => Promise<boolean>,
  callbacks?: DualStorageCallbacks
): Promise<void> {
  try {
    const queue: string[] = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]')
    if (queue.length === 0) return

    const remaining: string[] = []

    for (const key of queue) {
      try {
        const success = await syncFn(key)
        if (!success) remaining.push(key)
      } catch (err) {
        console.warn(`[DualStorage] Sync failed for key "${key}":`, err)
        remaining.push(key)
      }
    }

    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(remaining))

    if (remaining.length === 0) {
      callbacks?.onSyncStatusChange?.('synced')
    } else {
      callbacks?.onSyncStatusChange?.('error')
    }
  } catch (err) {
    console.warn('[DualStorage] Sync queue processing failed:', err)
    callbacks?.onSyncStatusChange?.('error')
  }
}

/**
 * Set up online/offline listeners for automatic sync retry.
 * Returns a cleanup function.
 */
export function setupOnlineSync(
  syncFn: (key: string) => Promise<boolean>,
  callbacks?: DualStorageCallbacks
): () => void {
  const handleOnline = () => {
    callbacks?.onSyncStatusChange?.('pending')
    processSyncQueue(syncFn, callbacks)
  }

  const handleOffline = () => {
    callbacks?.onSyncStatusChange?.('offline')
  }

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  // Check current state
  if (!navigator.onLine) {
    callbacks?.onSyncStatusChange?.('offline')
  }

  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}
