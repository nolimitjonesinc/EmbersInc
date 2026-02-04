import { NextRequest, NextResponse } from 'next/server'
import { getOpenAIClient } from '@/lib/openai/client'
import { getPersonaPrompt, getPersona, DEFAULT_PERSONA } from '@/lib/personas/definitions'
import { Message, ChatResponse, ChapterType } from '@/types'
import {
  generateOpeningMessage,
  getRandomWarmPrompt,
  getPromptsForInterests,
  getGentleEncouragement
} from '@/lib/prompts/promptSelector'
import { allWarmPrompts } from '@/lib/prompts/warmEngagementPrompts'

export const runtime = 'edge'

interface ChatRequestBody {
  messages: Message[]
  userName?: string
  isFirstMessage?: boolean
  persona?: string
  selectedInterests?: string[]
  isReturningUser?: boolean
  frequentlyMentionedPeople?: string[]
  preferredTimeframes?: string[]
  commonThemes?: string[]
}

/**
 * Generate a personalized opening message based on user context
 */
function getPersonalizedOpening(params: {
  userName: string
  personaId: string
  selectedInterests?: string[]
  isReturningUser?: boolean
  frequentlyMentionedPeople?: string[]
  preferredTimeframes?: string[]
  commonThemes?: string[]
}): string {
  const {
    userName,
    personaId,
    selectedInterests = [],
    isReturningUser = false,
    frequentlyMentionedPeople = [],
    preferredTimeframes = [],
    commonThemes = []
  } = params

  // Use the prompt selector to get a personalized opening
  const openingMessage = generateOpeningMessage({
    isNewUser: !isReturningUser,
    userName,
    selectedInterests,
    frequentlyMentionedPeople,
    preferredTimeframes,
    commonThemes
  })

  // Add persona-specific opening flavor based on new archetype system
  const personaFlavors: Record<string, string> = {
    ember: '', // Default Ember uses the opening as-is
    warmWitness: `${userName}, before we begin - I want you to know this is all about what YOU want to share. `,
    gentleExcavator: `${userName}, I'm so glad you're here. `,
    curiousCompanion: `Hey ${userName}! `,
    intimateExplorer: `${userName}, thank you for being here. `,
    playfulFriend: `Alright ${userName}, let's do this! `,
    griefHolder: `${userName}, I'm here. Take all the time you need. `,
    wiseElder: `Oh, ${userName}, sweetheart, how lovely to see you. `,
    fascinatedYouth: `${userName}! I'm so excited to hear your stories! `
  }

  const flavor = personaFlavors[personaId] || ''

  return flavor + openingMessage
}

/**
 * Add user-specific context to the system prompt
 *
 * Note: The core therapeutic rules (Five Sacred Rules, emotional state responses,
 * response format) are now embedded in EMBER_CORE_IDENTITY in definitions.ts.
 * This function only adds dynamic user context on top of that foundation.
 */
