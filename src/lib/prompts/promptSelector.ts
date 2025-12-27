/**
 * Prompt Selector Service
 * Intelligently selects prompts based on user context
 */

import {
  PromptWithFollowUp,
  allWarmPrompts,
  getPromptsForInterests,
  connectionPrompts,
  emotionalConnectionPrompts,
  familyMemberPrompts,
  timeframePrompts,
  themePrompts
} from './warmEngagementPrompts'

interface UserContext {
  isNewUser: boolean
  userName?: string
  selectedInterests?: string[]
  previouslyUsedPrompts?: string[]
  frequentlyMentionedPeople?: string[]
  preferredTimeframes?: string[]
  commonThemes?: string[]
  storyCount?: number
}

interface SelectedPrompt {
  greeting: string
  prompt: PromptWithFollowUp
}

/**
 * New user greetings - warm and welcoming
 */
const newUserGreetings = [
  "Hi there! I'm Ember, here to help preserve your family stories.",
  "Hello! I'm Ember, and I'm so glad you're here to share your stories.",
  "Welcome! I'm Ember, ready to listen whenever you are.",
  "Hi! I'm Ember. Think of me as a friend who's genuinely curious about your life."
]

/**
 * Returning user greetings - personalized
 */
function getReturningUserGreeting(context: UserContext): string {
  const name = context.userName || 'friend'

  // If we know people they've mentioned
  if (context.frequentlyMentionedPeople && context.frequentlyMentionedPeople.length > 0) {
    const person = context.frequentlyMentionedPeople[Math.floor(Math.random() * context.frequentlyMentionedPeople.length)]
    const greetings = [
      `Welcome back, ${name}! You mentioned ${person} before - would you like to share another story about them?`,
      `Hi ${name}! I remember you talking about ${person}. That reminds me - what was it like growing up with them?`,
      `Great to see you, ${name}! I'd love to hear more about ${person}, or we could explore a different memory.`
    ]
    return greetings[Math.floor(Math.random() * greetings.length)]
  }

  // If we know their preferred timeframes
  if (context.preferredTimeframes && context.preferredTimeframes.length > 0) {
    const timeframe = context.preferredTimeframes[Math.floor(Math.random() * context.preferredTimeframes.length)]
    const greetings = [
      `Welcome back, ${name}! Last time you shared some wonderful memories about ${timeframe}. What other stories from that time would you like to explore?`,
      `Hello again, ${name}! Your stories about ${timeframe} were fascinating. Shall we uncover more memories from then?`,
      `${name}, I enjoyed hearing about ${timeframe}. Would you like to share more stories from that period?`
    ]
    return greetings[Math.floor(Math.random() * greetings.length)]
  }

  // If we know their common themes
  if (context.commonThemes && context.commonThemes.length > 0) {
    const theme = context.commonThemes[Math.floor(Math.random() * context.commonThemes.length)]
    const greetings = [
      `Welcome back, ${name}! You've shared wonderful stories about ${theme}. Would you like to explore more memories along those lines?`,
      `Great to see you, ${name}! I remember your interesting perspectives on ${theme}. What other stories come to mind?`,
      `Hello ${name}! Your stories about ${theme} were fascinating. Shall we uncover more memories like those?`
    ]
    return greetings[Math.floor(Math.random() * greetings.length)]
  }

  // Default returning user greetings
  const defaultGreetings = [
    `Welcome back, ${name}! I've been thinking about your stories. What memory would you like to explore today?`,
    `Good to see you again, ${name}! Which memory shall we uncover next?`,
    `${name}, it's wonderful to have you back. Tell me, what story are we diving into today?`,
    `Hello again, ${name}! Ready to share another memory?`
  ]

  return defaultGreetings[Math.floor(Math.random() * defaultGreetings.length)]
}

/**
 * Select prompt avoiding previously used ones
 */
