/**
 * Style Analyzer Service
 * Analyzes user messages to detect communication patterns
 * Ported from iOS AIPromptService.swift style analysis methods
 */

import {
  StorytellingStyle,
  EmotionalDepth,
  DetailLevel,
  StyleAnalysisResult,
  UserCommunicationStyle,
  defaultCommunicationStyle
} from '@/types/communicationStyle'

/**
 * Emotional words for depth detection
 */
const EMOTIONAL_WORDS = {
  high: [
    'love', 'loved', 'adore', 'cherish', 'treasure',
    'heartbreak', 'devastated', 'grief', 'mourning',
    'joy', 'ecstatic', 'thrilled', 'overwhelmed',
    'afraid', 'terrified', 'anxious', 'worried',
    'proud', 'grateful', 'blessed', 'thankful',
    'angry', 'furious', 'frustrated', 'hurt',
    'miss', 'longing', 'yearn', 'ache'
  ],
  medium: [
    'happy', 'sad', 'glad', 'upset',
    'nice', 'good', 'bad', 'fine',
    'like', 'enjoy', 'appreciate', 'care'
  ]
}

/**
 * Chronological markers for storytelling style detection
 */
const CHRONOLOGICAL_MARKERS = [
  'first', 'then', 'next', 'after', 'before', 'later',
  'when i was', 'at that time', 'years ago', 'back then',
  'in 19', 'in 20', 'during the', 'eventually',
  'started', 'ended', 'began', 'finally'
]

/**
 * Associative markers
 */
const ASSOCIATIVE_MARKERS = [
  'reminds me', 'that reminds', 'speaking of', 'which reminds',
  'similar to', 'just like', 'makes me think of',
  'oh that reminds', 'you know what', 'actually'
]

/**
 * Sensory/detail markers
 */
const DETAIL_MARKERS = [
  'smell', 'scent', 'aroma', 'taste', 'flavor',
  'sound', 'hear', 'heard', 'noise', 'voice',
  'feel', 'felt', 'texture', 'touch', 'warm', 'cold',
  'see', 'saw', 'looked', 'color', 'bright', 'dark',
  'remember exactly', 'specifically', 'particular'
]

/**
 * Theme keywords for topic detection
 */
const THEME_KEYWORDS: Record<string, string[]> = {
  family: ['family', 'mother', 'father', 'mom', 'dad', 'brother', 'sister', 'grandma', 'grandpa', 'grandmother', 'grandfather', 'aunt', 'uncle', 'cousin', 'parents'],
  childhood: ['childhood', 'kid', 'child', 'young', 'grew up', 'growing up', 'school', 'elementary', 'teenager'],
  career: ['work', 'job', 'career', 'boss', 'colleague', 'office', 'company', 'profession', 'business'],
  relationships: ['friend', 'friends', 'spouse', 'husband', 'wife', 'partner', 'dating', 'marriage', 'wedding'],
  travel: ['travel', 'trip', 'vacation', 'journey', 'visited', 'moved', 'relocated'],
  traditions: ['tradition', 'holiday', 'christmas', 'thanksgiving', 'birthday', 'celebration', 'ritual', 'custom'],
  challenges: ['challenge', 'difficult', 'struggle', 'overcome', 'problem', 'crisis', 'tough', 'hard time'],
  achievements: ['proud', 'accomplish', 'achievement', 'success', 'won', 'award', 'graduated']
}

/**
 * Timeframe patterns
 */
const TIMEFRAME_PATTERNS = [
  /(?:in|during|around)\s+(?:the\s+)?(\d{4}s?)/i,
  /(?:in|during)\s+(?:my\s+)?(\w+\s+(?:years?|grade|school))/i,
  /(childhood|teenage|twenties|thirties|forties|fifties|sixties)/i,
  /(early|late|mid)\s+(nineteen|twenty)\s+(\w+)/i,
  /when\s+i\s+was\s+(\d+|young|a\s+kid|little)/i
]

