import { ChapterType } from '@/types'

// ============================================================================
// PRIORITY-BASED CHAPTER CLASSIFICATION
// Based on docs/rules/CHAPTER_CLASSIFICATION_GUIDE.md
//
// Priority order:
//   1. Direct address → What I Want You to Know
//   2. Time markers → Where I Come From
//   3. Emotional tone (joy → What I've Loved, pain → What's Been Hard)
//   4. Uncertainty markers → What I'm Still Figuring Out
//   5. Reflection markers → What I've Learned
//   6. Default (identity/values) → Who I Am
// ============================================================================

// --- High-weight patterns (priority phrases from the classification guide) ---

const DIRECT_ADDRESS_PATTERNS: string[] = [
  'i want you to know',
  'my advice to you',
  'i hope you',
  'i hope you\'ll',
  'i want to leave you',
  'if i could give you one piece of advice',
  'i hope you\'ll always remember',
  'when i\'m gone',
  'i need you to understand',
  'please remember',
  'promise me',
  'my wish for you',
  'want you to remember',
  'my message to you',
  'to my children',
  'to my grandchildren',
  'dear family',
  'pass on to you',
  'what i want to leave behind',
  'remember me',
  'i want to be remembered',
]

const TIME_MARKER_PATTERNS: string[] = [
  'childhood',
  'growing up',
  'grew up',
  'when i was young',
  'when i was a kid',
  'when i was a child',
  'when i was little',
  'as a child',
  'as a kid',
  'early years',
  'my parents',
  'my mother',
  'my father',
  'my mom',
  'my dad',
  'my grandmother',
  'my grandfather',
  'my grandparents',
  'my siblings',
  'my brother',
  'my sister',
  'where i grew',
  'born and raised',
  'first home',
  'old house',
  'back in the day',
  'hometown',
  'our neighborhood',
  'our house',
  'my town',
  'my village',
  'old country',
  'came to this country',
  'back then',
  'in those days',
]

const UNCERTAINTY_PATTERNS: string[] = [
  'still figuring out',
  'still learning',
  'still trying',
  'still wonder',
  'still struggling',
  'still working on',
  'not sure if',
  'not sure what',
  'i wonder',
  'i sometimes wonder',
  'wondering if',
  'wondering what',
  'figuring out',
  'work in progress',
  'haven\'t figured out',
  'don\'t have the answer',
  'i keep asking',
  'what would have happened if',
  'trying to understand',
  'i hope i can still',
  'maybe someday',
  'haven\'t resolved',
  'unresolved',
]

const REFLECTION_PATTERNS: string[] = [
  'i learned',
  'i\'ve learned',
  'i realized',
  'i\'ve realized',
  'i understand now',
  'i came to understand',
  'now i know',
  'looking back',
  'in hindsight',
  'the lesson',
  'biggest lesson',
  'if i could tell my younger self',
  'i used to think',
  'i know now',
  'changed my mind',
  'changed my perspective',
  'i was wrong about',
  'taught me that',
  'opened my eyes',
  'i grew to understand',
  'wisdom i gained',
]

// --- Keyword banks for scoring (expanded from original) ---

