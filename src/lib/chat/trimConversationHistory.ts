/**
 * Sliding window for conversation history sent to OpenAI.
 *
 * Prevents unbounded token costs by keeping only:
 * - The first message (sets conversation context)
 * - The most recent messages (active conversation)
 * - A brief note about omitted middle messages
 *
 * Inspired by Loomiverse IntegratedAdventureEngine's 2000 char hard limit.
 */

interface OpenAIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

/**
 * Rough token estimate: ~4 chars per token for English text.
 * Not perfect, but good enough to stay under budget.
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

function messagesTotalTokens(messages: OpenAIMessage[]): number {
  return messages.reduce((sum, m) => sum + estimateTokens(m.content), 0)
}

/**
 * Trim conversation history to fit within a token budget.
 *
 * Strategy:
 * - Always keep the first message (establishes context/topic)
 * - Always keep the last KEEP_RECENT messages (active conversation flow)
 * - If middle messages exist and budget allows, insert a brief summary note
 * - If even first + recent exceeds budget, keep first + as many recent as fit
 */
export function trimConversationHistory(
  messages: OpenAIMessage[],
  tokenBudget: number = 3000
): OpenAIMessage[] {
  // Under budget — send everything
  if (messagesTotalTokens(messages) <= tokenBudget) {
    return messages
  }

  const KEEP_RECENT = 6

  // Short conversation but still over budget — trim from oldest
  if (messages.length <= KEEP_RECENT + 1) {
    const result: OpenAIMessage[] = []
    let remaining = tokenBudget
    // Add messages from most recent backwards
    for (let i = messages.length - 1; i >= 0; i--) {
      const cost = estimateTokens(messages[i].content)
      if (remaining - cost < 0) break
      remaining -= cost
      result.unshift(messages[i])
    }
    return result
  }

  const first = messages[0]
  const recent = messages.slice(-KEEP_RECENT)
  const middleCount = messages.length - KEEP_RECENT - 1

  const firstTokens = estimateTokens(first.content)
  const recentTokens = messagesTotalTokens(recent)
  const reservedTokens = firstTokens + recentTokens

  // If first + recent already exceeds budget, trim recent from oldest
  if (reservedTokens >= tokenBudget) {
    const result: OpenAIMessage[] = [first]
    let remaining = tokenBudget - firstTokens

    // Add recent messages from most recent backwards
    const recentReversed = [...recent].reverse()
    const kept: OpenAIMessage[] = []

    for (const msg of recentReversed) {
      const cost = estimateTokens(msg.content)
      if (remaining - cost < 0) break
      remaining -= cost
      kept.unshift(msg)
    }

    return [...result, ...kept]
  }

  // Budget allows first + recent. Add a context note about skipped messages.
  const contextNote: OpenAIMessage = {
    role: 'system',
    content: `[${middleCount} earlier messages omitted for brevity. The user has been sharing their stories and memories with you. Continue the conversation naturally based on the recent messages below.]`,
  }

  return [first, contextNote, ...recent]
}
