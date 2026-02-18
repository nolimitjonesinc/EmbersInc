import { NextRequest, NextResponse } from 'next/server'
import { getOpenAIClient } from '@/lib/openai/client'
import { RateLimitError, AuthenticationError, APIError } from 'openai'
import { getPersonaPrompt, getPersona, DEFAULT_PERSONA } from '@/lib/personas/definitions'
import { Message, ChatResponse, ChapterType } from '@/types'
import {
  generateOpeningMessage,
  getRandomWarmPrompt,
  getPromptsForInterests,
  getGentleEncouragement
} from '@/lib/prompts/promptSelector'
import { detectEmotionalState } from '@/lib/services/emotionalStateDetector'
import { allWarmPrompts } from '@/lib/prompts/warmEngagementPrompts'
import { softAuth } from '@/lib/auth/getAuthContext'
import { validateChatInput } from '@/lib/auth/validateChatInput'
import { trimConversationHistory } from '@/lib/chat/trimConversationHistory'
import { ERROR_MESSAGES } from '@/lib/errors/messages'

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
  memoryContext?: string // Compact memory context from ConversationMemory
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
    ember: '', // Default Embers uses the opening as-is
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
  memoryContext?: string
  lastUserMessage?: string
  userContext?: {
    frequentlyMentionedPeople?: string[]
    preferredTimeframes?: string[]
    commonThemes?: string[]
  }
}): string {
  const { basePrompt, selectedInterests = [], memoryContext, lastUserMessage, userContext } = params

  // Build user-specific context additions
  const contextParts: string[] = []

  // Emotional state detection — scan the last user message for emotional signals
  if (lastUserMessage) {
    const emotionalResult = detectEmotionalState(lastUserMessage)
    if (emotionalResult) {
      contextParts.push(`EMOTIONAL STATE DETECTED (${emotionalResult.state.toUpperCase()}): ${emotionalResult.guidance}`)
    }
  }

  // Memory system context (extracted from conversation — people, topics, emotions, questions asked)
  if (memoryContext && memoryContext.trim()) {
    contextParts.push(`CONVERSATION MEMORY (what you already know — do NOT re-ask these questions):\n${memoryContext.slice(0, 2000)}`)
  }

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
    // Auth + rate limiting (allows anonymous but rate-limits harder)
    const authResult = await softAuth(request)
    if (authResult instanceof NextResponse) return authResult

    let body: ChatRequestBody
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: ERROR_MESSAGES.invalidInput },
        { status: 400 }
      )
    }

    // Input validation — block system role injection, cap lengths
    const validation = validateChatInput(body.messages)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Use validated+sanitized messages, not raw input
    const messages = validation.sanitizedMessages!
    const {
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

    // Extract the last user message for emotional state detection
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content

    // Add user-specific context (core therapeutic rules are now in EMBER_CORE_IDENTITY)
    const systemPrompt = addUserContext({
      basePrompt,
      selectedInterests,
      memoryContext: body.memoryContext,
      lastUserMessage,
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

    // Convert messages to OpenAI format, then trim to token budget
    const fullHistory = messages.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }))
    const conversationHistory = trimConversationHistory(fullHistory)

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

    const responseMessage = completion.choices[0]?.message?.content

    if (!responseMessage) {
      return NextResponse.json(
        { error: 'I had trouble responding. Could you try saying that again?' },
        { status: 502 }
      )
    }

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

    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.tooManyRequests },
        { status: 429 }
      )
    }

    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.aiConfig },
        { status: 500 }
      )
    }

    if (error instanceof APIError) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.aiThinking },
        { status: error.status || 502 }
      )
    }

    return NextResponse.json(
      { error: ERROR_MESSAGES.generic },
      { status: 500 }
    )
  }
}