const CHAPTER_KEYWORDS: Record<ChapterType, string[]> = {
  'who-i-am': [
    'become', 'identity', 'who i am', 'character', 'personality', 'values',
    'beliefs', 'faith', 'religion', 'spiritual', 'philosophy', 'principles',
    'morals', 'ethics', 'goals', 'dreams', 'aspirations', 'achievements',
    'accomplishments', 'proud', 'journey', 'path', 'career', 'profession',
    'i believe', 'i value', 'defines me', 'core of who', 'always been',
    'my nature', 'i stand for', 'my purpose', 'what matters to me',
    'stubborn', 'determined', 'kind', 'honest', 'loyal', 'courageous',
  ],
  'where-i-come-from': [
    'childhood', 'grew up', 'parents', 'mother', 'father', 'mom', 'dad',
    'siblings', 'brother', 'sister', 'family', 'hometown', 'born', 'raised',
    'heritage', 'ancestors', 'grandparents', 'neighborhood', 'school',
    'elementary', 'roots', 'origin', 'where i grew', 'early years',
    'first home', 'old house', 'my town', 'village', 'country',
    'grandmother', 'grandfather', 'traditions', 'culture', 'ethnic',
    'immigrant', 'cousins', 'household', 'upbringing',
  ],
  'what-ive-loved': [
    'love', 'loved', 'passion', 'joy', 'happy', 'happiness', 'wonderful',
    'beautiful', 'amazing', 'favorite', 'hobby', 'enjoy', 'pleasure',
    'delight', 'cherish', 'treasure', 'meaningful', 'special', 'precious',
    'blessed', 'grateful', 'thankful', 'appreciate', 'romance', 'wedding',
    'marriage', 'spouse', 'partner', 'children', 'grandchildren',
    'the day i met', 'light of my life', 'changed everything', 'fell in love',
  ],
  'whats-been-hard': [
    'hard', 'difficult', 'challenge', 'struggle', 'tough', 'overcome',
    'adversity', 'loss', 'grief', 'painful', 'hurt', 'suffering', 'trial',
    'obstacle', 'setback', 'failure', 'mistake', 'regret', 'hardship',
    'crisis', 'trouble', 'problem', 'illness', 'death', 'divorce',
    'depression', 'anxiety', 'fear', 'worry', 'devastating', 'heartbreak',
    'nearly broke me', 'hardest thing', 'lost everything', 'diagnosis',
  ],
  'what-ive-learned': [
    'learn', 'learned', 'lesson', 'wisdom', 'advice', 'taught', 'realize',
    'understand', 'insight', 'growth', 'mature', 'discover', 'knowledge',
    'experience', 'perspective', 'change', 'transform', 'evolve',
    'important', 'value', 'believe', 'truth', 'meaning', 'purpose',
    'i came to see', 'opened my eyes', 'changed my mind',
  ],
  'what-im-still-figuring-out': [
    'uncertain', 'wondering', 'figuring out', 'still learning', 'not sure',
    'questioning', 'seeking', 'exploring', 'confused', 'doubt', 'uncertain',
    'work in progress', 'growing', 'changing', 'evolving', 'struggle with',
    'haven\'t figured', 'unanswered', 'open question',
  ],
  'what-i-want-you-to-know': [
    'legacy', 'remember', 'remembered', 'future', 'generations', 'pass on',
    'teach', 'hope', 'wish', 'want to leave', 'children will', 'grandchildren',
    'impact', 'difference', 'contribution', 'give back', 'inheritance',
    'tradition', 'family values', 'my hope', 'when i\'m gone', 'want you to know',
    'to my family', 'message for', 'final wish',
  ],
}

// --- Sentiment indicators ---

const SENTIMENT_INDICATORS = {
  positive: [
    'happy', 'joy', 'love', 'wonderful', 'amazing', 'grateful', 'blessed',
    'beautiful', 'delight', 'treasure', 'cherish', 'passionate', 'thrilled',
    'elated', 'peaceful', 'content', 'excited', 'warm', 'fond', 'adore',
  ],
  negative: [
    'sad', 'difficult', 'hard', 'painful', 'struggle', 'loss', 'grief',
    'hurt', 'devastating', 'heartbreak', 'failed', 'broken', 'hopeless',
    'terrified', 'angry', 'bitter', 'resentful', 'lonely', 'scared', 'crushed',
  ],
  reflective: [
    'think', 'realize', 'understand', 'learn', 'remember', 'reflect',
    'wonder', 'consider', 'ponder', 'contemplate', 'look back', 'hindsight',
  ],
}

// --- Edge case phrases that need contextual disambiguation ---
// Each has two candidate chapters; the classifier will check surrounding
// context to see which chapter's keywords dominate the nearby text.

interface EdgeCasePhrase {
  phrase: string
  candidateA: ChapterType
  candidateB: ChapterType
  // Description of what tips the balance toward each candidate
  contextHintA: string[] // keywords that bias toward candidateA
  contextHintB: string[] // keywords that bias toward candidateB
}

