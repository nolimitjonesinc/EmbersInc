import { ChapterType } from '@/types'

// Keywords and phrases associated with each life book chapter
// Maps to ChapterType: 'who-i-am' | 'where-i-come-from' | 'what-ive-loved' | 'whats-been-hard' | 'what-ive-learned' | 'what-im-still-figuring-out' | 'what-i-want-you-to-know'
const CHAPTER_KEYWORDS: Record<ChapterType, string[]> = {
  'who-i-am': [
    'become', 'identity', 'who i am', 'character', 'personality', 'values',
    'beliefs', 'faith', 'religion', 'spiritual', 'philosophy', 'principles',
    'morals', 'ethics', 'goals', 'dreams', 'aspirations', 'achievements',
    'accomplishments', 'proud', 'journey', 'path', 'career', 'profession'
  ],
  'where-i-come-from': [
    'childhood', 'grew up', 'parents', 'mother', 'father', 'mom', 'dad',
    'siblings', 'brother', 'sister', 'family', 'hometown', 'born', 'raised',
    'heritage', 'ancestors', 'grandparents', 'neighborhood', 'school',
    'elementary', 'roots', 'origin', 'where i grew', 'early years',
    'first home', 'old house', 'my town', 'village', 'country'
  ],
  'what-ive-loved': [
    'love', 'loved', 'passion', 'joy', 'happy', 'happiness', 'wonderful',
    'beautiful', 'amazing', 'favorite', 'hobby', 'enjoy', 'pleasure',
    'delight', 'cherish', 'treasure', 'meaningful', 'special', 'precious',
    'blessed', 'grateful', 'thankful', 'appreciate', 'romance', 'wedding',
    'marriage', 'spouse', 'partner', 'children', 'grandchildren'
  ],
  'whats-been-hard': [
    'hard', 'difficult', 'challenge', 'struggle', 'tough', 'overcome',
    'adversity', 'loss', 'grief', 'painful', 'hurt', 'suffering', 'trial',
    'obstacle', 'setback', 'failure', 'mistake', 'regret', 'hardship',
    'crisis', 'trouble', 'problem', 'illness', 'death', 'divorce',
    'depression', 'anxiety', 'fear', 'worry'
  ],
  'what-ive-learned': [
    'learn', 'learned', 'lesson', 'wisdom', 'advice', 'taught', 'realize',
    'understand', 'insight', 'growth', 'mature', 'discover', 'knowledge',
    'experience', 'perspective', 'change', 'transform', 'evolve',
    'important', 'value', 'believe', 'truth', 'meaning', 'purpose'
  ],
  'what-im-still-figuring-out': [
    'uncertain', 'wondering', 'figuring out', 'still learning', 'not sure',
    'questioning', 'seeking', 'exploring', 'confused', 'doubt', 'uncertain',
    'work in progress', 'growing', 'changing', 'evolving', 'struggle with'
  ],
  'what-i-want-you-to-know': [
    'legacy', 'remember', 'remembered', 'future', 'generations', 'pass on',
    'teach', 'hope', 'wish', 'want to leave', 'children will', 'grandchildren',
    'impact', 'difference', 'contribution', 'give back', 'inheritance',
    'tradition', 'family values', 'my hope', 'when i\'m gone', 'want you to know'
  ]
}

// Sentiment indicators for more nuanced classification
const SENTIMENT_INDICATORS = {
  positive: ['happy', 'joy', 'love', 'wonderful', 'amazing', 'grateful', 'blessed', 'beautiful'],
  negative: ['sad', 'difficult', 'hard', 'painful', 'struggle', 'loss', 'grief', 'hurt'],
  reflective: ['think', 'realize', 'understand', 'learn', 'remember', 'reflect', 'wonder']
}

interface ClassificationResult {
  chapter: ChapterType
  confidence: number
  scores: Record<ChapterType, number>
  sentiment: 'positive' | 'negative' | 'reflective' | 'neutral'
  tags: string[]
}

/**
 * Classifies a story into a life book chapter based on content analysis
 * Ported from iOS ThemeClassifier
 */
