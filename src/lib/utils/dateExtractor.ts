/**
 * Date Extraction Utility
 * Extracts dates and time periods from story text using regex patterns
 */

export interface ExtractedDate {
  year?: number
  month?: number
  decade?: number
  era?: string
  raw: string
  confidence: 'high' | 'medium' | 'low'
  context: string
}

const YEAR_PATTERN = /\b(19\d{2}|20[0-2]\d)\b/g
const DECADE_PATTERN = /\b(19[2-9]0s|20[0-2]0s|'[2-9]0s)\b/gi
const ERA_PATTERN = /\b(early|mid|late)\s+(19[2-9]0s|20[0-2]0s)\b/gi
const AGE_PATTERN = /\bwhen\s+I\s+was\s+(\d{1,2})\b/gi
const RELATIVE_PATTERN = /\b(\d+)\s+years?\s+ago\b/gi
const MONTH_YEAR_PATTERN = /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(19\d{2}|20[0-2]\d)\b/gi

const MONTHS: Record<string, number> = {
  'january': 1, 'february': 2, 'march': 3, 'april': 4,
  'may': 5, 'june': 6, 'july': 7, 'august': 8,
  'september': 9, 'october': 10, 'november': 11, 'december': 12
}

function getContext(content: string, matchIndex: number, contextLength = 50): string {
  const start = Math.max(0, matchIndex - contextLength)
  const end = Math.min(content.length, matchIndex + contextLength)
  let context = content.slice(start, end)
  if (start > 0) context = '...' + context
  if (end < content.length) context = context + '...'
  return context.trim()
}

function deduplicateDates(dates: ExtractedDate[]): ExtractedDate[] {
  const seen = new Set<string>()
  return dates.filter(date => {
    const key = `${date.year || ''}-${date.decade || ''}-${date.month || ''}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function extractDates(content: string, birthYear?: number): ExtractedDate[] {
  const dates: ExtractedDate[] = []
  const currentYear = new Date().getFullYear()
  let match

  while ((match = YEAR_PATTERN.exec(content)) !== null) {
    const year = parseInt(match[1])
    dates.push({
      year,
      decade: Math.floor(year / 10) * 10,
      raw: match[0],
      confidence: 'high',
      context: getContext(content, match.index)
    })
  }

  DECADE_PATTERN.lastIndex = 0
  while ((match = DECADE_PATTERN.exec(content)) !== null) {
    const decadeStr = match[1].toLowerCase().replace("'", "19")
    const decade = parseInt(decadeStr.slice(0, -1))
    dates.push({
      decade,
      era: match[0],
      raw: match[0],
      confidence: 'medium',
      context: getContext(content, match.index)
    })
  }

  ERA_PATTERN.lastIndex = 0
  while ((match = ERA_PATTERN.exec(content)) !== null) {
    const modifier = match[1].toLowerCase()
    const decadeStr = match[2].toLowerCase()
    const decade = parseInt(decadeStr.slice(0, -1))
    let estimatedYear = decade
    if (modifier === 'early') estimatedYear += 2
    else if (modifier === 'mid') estimatedYear += 5
    else if (modifier === 'late') estimatedYear += 8
    dates.push({
      year: estimatedYear,
      decade,
      era: match[0],
      raw: match[0],
      confidence: 'medium',
      context: getContext(content, match.index)
    })
  }

  MONTH_YEAR_PATTERN.lastIndex = 0
  while ((match = MONTH_YEAR_PATTERN.exec(content)) !== null) {
    const monthName = match[1].toLowerCase()
    const year = parseInt(match[2])
    dates.push({
      year,
      month: MONTHS[monthName],
      decade: Math.floor(year / 10) * 10,
      raw: match[0],
      confidence: 'high',
      context: getContext(content, match.index)
    })
  }

  if (birthYear) {
    AGE_PATTERN.lastIndex = 0
    while ((match = AGE_PATTERN.exec(content)) !== null) {
      const age = parseInt(match[1])
      const year = birthYear + age
      if (year <= currentYear) {
        dates.push({
          year,
          decade: Math.floor(year / 10) * 10,
          raw: match[0],
          confidence: 'medium',
          context: getContext(content, match.index)
        })
      }
    }
  }

  RELATIVE_PATTERN.lastIndex = 0
  while ((match = RELATIVE_PATTERN.exec(content)) !== null) {
    const yearsAgo = parseInt(match[1])
    const year = currentYear - yearsAgo
    dates.push({
      year,
      decade: Math.floor(year / 10) * 10,
      raw: match[0],
      confidence: 'low',
      context: getContext(content, match.index)
    })
  }

  return deduplicateDates(dates).sort((a, b) => {
    const yearA = a.year || a.decade || 0
    const yearB = b.year || b.decade || 0
    return yearA - yearB
  })
}

export function estimateStoryPeriod(content: string): { start?: number, end?: number, era?: string } {
  const dates = extractDates(content)
  if (dates.length === 0) return {}

  const years = dates
    .map(d => d.year || d.decade)
    .filter((y): y is number => y !== undefined)
    .sort((a, b) => a - b)

  if (years.length === 0) return {}

  const start = years[0]
  const end = years[years.length - 1]
  let era: string | undefined

  if (end - start <= 10) {
    const decade = Math.floor((start + end) / 2 / 10) * 10
    era = `${decade}s`
  } else {
    era = `${start} - ${end}`
  }

  return { start, end, era }
}
