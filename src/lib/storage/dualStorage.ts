/**
 * Dual storage: localStorage (instant) + Supabase (synced).
 *
 * Saves to localStorage immediately for zero-latency UX,
 * then syncs to Supabase in the background.
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

/**
 * Save data to localStorage immediately.
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

  // Save to localStorage immediately
  try {
    localStorage.setItem(key, JSON.stringify(entry))
  } catch (err) {
    callbacks?.onSyncError?.('Could not save locally. Storage may be full.')
    console.error('[DualStorage] localStorage save failed:', err)
    return
  }

  callbacks?.onSyncStatusChange?.('pending')
}

/**
 * Load data from localStorage.
 * Returns null if no data exists or if stored data is corrupted.
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
    console.error(`[DualStorage] Failed to parse localStorage key "${key}" — data may be corrupted:`, err)
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

  if (clearFromCloud) {
    clearFromCloud().catch((err) => {
      console.error('[DualStorage] Cloud clear failed:', err)
    })
  }
}
