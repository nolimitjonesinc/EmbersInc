/**
 * In-session memory for conversation context.
 *
 * Tracks what's been discussed so the AI doesn't repeat questions,
 * remembers names/people/emotions, and prioritizes sacred memories
 * (deaths, births, weddings) that should never be forgotten.
 *
 * Inspired by Loomiverse MemorySystem.js — simplified for Embers.
 */

export type MemoryType =
  | 'STORY_TOPIC'
  | 'PERSON_MENTIONED'
  | 'EMOTION_EXPRESSED'
  | 'QUESTION_ASKED'
  | 'PROMISE_MADE'

/** 1=BACKGROUND, 2=NORMAL, 3=IMPORTANT, 4=SACRED (never evict) */
export type SalienceLevel = 1 | 2 | 3 | 4

export interface Memory {
  type: MemoryType
  content: string
  salience: SalienceLevel
  timestamp: number
}

const MAX_MEMORIES = 100

export class ConversationMemory {
  private memories: Memory[] = []

  /** Store a memory, deduplicating by type+content. */
  storeMemory(type: MemoryType, content: string, salience: SalienceLevel): void {
    const normalized = content.toLowerCase().trim()
    if (!normalized) return

    // If this exact memory already exists, upgrade salience if higher
    const existing = this.memories.find(
      (m) => m.type === type && m.content.toLowerCase().trim() === normalized
    )
    if (existing) {
      if (salience > existing.salience) existing.salience = salience
      return
    }

    this.memories.push({ type, content: content.trim(), salience, timestamp: Date.now() })

    // Evict lowest-salience memories if over limit (never evict sacred)
    if (this.memories.length > MAX_MEMORIES) {
      const nonSacred = this.memories.filter((m) => m.salience < 4)
      if (nonSacred.length > 0) {
        // Remove the oldest, lowest-salience non-sacred memory
        nonSacred.sort((a, b) => a.salience - b.salience || a.timestamp - b.timestamp)
        const victim = nonSacred[0]
        const victimIdx = this.memories.indexOf(victim)
        if (victimIdx >= 0) this.memories.splice(victimIdx, 1)
      }
      // If ALL memories are sacred, allow growth beyond MAX_MEMORIES
      // (sacred memories are too important to evict — this is by design)
    }
  }

  /** Check if the AI has already asked about a topic. */
  hasAskedAbout(topic: string): boolean {
    const normalized = topic.toLowerCase()
    return this.memories.some(
      (m) => m.type === 'QUESTION_ASKED' && m.content.toLowerCase().includes(normalized)
    )
  }

  /**
   * Build a compact context string for the system prompt.
   * Sacred memories always included first. Respects a character budget.
   *
   * Format:
   *   PEOPLE: ★ Margaret (wife, passed 2019), Robert, Helen
   *   TOPICS COVERED: childhood in Ohio, working at the mill
   *   EMOTIONAL MOMENTS: ★ loss of wife, pride in grandchildren
   */
  getMemoryContext(charBudget: number = 2000): string {
    // Sort: sacred first, then by recency
    const sorted = [...this.memories].sort((a, b) => {
      if (a.salience !== b.salience) return b.salience - a.salience
      return b.timestamp - a.timestamp
    })

    const sections: Record<string, string[]> = {
      PEOPLE: [],
      'TOPICS COVERED': [],
      'EMOTIONAL MOMENTS': [],
      'QUESTIONS ALREADY ASKED': [],
    }

    const typeToSection: Record<MemoryType, string> = {
      PERSON_MENTIONED: 'PEOPLE',
      STORY_TOPIC: 'TOPICS COVERED',
      EMOTION_EXPRESSED: 'EMOTIONAL MOMENTS',
      QUESTION_ASKED: 'QUESTIONS ALREADY ASKED',
      PROMISE_MADE: 'TOPICS COVERED', // Fold promises into topics
    }

    // Pre-calculate label overhead: "LABEL: " + "\n" for each potential section
    const labelOverhead: Record<string, number> = {}
    for (const label of Object.keys(sections)) {
      labelOverhead[label] = label.length + 2 // "LABEL: "
    }

    let totalChars = 0

    for (const memory of sorted) {
      const section = typeToSection[memory.type]
      const entry = memory.salience >= 4 ? `★ ${memory.content}` : memory.content

      // If this is the first entry for this section, include label cost
      const isFirstInSection = sections[section].length === 0
      const labelCost = isFirstInSection ? labelOverhead[section] + 1 : 0 // +1 for \n separator between sections
      const entryCost = entry.length + (isFirstInSection ? 0 : 2) // +2 for ", " separator

      if (totalChars + labelCost + entryCost > charBudget) break

      sections[section].push(entry)
      totalChars += labelCost + entryCost
    }

    // Build compact output — only non-empty sections
    const parts: string[] = []
    for (const [label, items] of Object.entries(sections)) {
      if (items.length > 0) {
        parts.push(`${label}: ${items.join(', ')}`)
      }
    }

    return parts.join('\n')
  }

  /** Get all memories (for debugging or persistence). */
  getMemories(): readonly Memory[] {
    return this.memories
  }

  /** Serialize for storage. */
  toJSON(): Memory[] {
    return [...this.memories]
  }

  /** Restore from storage with validation. */
  static fromJSON(data: unknown): ConversationMemory {
    const memory = new ConversationMemory()
    if (!Array.isArray(data)) return memory

    const validTypes: Set<string> = new Set(['STORY_TOPIC', 'PERSON_MENTIONED', 'EMOTION_EXPRESSED', 'QUESTION_ASKED', 'PROMISE_MADE'])
    const validSalience = new Set([1, 2, 3, 4])

    for (const item of data) {
      if (
        item &&
        typeof item === 'object' &&
        typeof item.content === 'string' &&
        validTypes.has(item.type) &&
        validSalience.has(item.salience) &&
        typeof item.timestamp === 'number'
      ) {
        memory.memories.push(item as Memory)
      }
    }

    return memory
  }
}