function selectUnusedPrompt(prompts: PromptWithFollowUp[], previouslyUsed: string[] = []): PromptWithFollowUp {
  // Filter out previously used prompts
  const unused = prompts.filter(p => !previouslyUsed.includes(p.question))

  // If all have been used, reset and use any
  if (unused.length === 0) {
    return prompts[Math.floor(Math.random() * prompts.length)]
  }

  return unused[Math.floor(Math.random() * unused.length)]
}

/**
 * Main function: Select personalized prompt based on user context
 */
export function selectPromptForUser(context: UserContext): SelectedPrompt {
  let greeting: string
  let prompt: PromptWithFollowUp

  // Determine greeting based on new vs returning user
  if (context.isNewUser) {
    greeting = newUserGreetings[Math.floor(Math.random() * newUserGreetings.length)]
    if (context.userName) {
      greeting = greeting.replace("Hi there!", `Hi ${context.userName}!`)
      greeting = greeting.replace("Hello!", `Hello ${context.userName}!`)
      greeting = greeting.replace("Welcome!", `Welcome ${context.userName}!`)
      greeting = greeting.replace("Hi!", `Hi ${context.userName}!`)
    }
  } else {
    greeting = getReturningUserGreeting(context)
  }

  // Select prompt based on interests
  if (context.selectedInterests && context.selectedInterests.length > 0) {
    const matchingPrompts = getPromptsForInterests(context.selectedInterests)
    prompt = selectUnusedPrompt(matchingPrompts, context.previouslyUsedPrompts)
  } else {
    // Default to connection prompts for new users, varied for returning
    if (context.isNewUser) {
      prompt = selectUnusedPrompt(connectionPrompts, context.previouslyUsedPrompts)
    } else {
      prompt = selectUnusedPrompt(allWarmPrompts, context.previouslyUsedPrompts)
    }
  }

  return { greeting, prompt }
}

/**
 * Generate a complete opening message combining greeting and prompt
 */
export function generateOpeningMessage(context: UserContext): string {
  const { greeting, prompt } = selectPromptForUser(context)
  return `${greeting} ${prompt.question}`
}

/**
 * Get follow-up prompt after user responds
 */
export function getFollowUpForPrompt(originalQuestion: string): string | null {
  const matchingPrompt = allWarmPrompts.find(p => p.question === originalQuestion)
  return matchingPrompt?.followUp || null
}

/**
 * Get gentle encouragement prompts for when user is hesitant
 */
export const gentleEncouragements = [
  "Take your time - there's no rush. I'm here whenever you're ready.",
  "Even the smallest memory can be meaningful. What comes to mind?",
  "Would it help if I asked a different question?",
  "Sometimes memories need a moment to surface. I'm here.",
  "There's no wrong answer - every story matters."
]

export function getGentleEncouragement(): string {
  return gentleEncouragements[Math.floor(Math.random() * gentleEncouragements.length)]
}

/**
 * Inactivity prompts (from iOS)
 */
export const inactivityPrompts = [
  "I notice we've had a little pause. Would you like to continue sharing, or shall we save your story for now?",
  "We can take a break if you'd like. Would you prefer to save your story or continue sharing?",
  "No pressure - we can either save your story for now or continue whenever you're ready.",
  "Would you like to save what we've discussed, or would you prefer to share more?"
]

export function getInactivityPrompt(): string {
  return inactivityPrompts[Math.floor(Math.random() * inactivityPrompts.length)]
}

/**
 * End session prompts
 */
export const endSessionPrompts = [
  "Would you like me to save this story for you? I can help you preserve these memories.",
  "Shall we save these precious memories? I can help you store this conversation.",
  "This has been a wonderful conversation. Would you like me to save it for you?",
  "Thank you for sharing your story. Would you like me to save it in your collection?"
]

export function getEndSessionPrompt(): string {
  return endSessionPrompts[Math.floor(Math.random() * endSessionPrompts.length)]
}
