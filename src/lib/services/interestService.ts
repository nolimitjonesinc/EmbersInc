/**
 * Interest Service
 * Manages user interest selection storage and retrieval
 */

const STORAGE_KEY = 'embers_selected_interests'

export interface InterestServiceData {
  selectedInterests: string[]
  selectedAt: string
}

/**
 * Save selected interests to localStorage
 */
export function saveInterests(interests: string[]): void {
  const data: InterestServiceData = {
    selectedInterests: interests,
    selectedAt: new Date().toISOString()
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }
}

/**
 * Get selected interests from localStorage
 */
export function getInterests(): string[] {
  if (typeof window === 'undefined') return []

  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return []

  try {
    const data: InterestServiceData = JSON.parse(stored)
    return data.selectedInterests || []
  } catch {
    return []
  }
}

/**
 * Check if user has completed interest selection
 */
export function hasSelectedInterests(): boolean {
  return getInterests().length > 0
}

/**
 * Add a single interest
 */
export function addInterest(interestId: string): void {
  const current = getInterests()
  if (!current.includes(interestId)) {
    saveInterests([...current, interestId])
  }
}

/**
 * Remove a single interest
 */
export function removeInterest(interestId: string): void {
  const current = getInterests()
  saveInterests(current.filter(id => id !== interestId))
}

/**
 * Toggle an interest
 */
export function toggleInterest(interestId: string): boolean {
  const current = getInterests()
  if (current.includes(interestId)) {
    removeInterest(interestId)
    return false
  } else {
    addInterest(interestId)
    return true
  }
}

/**
 * Clear all interests (for testing or reset)
 */
export function clearInterests(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY)
  }
}

/**
 * Interest service singleton (for React components)
 */
export const interestService = {
  save: saveInterests,
  get: getInterests,
  hasSelected: hasSelectedInterests,
  add: addInterest,
  remove: removeInterest,
  toggle: toggleInterest,
  clear: clearInterests
}

export default interestService
