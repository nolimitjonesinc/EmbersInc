/**
 * User Communication Style Types
 * Ported from iOS AIPromptService.swift UserCommunicationStyle
 *
 * Tracks how users naturally tell their stories so the AI can adapt
 */

export type StorytellingStyle =
  | 'chronological'    // "First this happened, then that..."
  | 'associative'      // "That reminds me of..."
  | 'detail-focused'   // Rich sensory and specific details
  | 'emotion-focused'  // Centered on feelings and relationships
  | 'unknown'

export type EmotionalDepth =
  | 'reserved'    // Factual, less emotional sharing
  | 'balanced'    // Mix of facts and feelings
  | 'expressive'  // Rich emotional content
  | 'unknown'

export type DetailLevel =
  | 'sparse'    // Brief answers, few details
  | 'balanced'  // Moderate detail
  | 'detailed'  // Rich, elaborate descriptions
  | 'unknown'

export type InterestArea =
  | 'family'
  | 'career'
  | 'childhood'
  | 'travel'
  | 'hobbies'
  | 'achievements'
  | 'relationships'
  | 'challenges'
  | 'wisdom'
  | 'traditions'

export interface UserCommunicationStyle {
  // How they naturally structure stories
  storytellingStyle: StorytellingStyle

  // How emotionally they share
  emotionalDepth: EmotionalDepth

  // How much detail they provide
  detailLevel: DetailLevel

  // Topics they return to often (topic -> count)
  commonThemes: Record<string, number>

  // People they mention frequently
  frequentlyMentionedPeople: string[]

  // Time periods they prefer discussing
  preferredTimeframes: string[]

  // Interest areas they've selected or gravitate toward
  interestAreas: InterestArea[]

  // Analysis metadata
  messageCount: number
  lastUpdated: string
}

/**
 * Default/initial communication style
 */
export const defaultCommunicationStyle: UserCommunicationStyle = {
  storytellingStyle: 'unknown',
  emotionalDepth: 'unknown',
  detailLevel: 'unknown',
  commonThemes: {},
  frequentlyMentionedPeople: [],
  preferredTimeframes: [],
  interestAreas: [],
  messageCount: 0,
  lastUpdated: new Date().toISOString()
}

/**
 * Style analysis result from analyzing a single message
 */
export interface StyleAnalysisResult {
  // Detected patterns in this message
  detectedStyle?: StorytellingStyle
  detectedDepth?: EmotionalDepth
  detectedDetail?: DetailLevel

  // Extracted entities
  mentionedPeople: string[]
  mentionedTimeframes: string[]
  detectedThemes: string[]

  // Confidence scores (0-1)
  confidence: {
    style: number
    depth: number
    detail: number
  }
}

/**
 * Session data for tracking user across conversations
 */
export interface UserSessionData {
  // Session tracking
  isReturningUser: boolean
  firstVisit: string
  lastVisit: string
  totalSessions: number

  // Story tracking
  storyCount: number
  lastStoryTopics: string[]

  // Communication style (persisted)
  communicationStyle: UserCommunicationStyle

  // Prompt tracking (to avoid repetition)
  usedPromptQuestions: string[]
}

/**
 * Default session data
 */
export const defaultSessionData: UserSessionData = {
  isReturningUser: false,
  firstVisit: new Date().toISOString(),
  lastVisit: new Date().toISOString(),
  totalSessions: 1,
  storyCount: 0,
  lastStoryTopics: [],
  communicationStyle: defaultCommunicationStyle,
  usedPromptQuestions: []
}