export function classifyStory(content: string): ClassificationResult {
  const normalizedContent = content.toLowerCase()
  const words = normalizedContent.split(/\s+/)

  // Calculate scores for each chapter
  const scores: Record<ChapterType, number> = {
    'who-i-am': 0,
    'where-i-come-from': 0,
    'what-ive-loved': 0,
    'whats-been-hard': 0,
    'what-ive-learned': 0,
    'what-im-still-figuring-out': 0,
    'what-i-want-you-to-know': 0
  }

  const foundTags: Set<string> = new Set()

  // Score each chapter based on keyword matches
  for (const [chapter, keywords] of Object.entries(CHAPTER_KEYWORDS) as [ChapterType, string[]][]) {
    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
      const matches = normalizedContent.match(regex)
      if (matches) {
        // Weight multi-word phrases higher
        const weight = keyword.includes(' ') ? 2 : 1
        scores[chapter] += matches.length * weight

        // Add as tag if significant
        if (matches.length >= 1) {
          foundTags.add(keyword)
        }
      }
    }
  }

  // Find the chapter with the highest score
  let maxScore = 0
  let bestChapter: ChapterType = 'who-i-am' // Default chapter if no strong match

  for (const [chapter, score] of Object.entries(scores) as [ChapterType, number][]) {
    if (score > maxScore) {
      maxScore = score
      bestChapter = chapter
    }
  }

  // Calculate confidence (0-1)
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0)
  const confidence = totalScore > 0 ? maxScore / totalScore : 0

  // Determine sentiment
  let positiveCount = 0
  let negativeCount = 0
  let reflectiveCount = 0

  for (const indicator of SENTIMENT_INDICATORS.positive) {
    if (normalizedContent.includes(indicator)) positiveCount++
  }
  for (const indicator of SENTIMENT_INDICATORS.negative) {
    if (normalizedContent.includes(indicator)) negativeCount++
  }
  for (const indicator of SENTIMENT_INDICATORS.reflective) {
    if (normalizedContent.includes(indicator)) reflectiveCount++
  }

  let sentiment: 'positive' | 'negative' | 'reflective' | 'neutral' = 'neutral'
  const maxSentiment = Math.max(positiveCount, negativeCount, reflectiveCount)

  if (maxSentiment > 0) {
    if (positiveCount === maxSentiment) sentiment = 'positive'
    else if (negativeCount === maxSentiment) sentiment = 'negative'
    else if (reflectiveCount === maxSentiment) sentiment = 'reflective'
  }

  // Generate relevant tags (limit to top 5)
  const tags = Array.from(foundTags).slice(0, 5)

  return {
    chapter: bestChapter,
    confidence,
    scores,
    sentiment,
    tags
  }
}

/**
 * Calculate a sentiment score from -1 (very negative) to 1 (very positive)
 */
export function calculateSentimentScore(content: string): number {
  const normalizedContent = content.toLowerCase()

  let positiveCount = 0
  let negativeCount = 0

  for (const indicator of SENTIMENT_INDICATORS.positive) {
    const regex = new RegExp(`\\b${indicator}\\b`, 'gi')
    const matches = normalizedContent.match(regex)
    if (matches) positiveCount += matches.length
  }

  for (const indicator of SENTIMENT_INDICATORS.negative) {
    const regex = new RegExp(`\\b${indicator}\\b`, 'gi')
    const matches = normalizedContent.match(regex)
    if (matches) negativeCount += matches.length
  }

  const total = positiveCount + negativeCount
  if (total === 0) return 0

  // Score ranges from -1 to 1
  return (positiveCount - negativeCount) / total
}

/**
 * Extract key topics/tags from content
 */
export function extractTags(content: string, maxTags: number = 5): string[] {
  const normalizedContent = content.toLowerCase()
  const tagCounts: Map<string, number> = new Map()

  for (const keywords of Object.values(CHAPTER_KEYWORDS)) {
    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
      const matches = normalizedContent.match(regex)
      if (matches && matches.length > 0) {
        tagCounts.set(keyword, (tagCounts.get(keyword) || 0) + matches.length)
      }
    }
  }

  // Sort by count and return top tags
  return Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxTags)
    .map(([tag]) => tag)
}