/**
 * Name patterns for detecting mentioned people
 */
const NAME_PATTERNS = [
  /my\s+(mother|father|mom|dad|grandma|grandmother|grandpa|grandfather|brother|sister|aunt|uncle|cousin)\s+(\w+)?/gi,
  /(?:called|named)\s+(\w+)/gi,
  /(\w+)\s+(?:always|would|used to|taught me)/gi
]

/**
 * Analyze a single message for style patterns
 */
export function analyzeMessage(message: string): StyleAnalysisResult {
  const lowerMessage = message.toLowerCase()
  const words = message.split(/\s+/)
  const wordCount = words.length

  // Detect storytelling style
  let detectedStyle: StorytellingStyle = 'unknown'
  let styleConfidence = 0

  const chronoCount = CHRONOLOGICAL_MARKERS.filter(m => lowerMessage.includes(m)).length
  const assocCount = ASSOCIATIVE_MARKERS.filter(m => lowerMessage.includes(m)).length
  const detailCount = DETAIL_MARKERS.filter(m => lowerMessage.includes(m)).length

  if (chronoCount > assocCount && chronoCount > detailCount) {
    detectedStyle = 'chronological'
    styleConfidence = Math.min(chronoCount / 3, 1)
  } else if (assocCount > chronoCount) {
    detectedStyle = 'associative'
    styleConfidence = Math.min(assocCount / 2, 1)
  } else if (detailCount > 2) {
    detectedStyle = 'detail-focused'
    styleConfidence = Math.min(detailCount / 4, 1)
  }

  // Detect emotional depth
  let detectedDepth: EmotionalDepth = 'unknown'
  let depthConfidence = 0

  const highEmotionCount = EMOTIONAL_WORDS.high.filter(w => lowerMessage.includes(w)).length
  const medEmotionCount = EMOTIONAL_WORDS.medium.filter(w => lowerMessage.includes(w)).length

  if (highEmotionCount >= 2) {
    detectedDepth = 'expressive'
    depthConfidence = Math.min(highEmotionCount / 3, 1)
  } else if (highEmotionCount >= 1 || medEmotionCount >= 2) {
    detectedDepth = 'balanced'
    depthConfidence = 0.6
  } else if (wordCount > 20 && highEmotionCount === 0 && medEmotionCount <= 1) {
    detectedDepth = 'reserved'
    depthConfidence = 0.5
  }

  // Detect detail level based on word count and specificity
  let detectedDetail: DetailLevel = 'unknown'
  let detailConfidence = 0

  if (wordCount > 100) {
    detectedDetail = 'detailed'
    detailConfidence = Math.min(wordCount / 150, 1)
  } else if (wordCount > 40) {
    detectedDetail = 'balanced'
    detailConfidence = 0.6
  } else if (wordCount < 20) {
    detectedDetail = 'sparse'
    detailConfidence = 0.7
  }

  // Extract mentioned people
  const mentionedPeople: string[] = []
  for (const pattern of NAME_PATTERNS) {
    const matches = message.matchAll(pattern)
    for (const match of matches) {
      if (match[1] && match[1].length > 2) {
        mentionedPeople.push(match[1])
      }
      if (match[2] && match[2].length > 2) {
        mentionedPeople.push(match[2])
      }
    }
  }

  // Extract timeframes
  const mentionedTimeframes: string[] = []
  for (const pattern of TIMEFRAME_PATTERNS) {
    const match = message.match(pattern)
    if (match && match[1]) {
      mentionedTimeframes.push(match[1])
    }
  }

  // Detect themes
  const detectedThemes: string[] = []
  for (const [theme, keywords] of Object.entries(THEME_KEYWORDS)) {
    if (keywords.some(kw => lowerMessage.includes(kw))) {
      detectedThemes.push(theme)
    }
  }

  return {
    detectedStyle: styleConfidence > 0.3 ? detectedStyle : undefined,
    detectedDepth: depthConfidence > 0.3 ? detectedDepth : undefined,
    detectedDetail: detailConfidence > 0.3 ? detectedDetail : undefined,
    mentionedPeople: [...new Set(mentionedPeople)],
    mentionedTimeframes: [...new Set(mentionedTimeframes)],
    detectedThemes,
    confidence: {
      style: styleConfidence,
      depth: depthConfidence,
      detail: detailConfidence
    }
  }
}

