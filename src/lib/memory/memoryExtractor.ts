/**
 * Extract memories from conversation messages.
 *
 * Scans user messages for names, emotions, sacred moments (death, birth, etc.),
 * and tracks AI questions to prevent repetition.
 *
 * Called after each message exchange on the client side.
 */

import { ConversationMemory } from './ConversationMemory'

// Sacred life events — always stored at highest salience
const SACRED_PATTERNS = [
  /\b(?:passed away|passed on|died|death of|lost (?:my|him|her)|funeral|buried|in heaven|gone now)\b/i,
  /\b(?:born|birth of|gave birth|newborn|baby (?:boy|girl)|pregnant)\b/i,
  /\b(?:married|wedding|proposal|engaged|engagement|anniversary)\b/i,
  /\b(?:war|served|military|deployed|combat|veteran|navy|army|marines|air force)\b/i,
  /\b(?:diagnosis|diagnosed|cancer|stroke|heart attack|hospital|surgery|alzheimer)\b/i,
  /\b(?:immigrat|refugee|escaped|fled|came to (?:america|this country))\b/i,
]

// Emotion indicators
const EMOTION_KEYWORDS: Record<string, string> = {
  // Positive
  happy: 'joy',
  joy: 'joy',
  wonderful: 'joy',
  beautiful: 'joy',
  blessed: 'gratitude',
  grateful: 'gratitude',
  thankful: 'gratitude',
  proud: 'pride',
  accomplished: 'pride',
  love: 'love',
  loved: 'love',
  cherish: 'love',
  treasure: 'love',
  // Difficult
  sad: 'sadness',
  miss: 'longing',
  grief: 'grief',
  heartbreak: 'grief',
  tears: 'sadness',
  scared: 'fear',
  afraid: 'fear',
  worried: 'worry',
  angry: 'anger',
  frustrated: 'frustration',
  lonely: 'loneliness',
  alone: 'loneliness',
  regret: 'regret',
}

// Relationship + name patterns: "my mother Margaret", "called him Bobby"
const NAME_PATTERNS = [
  /\bmy (?:mother|father|mom|dad|mama|papa|wife|husband|spouse|partner|sister|brother|son|daughter|grandmother|grandfather|grandma|grandpa|nana|papa|aunt|uncle|cousin|friend|neighbor|boss|teacher|mentor|coach),?\s+([A-Z][a-z]{1,20})\b/g,
  /\b(?:called|named|name was|name is|known as|goes by)\s+([A-Z][a-z]{1,20})\b/g,
  /\b([A-Z][a-z]{1,20})\s+(?:was my|is my)\s+(?:mother|father|wife|husband|friend|sister|brother)\b/g,
]

/**
 * Extract and store memories from a user message + AI response pair.
 * Call this after each successful message exchange.
 */
export function extractMemories(
  userMessage: string,
  assistantResponse: string,
  memory: ConversationMemory
): void {
  if (!userMessage) return

  // 1. Extract people mentioned (from user message only)
  for (const pattern of NAME_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags)
    let match: RegExpExecArray | null
    while ((match = regex.exec(userMessage)) !== null) {
      const name = match[1]
      if (!name || name.length < 2) continue

      // Check if mentioned near a sacred event
      const contextStart = Math.max(0, match.index - 60)
      const contextEnd = Math.min(userMessage.length, match.index + match[0].length + 60)
      const nearbyText = userMessage.substring(contextStart, contextEnd)
      const isSacred = SACRED_PATTERNS.some((p) => p.test(nearbyText))

      memory.storeMemory('PERSON_MENTIONED', name, isSacred ? 4 : 3)
    }
  }

  // 2. Detect sacred life moments (capture ALL matches, not just first)
  for (const pattern of SACRED_PATTERNS) {
    const globalPattern = new RegExp(pattern.source, 'gi')
    let sacredMatch: RegExpExecArray | null
    while ((sacredMatch = globalPattern.exec(userMessage)) !== null) {
      const start = Math.max(0, sacredMatch.index - 40)
      const end = Math.min(userMessage.length, sacredMatch.index + sacredMatch[0].length + 60)
      const context = userMessage.substring(start, end).trim()
      memory.storeMemory('STORY_TOPIC', context, 4)
    }
  }

  // 3. Detect emotions in user message
  const words = userMessage.toLowerCase().split(/\W+/)
  const detectedEmotions = new Set<string>()
  for (const word of words) {
    const emotion = EMOTION_KEYWORDS[word]
    if (emotion && !detectedEmotions.has(emotion)) {
      detectedEmotions.add(emotion)
      const isSacred = SACRED_PATTERNS.some((p) => p.test(userMessage))
      memory.storeMemory('EMOTION_EXPRESSED', emotion, isSacred ? 4 : 2)
    }
  }

  // 4. Track general topic from user message (first meaningful sentence)
  if (userMessage.length > 30) {
    const firstSentence = userMessage.split(/[.!?]/)[0]?.trim()
    if (firstSentence && firstSentence.length > 15) {
      memory.storeMemory('STORY_TOPIC', firstSentence.slice(0, 120), 2)
    }
  }

  // 5. Track AI questions (so we don't repeat them)
  if (assistantResponse) {
    const questions = assistantResponse.match(/[^.!]*\?/g)
    if (questions) {
      for (const q of questions.slice(0, 3)) {
        const cleaned = q.trim()
        if (cleaned.length > 10) {
          memory.storeMemory('QUESTION_ASKED', cleaned, 1)
        }
      }
    }
  }
}