const EDGE_CASE_PHRASES: EdgeCasePhrase[] = [
  {
    // "My father taught me to be honest" — about the VALUE vs about FATHER
    phrase: 'taught me to be',
    candidateA: 'who-i-am',
    candidateB: 'where-i-come-from',
    contextHintA: ['value', 'believe', 'always been', 'defines', 'who i am', 'character', 'honest', 'kind', 'strong', 'principles'],
    contextHintB: ['father', 'mother', 'dad', 'mom', 'parents', 'grandmother', 'grandfather', 'family', 'growing up', 'childhood'],
  },
  {
    // "My childhood was hard because we were poor"
    phrase: 'childhood was hard',
    candidateA: 'whats-been-hard',
    candidateB: 'where-i-come-from',
    contextHintA: ['struggle', 'overcome', 'painful', 'difficult', 'suffered', 'trauma', 'loss'],
    contextHintB: ['town', 'neighborhood', 'house', 'school', 'family', 'grew up', 'lived', 'raised'],
  },
  {
    // "I loved my mother so much, and when she died..."
    phrase: 'loved',
    candidateA: 'what-ive-loved',
    candidateB: 'whats-been-hard',
    contextHintA: ['joy', 'happy', 'wonderful', 'beautiful', 'treasure', 'favorite', 'cherish', 'passion'],
    contextHintB: ['died', 'death', 'lost', 'gone', 'grief', 'passed away', 'miss', 'funeral'],
  },
  {
    // "My divorce was hard, but it taught me..."
    phrase: 'taught me',
    candidateA: 'what-ive-learned',
    candidateB: 'whats-been-hard',
    contextHintA: ['lesson', 'realized', 'understand', 'wisdom', 'insight', 'perspective', 'growth'],
    contextHintB: ['hard', 'painful', 'difficult', 'struggle', 'hurt', 'crisis', 'tough'],
  },
  {
    // "Family is the most important thing" — their value vs advice
    phrase: 'most important thing',
    candidateA: 'who-i-am',
    candidateB: 'what-i-want-you-to-know',
    contextHintA: ['i believe', 'to me', 'my life', 'always felt', 'values', 'who i am'],
    contextHintB: ['want you', 'remember', 'never forget', 'hope you', 'my advice', 'generations'],
  },
  {
    // "I've struggled with forgiveness my whole life"
    phrase: 'struggled with',
    candidateA: 'what-im-still-figuring-out',
    candidateB: 'whats-been-hard',
    contextHintA: ['still', 'ongoing', 'haven\'t', 'trying to', 'wondering', 'figuring out', 'someday'],
    contextHintB: ['overcame', 'got through', 'survived', 'eventually', 'finally', 'was hard', 'in the past'],
  },
  {
    // "I want my grandchildren to know that patience is everything"
    phrase: 'grandchildren',
    candidateA: 'what-i-want-you-to-know',
    candidateB: 'what-ive-loved',
    contextHintA: ['want', 'know', 'remember', 'advice', 'hope', 'teach', 'lesson', 'pass on'],
    contextHintB: ['love', 'joy', 'happy', 'light of my life', 'cherish', 'playing', 'laughing'],
  },
]

// ============================================================================
// Classification result interface
// ============================================================================

interface ClassificationResult {
  chapter: ChapterType
  confidence: number
  scores: Record<ChapterType, number>
  sentiment: 'positive' | 'negative' | 'reflective' | 'neutral'
  tags: string[]
  /** True when confidence is 50-70% or below 50% — UI should make re-classification easy */
  needsConfirmation: boolean
  /** The second-highest scoring chapter, if any (for multi-chapter stories) */
  secondaryChapter: ChapterType | null
}

// ============================================================================
// Helper: count pattern matches in text
// ============================================================================

function countPhraseMatches(text: string, phrases: string[]): number {
  let count = 0
  for (const phrase of phrases) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi')
    const matches = text.match(regex)
    if (matches) count += matches.length
  }
  return count
}

// ============================================================================
// Helper: get surrounding context for edge case disambiguation
// ============================================================================