/**
 * Update user communication style based on new message analysis
 */
export function updateCommunicationStyle(
  currentStyle: UserCommunicationStyle,
  analysis: StyleAnalysisResult
): UserCommunicationStyle {
  const updated = { ...currentStyle }

  // Update storytelling style (weighted average toward new detection)
  if (analysis.detectedStyle && analysis.confidence.style > 0.4) {
    if (updated.storytellingStyle === 'unknown') {
      updated.storytellingStyle = analysis.detectedStyle
    }
    // Could implement more sophisticated averaging here
  }

  // Update emotional depth
  if (analysis.detectedDepth && analysis.confidence.depth > 0.4) {
    if (updated.emotionalDepth === 'unknown') {
      updated.emotionalDepth = analysis.detectedDepth
    }
  }

  // Update detail level
  if (analysis.detectedDetail && analysis.confidence.detail > 0.4) {
    if (updated.detailLevel === 'unknown') {
      updated.detailLevel = analysis.detectedDetail
    }
  }

  // Update common themes
  for (const theme of analysis.detectedThemes) {
    updated.commonThemes[theme] = (updated.commonThemes[theme] || 0) + 1
  }

  // Update mentioned people
  for (const person of analysis.mentionedPeople) {
    if (!updated.frequentlyMentionedPeople.includes(person)) {
      updated.frequentlyMentionedPeople.push(person)
    }
  }

  // Update timeframes
  for (const timeframe of analysis.mentionedTimeframes) {
    if (!updated.preferredTimeframes.includes(timeframe)) {
      updated.preferredTimeframes.push(timeframe)
    }
  }

  updated.messageCount += 1
  updated.lastUpdated = new Date().toISOString()

  return updated
}

/**
 * Get top themes from common themes map
 */
export function getTopThemes(themes: Record<string, number>, limit = 3): string[] {
  return Object.entries(themes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([theme]) => theme)
}

/**
 * Generate adaptive rules based on user style (like iOS activeRules)
 */
export function getAdaptiveRules(style: UserCommunicationStyle): string[] {
  const rules: string[] = []

  // Emotional depth rules
  switch (style.emotionalDepth) {
    case 'reserved':
      rules.push('Maintain professional, fact-focused interaction')
      rules.push('Ask about events and actions rather than feelings initially')
      break
    case 'expressive':
      rules.push('Engage with emotional depth and reflection')
      rules.push('Acknowledge feelings before asking follow-up questions')
      break
    case 'balanced':
      rules.push('Balance fact and emotion in responses')
      break
  }

  // Detail level rules
  switch (style.detailLevel) {
    case 'detailed':
      rules.push('Encourage specific, detailed descriptions')
      rules.push('Ask about sensory details - what they saw, heard, felt')
      break
    case 'sparse':
      rules.push('Start with broader questions, then narrow focus')
      rules.push('Gently encourage elaboration: "Tell me more about that..."')
      break
    case 'balanced':
      rules.push("Follow user's natural level of detail")
      break
  }

  // Storytelling style rules
  switch (style.storytellingStyle) {
    case 'chronological':
      rules.push('Support their timeline-based storytelling')
      rules.push('Ask "What happened next?" or "Then what?"')
      break
    case 'associative':
      rules.push('Welcome tangents and connections they make')
      rules.push('Build on their associations')
      break
    case 'detail-focused':
      rules.push('Appreciate and encourage their rich details')
      rules.push('Ask about specific sensory memories')
      break
    case 'emotion-focused':
      rules.push('Honor their emotional sharing')
      rules.push('Create space for feelings before facts')
      break
  }

  return rules
}
