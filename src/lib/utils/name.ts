function toTitleCasePart(part: string): string {
  return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
}

function formatNameWord(word: string): string {
  return word
    .split(/([-'])/)
    .map((part) => (/[-']/.test(part) ? part : toTitleCasePart(part)))
    .join('')
}

export function normalizeUserName(rawValue: string): string | null {
  if (!rawValue) return null

  const cleaned = rawValue
    .trim()
    .replace(/^(?:hi[, ]+)?(?:my name is|name is|i am|i'm|im|call me|it's|it is|this is)\s+/i, '')
    .replace(/[^\p{L}\p{M}\s'-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!cleaned) return null

  const words = cleaned
    .split(' ')
    .map((word) => word.trim())
    .filter(Boolean)

  if (words.length === 0) return null

  const normalized = words
    .map(formatNameWord)
    .join(' ')
    .trim()

  return normalized.length >= 2 ? normalized : null
}

export function getPreferredName(name: string): string {
  const normalized = normalizeUserName(name)
  if (!normalized) return ''

  return normalized.split(' ')[0] || normalized
}
