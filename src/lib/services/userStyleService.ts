/**
 * User Style Service
 * Persists and retrieves user communication style and session data
 */

import {
  UserCommunicationStyle,
  UserSessionData,
  defaultCommunicationStyle,
  defaultSessionData
} from '@/types/communicationStyle'
import { analyzeMessage, updateCommunicationStyle, getTopThemes } from './styleAnalyzer'

const STYLE_STORAGE_KEY = 'embers_user_style'
const SESSION_STORAGE_KEY = 'embers_session_data'

/**
 * Save user communication style to localStorage
 */
export function saveUserStyle(style: UserCommunicationStyle): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STYLE_STORAGE_KEY, JSON.stringify(style))
  }
}

/**
 * Get user communication style from localStorage
 */
export function getUserStyle(): UserCommunicationStyle {
  if (typeof window === 'undefined') return defaultCommunicationStyle

  const stored = localStorage.getItem(STYLE_STORAGE_KEY)
  if (!stored) return defaultCommunicationStyle

  try {
    return JSON.parse(stored) as UserCommunicationStyle
  } catch {
    return defaultCommunicationStyle
  }
}

/**
 * Save session data to localStorage
 */
export function saveSessionData(data: UserSessionData): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data))
  }
}

/**
 * Get session data from localStorage
 */
export function getSessionData(): UserSessionData {
  if (typeof window === 'undefined') return defaultSessionData

  const stored = localStorage.getItem(SESSION_STORAGE_KEY)
  if (!stored) return defaultSessionData

  try {
    const data = JSON.parse(stored) as UserSessionData
    // Update returning user status
    data.isReturningUser = true
    data.totalSessions += 1
    data.lastVisit = new Date().toISOString()
    return data
  } catch {
    return defaultSessionData
  }
}

/**
 * Process a new user message and update style
 */
export function processUserMessage(message: string): UserCommunicationStyle {
  const currentStyle = getUserStyle()
  const analysis = analyzeMessage(message)
  const updatedStyle = updateCommunicationStyle(currentStyle, analysis)
  saveUserStyle(updatedStyle)
  return updatedStyle
}

/**
 * Record a completed story
 */
export function recordStory(topics: string[]): void {
  const session = getSessionData()
  session.storyCount += 1
  session.lastStoryTopics = topics.slice(0, 5) // Keep last 5 topics
  saveSessionData(session)
}

/**
 * Record a used prompt (to avoid repetition)
 */
export function recordUsedPrompt(promptQuestion: string): void {
  const session = getSessionData()
  if (!session.usedPromptQuestions.includes(promptQuestion)) {
    session.usedPromptQuestions.push(promptQuestion)
    // Keep only last 20 to avoid infinite growth
    if (session.usedPromptQuestions.length > 20) {
      session.usedPromptQuestions = session.usedPromptQuestions.slice(-20)
    }
    saveSessionData(session)
  }
}

/**
 * Check if a prompt has been used recently
 */
export function hasUsedPrompt(promptQuestion: string): boolean {
  const session = getSessionData()
  return session.usedPromptQuestions.includes(promptQuestion)
}

/**
 * Get context for API calls
 */
export function getUserContext(): {
  isReturningUser: boolean
  frequentlyMentionedPeople: string[]
  preferredTimeframes: string[]
  commonThemes: string[]
  storyCount: number
} {
  const style = getUserStyle()
  const session = getSessionData()

  return {
    isReturningUser: session.isReturningUser,
    frequentlyMentionedPeople: style.frequentlyMentionedPeople.slice(0, 5),
    preferredTimeframes: style.preferredTimeframes.slice(0, 3),
    commonThemes: getTopThemes(style.commonThemes, 3),
    storyCount: session.storyCount
  }
}

/**
 * Reset all user data (for testing)
 */
export function resetUserData(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STYLE_STORAGE_KEY)
    localStorage.removeItem(SESSION_STORAGE_KEY)
  }
}

/**
 * User style service singleton
 */
export const userStyleService = {
  // Style methods
  getStyle: getUserStyle,
  saveStyle: saveUserStyle,
  processMessage: processUserMessage,

  // Session methods
  getSession: getSessionData,
  saveSession: saveSessionData,
  recordStory,

  // Prompt methods
  recordPrompt: recordUsedPrompt,
  hasUsedPrompt,

  // Context for API
  getContext: getUserContext,

  // Reset
  reset: resetUserData
}

export default userStyleService
