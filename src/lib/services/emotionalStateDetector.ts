/**
 * Emotional State Detection for Ember conversations
 *
 * Scans user messages for emotional signals and returns concise
 * response guidance for the AI system prompt. Based on the patterns
 * defined in docs/rules/EMOTIONAL_STATE_RESPONSES.md.
 */

export type EmotionalState =
  | 'grief'
  | 'joy'
  | 'nostalgia'
  | 'confusion'
  | 'shame'
  | 'pride'
  | 'resistance'

const EMOTIONAL_SIGNALS: Record<EmotionalState, string[]> = {
  grief: ['passed away', 'died', 'lost', 'miss them', 'gone', 'funeral', 'death', 'passing'],
  joy: ['wonderful', 'amazing', 'best day', 'so happy', 'loved it', 'fantastic', 'incredible'],
  nostalgia: ['those days', 'wish i could', 'simpler times', 'back then', 'used to be'],
  confusion: ["can't remember", 'not sure', 'let me think', 'i forget', 'fuzzy'],
  shame: ["shouldn't have", 'biggest mistake', 'regret', 'failed', 'ashamed', 'guilty'],
  pride: ['proud', 'accomplished', 'achieved', 'against all odds', 'finally did'],
  resistance: ["don't want to", 'rather not', 'skip', 'move on', 'private']
}

/**
 * Concise response instructions keyed by emotional state.
 * These are injected into the system prompt, so brevity matters.
 */
const RESPONSE_GUIDANCE: Record<EmotionalState, string> = {
  grief:
    'The user appears to be sharing grief. Acknowledge the loss gently, create space for feeling, do NOT probe immediately. Let them lead. Avoid platitudes.',
  joy:
    'The user is expressing joy. Mirror their happiness genuinely, celebrate with them, ask what made the moment special. Do NOT move on too quickly.',
  nostalgia:
    'The user is feeling nostalgic. Honor both the sweetness and the ache. Use sensory questions to help them return to that time. Do NOT try to fix the bittersweetness.',
  confusion:
    'The user seems uncertain or is struggling to remember. Reassure them there is no wrong answer, offer gentle scaffolding, give permission to skip. Do NOT pressure for specifics.',
  shame:
    'The user is sharing something they regret or feel ashamed of. Acknowledge their courage, normalize without dismissing, gently reframe toward wisdom gained. Do NOT minimize or probe for more painful details.',
  pride:
    'The user is expressing pride or accomplishment. Celebrate genuinely, ask about the journey not just the outcome, help them own it fully.',
  resistance:
    'The user does not want to discuss this topic. Respect the boundary immediately, offer alternatives, NEVER push or ask why. Move to something they want to explore.'
}

export interface EmotionalDetectionResult {
  state: EmotionalState
  guidance: string
  matchedSignals: string[]
}

/**
 * Detects the dominant emotional state in a user message.
 *
 * Returns the highest-scoring emotional state with response guidance,
 * or null if no clear emotional signal is found.
 *
 * Multi-word phrases are weighted 2x to reduce false positives
 * (e.g., "passed away" is a stronger grief signal than "lost" alone).
 */
export function detectEmotionalState(message: string): EmotionalDetectionResult | null {
  const normalizedMessage = message.toLowerCase()

  let bestState: EmotionalState | null = null
  let bestScore = 0
  let bestMatches: string[] = []

  for (const [state, signals] of Object.entries(EMOTIONAL_SIGNALS) as [EmotionalState, string[]][]) {
    let score = 0
    const matched: string[] = []

    for (const signal of signals) {
      if (normalizedMessage.includes(signal)) {
        // Multi-word phrases get double weight to reduce false positives
        const weight = signal.includes(' ') ? 2 : 1
        score += weight
        matched.push(signal)
      }
    }

    if (score > bestScore) {
      bestScore = score
      bestState = state
      bestMatches = matched
    }
  }

  if (!bestState || bestScore === 0) {
    return null
  }

  return {
    state: bestState,
    guidance: RESPONSE_GUIDANCE[bestState],
    matchedSignals: bestMatches
  }
}