function getContextWindow(text: string, phrase: string, windowSize: number = 120): string {
  const idx = text.indexOf(phrase)
  if (idx === -1) return text
  const start = Math.max(0, idx - windowSize)
  const end = Math.min(text.length, idx + phrase.length + windowSize)
  return text.slice(start, end)
}

// ============================================================================
// Main classification function
// ============================================================================

/**
 * Classifies a story into a life book chapter using a priority-based algorithm.
 *
 * Priority order (from the Classification Guide):
 *   1. Direct address → What I Want You to Know
 *   2. Time markers → Where I Come From
 *   3. Emotional tone (joy/pain) → What I've Loved / What's Been Hard
 *   4. Uncertainty markers → What I'm Still Figuring Out
 *   5. Reflection markers → What I've Learned
 *   6. Default → Who I Am
 *
 * Each priority tier can be overridden if the keyword scoring strongly
 * disagrees, but the priority order gives a substantial bonus (3x weight)
 * to whichever tier matches first.
 */
export function classifyStory(content: string): ClassificationResult {
  const normalizedContent = content.toLowerCase()
  const foundTags: Set<string> = new Set()

  // ------------------------------------------------------------------
  // Step 1: Keyword scoring (base layer, same as before but improved)
  // ------------------------------------------------------------------

  const scores: Record<ChapterType, number> = {
    'who-i-am': 0,
    'where-i-come-from': 0,
    'what-ive-loved': 0,
    'whats-been-hard': 0,
    'what-ive-learned': 0,
    'what-im-still-figuring-out': 0,
    'what-i-want-you-to-know': 0,
  }

  for (const [chapter, keywords] of Object.entries(CHAPTER_KEYWORDS) as [ChapterType, string[]][]) {
    for (const keyword of keywords) {
      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(`\\b${escaped}\\b`, 'gi')
      const matches = normalizedContent.match(regex)
      if (matches) {
        // Multi-word phrases get double weight
        const weight = keyword.includes(' ') ? 2 : 1
        scores[chapter] += matches.length * weight
        if (matches.length >= 1) foundTags.add(keyword)
      }
    }
  }

  // ------------------------------------------------------------------
  // Step 2: Priority-based bonuses (the core of the new algorithm)
  // ------------------------------------------------------------------

  const PRIORITY_BONUS = 8 // substantial bonus for matching a priority tier

  // Priority 1: Direct address → What I Want You to Know
  const directAddressCount = countPhraseMatches(normalizedContent, DIRECT_ADDRESS_PATTERNS)
  if (directAddressCount > 0) {
    scores['what-i-want-you-to-know'] += PRIORITY_BONUS * directAddressCount
  }

  // Priority 2: Time markers → Where I Come From
  const timeMarkerCount = countPhraseMatches(normalizedContent, TIME_MARKER_PATTERNS)
  if (timeMarkerCount > 0) {
    scores['where-i-come-from'] += (PRIORITY_BONUS - 1) * timeMarkerCount
  }

  // Priority 3: Emotional tone → What I've Loved / What's Been Hard
  const joyCount = countPhraseMatches(normalizedContent, SENTIMENT_INDICATORS.positive)
  const painCount = countPhraseMatches(normalizedContent, SENTIMENT_INDICATORS.negative)
  if (joyCount > painCount && joyCount >= 2) {
    scores['what-ive-loved'] += (PRIORITY_BONUS - 2) * joyCount
  } else if (painCount > joyCount && painCount >= 2) {
    scores['whats-been-hard'] += (PRIORITY_BONUS - 2) * painCount
  }

  // Priority 4: Uncertainty markers → What I'm Still Figuring Out
  const uncertaintyCount = countPhraseMatches(normalizedContent, UNCERTAINTY_PATTERNS)
  if (uncertaintyCount > 0) {
    scores['what-im-still-figuring-out'] += (PRIORITY_BONUS - 3) * uncertaintyCount
  }

  // Priority 5: Reflection markers → What I've Learned
  const reflectionCount = countPhraseMatches(normalizedContent, REFLECTION_PATTERNS)
  if (reflectionCount > 0) {
    scores['what-ive-learned'] += (PRIORITY_BONUS - 4) * reflectionCount
  }

  // ------------------------------------------------------------------
  // Step 3: Edge case disambiguation
  // ------------------------------------------------------------------
  // For ambiguous phrases, check surrounding context to see which
  // candidate chapter's hint keywords appear more.

  for (const edgeCase of EDGE_CASE_PHRASES) {
    if (normalizedContent.includes(edgeCase.phrase)) {
      const context = getContextWindow(normalizedContent, edgeCase.phrase)
      const hintACount = countPhraseMatches(context, edgeCase.contextHintA)
      const hintBCount = countPhraseMatches(context, edgeCase.contextHintB)

      // Give a bonus to whichever candidate has more contextual support
      if (hintACount > hintBCount) {
        scores[edgeCase.candidateA] += 3
      } else if (hintBCount > hintACount) {
        scores[edgeCase.candidateB] += 3
      }
      // Tie: no bonus, let other signals decide
    }
  }

  // ------------------------------------------------------------------
  // Step 4: Determine winner, runner-up, and confidence
  // ------------------------------------------------------------------

  const sortedChapters = (Object.entries(scores) as [ChapterType, number][])
    .sort((a, b) => b[1] - a[1])

  const bestChapter = sortedChapters[0][0]
  const bestScore = sortedChapters[0][1]
  const runnerUp = sortedChapters[1]
  const secondaryChapter: ChapterType | null = runnerUp[1] > 0 ? runnerUp[0] : null

  // Confidence: ratio of best score to total, mapped to 0-100%
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0)
  let confidence: number
  if (totalScore === 0) {
    // No signals at all — default to Who I Am with low confidence
    confidence = 0.2
  } else {
    confidence = bestScore / totalScore
  }

  // If no chapter scored anything, fall through to Who I Am (the default)
  const finalChapter: ChapterType = bestScore > 0 ? bestChapter : 'who-i-am'

  // ------------------------------------------------------------------
  // Step 5: Confidence thresholds → needsConfirmation
  // ------------------------------------------------------------------
  // > 70%: auto-classify (needsConfirmation = false)
  // 50-70%: classify but flag for easy re-classification (needsConfirmation = true)
  // < 50%: suggest asking user to confirm (needsConfirmation = true)
  const needsConfirmation = confidence < 0.7

  // ------------------------------------------------------------------
  // Step 6: Sentiment analysis
  // ------------------------------------------------------------------

  let positiveCount = 0
  let negativeCount = 0
  let reflectiveCountSent = 0

  for (const indicator of SENTIMENT_INDICATORS.positive) {
    if (normalizedContent.includes(indicator)) positiveCount++
  }
  for (const indicator of SENTIMENT_INDICATORS.negative) {
    if (normalizedContent.includes(indicator)) negativeCount++
  }
  for (const indicator of SENTIMENT_INDICATORS.reflective) {
    if (normalizedContent.includes(indicator)) reflectiveCountSent++
  }

  let sentiment: 'positive' | 'negative' | 'reflective' | 'neutral' = 'neutral'
  const maxSentiment = Math.max(positiveCount, negativeCount, reflectiveCountSent)
  if (maxSentiment > 0) {
    if (positiveCount === maxSentiment) sentiment = 'positive'
    else if (negativeCount === maxSentiment) sentiment = 'negative'
    else if (reflectiveCountSent === maxSentiment) sentiment = 'reflective'
  }

  // ------------------------------------------------------------------
  // Step 7: Tags (top 5)
  // ------------------------------------------------------------------

  const tags = Array.from(foundTags).slice(0, 5)

  return {
    chapter: finalChapter,
    confidence,
    scores,
    sentiment,
    tags,
    needsConfirmation,
    secondaryChapter,
  }
}

// ============================================================================
// Sentiment score (unchanged API, -1 to 1)
// ============================================================================

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

// ============================================================================
// Tag extraction (unchanged API)
// ============================================================================

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
