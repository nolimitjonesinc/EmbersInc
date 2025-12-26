import { getOpenAIClient } from '@/lib/openai/client'
import { Message } from '@/types'

interface NarrativeOptions {
  style?: 'memoir' | 'story' | 'journal' | 'letter'
  perspective?: 'first' | 'third'
  tone?: 'warm' | 'formal' | 'casual' | 'nostalgic'
  includeQuotes?: boolean
}

const DEFAULT_OPTIONS: NarrativeOptions = {
  style: 'memoir',
  perspective: 'first',
  tone: 'warm',
  includeQuotes: true
}

/**
 * Generates polished narrative prose from conversation messages
 * This transforms the raw Q&A conversation into a flowing story
 */
export async function generateNarrativeProse(
  messages: Message[],
  options: NarrativeOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  // Extract only user messages (the actual story content)
  const userContent = messages
    .filter((m) => m.role === 'user')
    .map((m) => m.content)
    .join('\n\n')

  if (!userContent.trim()) {
    return ''
  }

  const openai = getOpenAIClient()

  const styleGuide = getStyleGuide(opts)

  const prompt = `You are a skilled memoir writer helping to transform spoken stories into beautifully written prose.

Take the following story content (from a conversation) and rewrite it as ${opts.style === 'memoir' ? 'a memoir passage' : opts.style === 'letter' ? 'a heartfelt letter to family' : opts.style === 'journal' ? 'a personal journal entry' : 'a narrative story'}.

${styleGuide}

Guidelines:
- Write in ${opts.perspective === 'first' ? 'first person' : 'third person'}
- Use a ${opts.tone} tone
- Preserve the emotional authenticity of the original
- Add sensory details and scene-setting where appropriate
- Keep the voice true to the storyteller
- ${opts.includeQuotes ? 'Include memorable direct quotes where they add impact' : 'Paraphrase all dialogue naturally'}
- Don't add fictional elements - only enhance what's there
- Aim for 2-4 paragraphs that flow naturally

Story content to transform:
${userContent}

Write the narrative prose:`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 1000,
  })

  return completion.choices[0]?.message?.content || ''
}

/**
 * Generate a title for a story based on its content
 */
export async function generateStoryTitle(content: string): Promise<string> {
  if (!content.trim()) {
    return 'Untitled Story'
  }

  const openai = getOpenAIClient()

  const prompt = `Generate a short, evocative title (3-7 words) for this personal story. The title should capture the essence or emotion of the story without being generic.

Story excerpt:
${content.slice(0, 1500)}

Return only the title, no quotes or explanation:`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
    max_tokens: 50,
  })

  const title = completion.choices[0]?.message?.content?.trim() || 'Untitled Story'

  // Clean up any quotes or extra formatting
  return title.replace(/^["']|["']$/g, '').trim()
}

/**
 * Polish existing narrative prose (for the ghostwriter feature)
 */
export async function polishNarrative(
  originalProse: string,
  instructions?: string
): Promise<{ polished: string; changes: string[] }> {
  if (!originalProse.trim()) {
    return { polished: '', changes: [] }
  }

  const openai = getOpenAIClient()

  const prompt = `You are a gentle editor helping to polish a personal memoir while preserving the author's voice.

Original prose:
${originalProse}

${instructions ? `Special instructions: ${instructions}` : ''}

Guidelines:
- Fix grammar and punctuation gently
- Improve sentence flow and readability
- Maintain the author's unique voice and style
- Keep emotional authenticity
- Don't add fictional content
- Don't over-formalize casual, heartfelt language

Respond in JSON format:
{
  "polished": "the polished text",
  "changes": ["list of key changes made"]
}

Polish the prose:`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.5,
    max_tokens: 1500,
    response_format: { type: 'json_object' }
  })

  try {
    const result = JSON.parse(completion.choices[0]?.message?.content || '{}')
    return {
      polished: result.polished || originalProse,
      changes: result.changes || []
    }
  } catch {
    return { polished: originalProse, changes: [] }
  }
}

/**
 * Expand a brief story into a richer narrative
 */
export async function expandStory(
  briefContent: string,
  context?: { chapter?: string; era?: string }
): Promise<string> {
  if (!briefContent.trim()) {
    return ''
  }

  const openai = getOpenAIClient()

  const contextHints = []
  if (context?.chapter) {
    contextHints.push(`This story is from the "${context.chapter.replace(/-/g, ' ')}" chapter of their life book.`)
  }
  if (context?.era) {
    contextHints.push(`This story takes place during ${context.era}.`)
  }

  const prompt = `You are helping expand a brief personal story into a richer, more detailed narrative.

Brief story:
${briefContent}

${contextHints.length > 0 ? 'Context:\n' + contextHints.join('\n') : ''}

Guidelines:
- Ask yourself: what sensory details might have been present?
- Consider the emotions the storyteller might have felt
- Add texture without inventing false facts
- Keep the expansion authentic to the original voice
- Aim for 2-3x the original length
- Use phrases like "I remember..." or "I can still see..." to add richness

Expand the story naturally:`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 800,
  })

  return completion.choices[0]?.message?.content || briefContent
}

function getStyleGuide(opts: NarrativeOptions): string {
  switch (opts.style) {
    case 'memoir':
      return 'Write in a reflective, memoir style - looking back on experiences with wisdom and perspective.'
    case 'letter':
      return 'Write as a heartfelt letter to family members, sharing these memories and their meaning.'
    case 'journal':
      return 'Write as a personal journal entry, intimate and unguarded, capturing thoughts as they come.'
    case 'story':
      return 'Write as a narrative story, with scene-setting and emotional arc.'
    default:
      return ''
  }
}