function addUserContext(params: {
  basePrompt: string
  selectedInterests?: string[]
  userContext?: {
    frequentlyMentionedPeople?: string[]
    preferredTimeframes?: string[]
    commonThemes?: string[]
  }
}): string {
  const { basePrompt, selectedInterests = [], userContext } = params

  // Build user-specific context additions
  const contextParts: string[] = []

  if (selectedInterests.length > 0) {
    contextParts.push(`USER'S SELECTED STORY INTERESTS: ${selectedInterests.join(', ')}. When natural, gently guide toward these topics - but always follow their lead.`)
  }

  if (userContext?.frequentlyMentionedPeople?.length) {
    contextParts.push(`PEOPLE THEY'VE MENTIONED BEFORE: ${userContext.frequentlyMentionedPeople.join(', ')}. Reference these naturally to show you remember their stories.`)
  }

  if (userContext?.preferredTimeframes?.length) {
    contextParts.push(`TIMEFRAMES THEY ENJOY DISCUSSING: ${userContext.preferredTimeframes.join(', ')}.`)
  }

  if (userContext?.commonThemes?.length) {
    contextParts.push(`RECURRING THEMES IN THEIR STORIES: ${userContext.commonThemes.join(', ')}. These are meaningful to them.`)
  }

  // Only add the context section if there's actually context to add
  if (contextParts.length === 0) {
    return basePrompt
  }

  const contextAddition = `

ADDITIONAL USER CONTEXT (use this to personalize your responses):
${contextParts.join('\n')}`

  return basePrompt + contextAddition
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequestBody = await request.json()
    const {
      messages,
      userName = 'friend',
      isFirstMessage = false,
      persona = DEFAULT_PERSONA,
      selectedInterests = [],
      isReturningUser = false,
      frequentlyMentionedPeople = [],
      preferredTimeframes = [],
      commonThemes = []
    } = body

    // Get persona-specific prompt
    const personaData = getPersona(persona)
    const basePrompt = getPersonaPrompt(persona, userName)

    // Add user-specific context (core therapeutic rules are now in EMBER_CORE_IDENTITY)
    const systemPrompt = addUserContext({
      basePrompt,
      selectedInterests,
      userContext: {
        frequentlyMentionedPeople,
        preferredTimeframes,
        commonThemes
      }
    })

    const systemMessage = {
      role: 'system' as const,
      content: systemPrompt
    }

    // Convert messages to OpenAI format
    const conversationHistory = messages.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }))

    // If first message, add personalized opening
    if (isFirstMessage && conversationHistory.length === 1) {
      const openingContent = getPersonalizedOpening({
        userName,
        personaId: personaData.id,
        selectedInterests,
        isReturningUser,
        frequentlyMentionedPeople,
        preferredTimeframes,
        commonThemes
      })

      conversationHistory.unshift({
        role: 'assistant',
        content: openingContent
      })
    }

    const openai = getOpenAIClient()
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [systemMessage, ...conversationHistory],
      temperature: 0.75, // Slightly higher for more natural conversation
      max_tokens: 300,
      presence_penalty: 0.6,
      frequency_penalty: 0.3
    })

    const responseMessage = completion.choices[0]?.message?.content || ''

    // Analyze response to suggest chapter
    let suggestedChapter: ChapterType | undefined = undefined
    const content = messages.map((m) => m.content).join(' ').toLowerCase()

    // Enhanced chapter detection
    const chapterKeywords: Record<ChapterType, string[]> = {
      'who-i-am': ['identity', 'values', 'character', 'personality', 'beliefs', 'who i am', 'defines me'],
      'where-i-come-from': ['childhood', 'grew up', 'parents', 'hometown', 'origins', 'family background', 'heritage', 'roots'],
      'what-ive-loved': ['love', 'joy', 'happy', 'passion', 'favorite', 'cherish', 'beloved', 'treasure'],
      'whats-been-hard': ['hard', 'difficult', 'challenge', 'struggle', 'grief', 'loss', 'overcome', 'tough'],
      'what-ive-learned': ['learn', 'wisdom', 'advice', 'lesson', 'realize', 'understand', 'insight', 'growth'],
      'what-im-still-figuring-out': ['wonder', 'question', 'unsure', 'exploring', 'future', 'hope', 'dream'],
      'what-i-want-you-to-know': ['legacy', 'remember', 'important', 'message', 'tell you', 'want you to know', 'advice for']
    }

    for (const [chapter, keywords] of Object.entries(chapterKeywords)) {
      if (keywords.some(keyword => content.includes(keyword))) {
        suggestedChapter = chapter as ChapterType
        break
      }
    }

    const response: ChatResponse = {
      message: responseMessage,
      suggestedChapter
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Chat API error:', error)

    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'API configuration error. Please try again later.' },
          { status: 500 }
        )
      }
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Too many requests. Please wait a moment and try again.' },
          { status: 429 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
